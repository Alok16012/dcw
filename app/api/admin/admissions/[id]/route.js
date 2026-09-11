import { getAdmission, setStatus, addNote, assignCounsellor, admissionActivity,
  allowedTransitions } from '@/lib/integrations/admissions.js';
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
  const application = getAdmission(id);
  if (!application) return { error: fail(404, 'NOT_FOUND', `No admission "${id}".`) };
  return { session, application };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, application } = resolve(request, id);
  if (error) return error;
  ensureSeeded();
  const plan = planForApplication(application.id);
  return ok({
    application,
    activity: admissionActivity(application.id),
    allowed: allowedTransitions(application.status),
    fee: plan ? { ...plan, paid: paidOf(plan), outstanding: outstandingOf(plan), next: nextDue(plan) } : null
  });
}

/**
 * One endpoint for the three things a counsellor does to a file: move it,
 * annotate it, hand it to someone else. They arrive together because the UI
 * sends them together — a stage change usually carries a note.
 */
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, application, session } = resolve(request, id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

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
  return ok({ application: fresh, moved, notified, allowed: allowedTransitions(fresh.status) });
}
