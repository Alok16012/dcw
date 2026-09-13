import { getAdmission, setStatus, addNote, assignCounsellor, admissionActivity,
  updateAdmission, allowedTransitions, ALL_STATUSES } from '@/lib/integrations/admissions.js';
import { listInstitutions } from '@/lib/institutions-repo.js';
import { getOptions } from '@/lib/option-lists.js';
import { planForApplication, outstandingOf, paidOf, nextDue } from '@/lib/fees.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
// Admissions are the education side of the business, so their messages file
// against the shared DCW + Colleges Wala pipeline.
import { CRM_EDUCATION } from '@/lib/integrations/crm.js';
import { requireRole } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

function resolve(request, id) {
  const { error, session } = requireRole(request, ['admin']);
  if (error) return { error };
  /* Before the lookup, not after it. The stores live in process memory, and this
     route is the first thing to touch them when someone opens a student file in
     a fresh worker — seeding afterwards meant a real id came back "no longer
     exists" until the list route happened to run first. */
  ensureSeeded();
  const application = getAdmission(id);
  if (!application) return { error: fail(404, 'NOT_FOUND', `No admission "${id}".`) };
  return { session, application };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, application } = resolve(request, id);
  if (error) return error;
  const plan = planForApplication(application.id);
  return ok({
    application,
    activity: admissionActivity(application.id),
    allowed: allowedTransitions(application.status),
    fee: plan ? { ...plan, paid: paidOf(plan), outstanding: outstandingOf(plan), next: nextDue(plan) } : null,
    // The edit screen shows every field the record holds, so it needs every list
    // those fields are chosen from. Sent with the record rather than fetched
    // separately: one request, and the form cannot render before its own options
    // have arrived and flash a blank select over a value that is really there.
    institutions: listInstitutions({ includeInactive: true }).map(i => ({
      id: i.id, name: i.name, vertical: i.vertical,
      courses: i.courses.filter(c => c.isActive !== false)
        .map(c => ({ id: c.id, name: c.name, stream: c.stream, totalFee: c.totalFee, level: c.level }))
    })),
    statuses: ALL_STATUSES,
    branches: getOptions('course.stream'),
    qualifications: getOptions('student.qualification'),
    counsellors: getOptions('student.counsellor')
  });
}

/**
 * One endpoint for everything done to a file: move it, annotate it, hand it to
 * someone else, correct what it says. They arrive together because the UI sends
 * them together — a stage change usually carries a note, and an edit usually
 * carries several fields at once.
 *
 * The field edit runs FIRST and on its own terms. `status` is refused by
 * validateAdmission() and handled below by setStatus(), which is the only thing
 * that knows which transitions are legal; that split is what stops a PATCH
 * carrying {status:'Enrolled'} from skipping document verification.
 */
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, application, session } = resolve(request, id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  let edited = [];
  if (body.fields && typeof body.fields === 'object') {
    const result = updateAdmission(application.id, body.fields, { actor: session.name });
    if (!result.ok) {
      return result.errors
        ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
        : fail(404, 'NOT_FOUND', 'That student file has gone.');
    }
    edited = result.changed;
  }

  let moved = null;
  if (body.status && body.status !== application.status) {
    const result = setStatus(application.id, body.status, { note: body.note, actor: session.name });
    if (!result.ok) {
      return result.error === 'ILLEGAL_TRANSITION'
        ? fail(409, 'ILLEGAL_TRANSITION',
            `Cannot move from ${result.from} to ${body.status}.`, { allowed: result.allowed })
        : fail(422, result.error, 'That status is not one this pipeline uses.', { allowed: result.allowed });
    }
    moved = { from: result.from, to: body.status };
  } else if (body.note) {
    const result = addNote(application.id, body.note, { actor: session.name });
    if (!result.ok) return fail(422, result.error, 'Write something in the note.');
  }
  if (body.counsellor) assignCounsellor(application.id, body.counsellor, { actor: session.name });

  // The applicant hears about a stage change only if they agreed to WhatsApp
  // and only when the stage actually moved.
  const notified = moved && body.notify === true
    ? !!sendTemplate({ phone: application.phone, template: 'application_status',
        crm: CRM_EDUCATION, leadId: application.leadId ?? null,
        vars: { name: application.name, status: moved.to } }).queued
    : false;

  const fresh = getAdmission(application.id);
  return ok({ application: fresh, moved, edited, notified,
    activity: admissionActivity(fresh.id), allowed: allowedTransitions(fresh.status) });
}
