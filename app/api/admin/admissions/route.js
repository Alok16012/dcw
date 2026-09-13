/**
 * The counselling pipeline console.
 *
 * Its recruiting counterpart is /api/admin/applications (ATS). This one covers
 * the education side, where the stages are documents and verification rather
 * than interviews, and where money follows the file — so each row carries its
 * fee position with it.
 */
import { listAdmissions, pipelineStats, createAdmission, ALL_STATUSES, STAGES } from '@/lib/integrations/admissions.js';
import { planForApplication, createPlan, outstandingOf, paidOf } from '@/lib/fees.js';
import { findInstitution, findCourse, listInstitutions } from '@/lib/institutions-repo.js';
import { getOptions } from '@/lib/option-lists.js';
import { requireRole } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requireRole(request, ['admin']);
  if (error) return error;
  ensureSeeded();

  const sp = request.nextUrl.searchParams;
  const rows = listAdmissions({
    institutionId: sp.get('institutionId') ?? undefined,
    vertical: sp.get('vertical') ?? undefined,
    status: sp.get('status') ?? undefined,
    branch: sp.get('branch') ?? undefined,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined
  }).map(a => {
    const plan = planForApplication(a.id);
    return { ...a, fee: plan
      ? { planId: plan.id, totalFee: plan.totalFee, paid: paidOf(plan), outstanding: outstandingOf(plan) }
      : null };
  });

  return ok({
    rows,
    pipeline: pipelineStats({
      institutionId: sp.get('institutionId') ?? undefined,
      vertical: sp.get('vertical') ?? undefined
    }),
    stages: STAGES,
    statuses: ALL_STATUSES,
    // Everything the Students screen needs to render its own filters and its
    // add form, in the same request as the rows: the institutions a student can
    // be attached to with their live courses, and the editable vocabularies.
    institutions: listInstitutions({ includeInactive: true }).map(i => ({
      id: i.id, name: i.name, vertical: i.vertical,
      courses: i.courses.filter(c => c.isActive !== false)
        .map(c => ({ id: c.id, name: c.name, stream: c.stream, totalFee: c.totalFee, level: c.level }))
    })),
    branches: getOptions('course.stream'),
    qualifications: getOptions('student.qualification'),
    counsellors: getOptions('student.counsellor')
  });
}

/**
 * Adds a student from the console.
 *
 * `courses` is an array because the add form offers a multi-select with a
 * "select all" — one student applying to three courses at the same university
 * is three files in the pipeline, each with its own stage and its own fee
 * schedule, exactly as it would be if they had applied on the public site.
 * A single `course` string is still accepted for anything posting the old shape.
 */
export async function POST(request) {
  const { error, session } = requireRole(request, ['admin']);
  if (error) return error;
  ensureSeeded();

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const institution = body.institutionId ? findInstitution(body.institutionId) : null;
  if (body.institutionId && !institution) {
    return fail(404, 'NOT_FOUND', `No institution "${body.institutionId}".`);
  }

  const asked = Array.isArray(body.courses) && body.courses.length ? body.courses
    : body.course != null ? [body.course] : [null];
  const live = institution ? institution.courses.filter(c => c.isActive !== false) : [];
  if (institution && asked.length > Math.max(live.length, 1)) {
    return fail(422, 'TOO_MANY_COURSES', `${institution.name} lists ${live.length} live course(s).`);
  }

  const created = [];
  const failures = [];
  for (const raw of asked) {
    const row = institution && raw ? findCourse(institution.id, raw) : null;
    const name = row?.name ?? (typeof raw === 'string' && raw.trim() ? raw.trim() : null);
    if (created.some(c => (c.course ?? '').toLowerCase() === (name ?? '').toLowerCase())) continue;

    const result = createAdmission({
      vertical: body.vertical === 'colleges' ? 'colleges' : 'distance',
      institutionId: institution?.id ?? null, institutionName: institution?.name ?? null,
      course: name, courseFee: row?.totalFee ?? (Number(body.courseFee ?? 0) || 0),
      branch: body.branch ?? row?.stream ?? null,
      name: body.name, phone: body.phone, email: body.email, city: body.city,
      qualification: body.qualification, counsellor: body.counsellor ?? null,
      status: body.status ?? 'Applied',
      source: { url: '/admin/students', enteredBy: session.name }
    }, { actor: session.name });

    // The first failure is a validation failure and stops everything — the same
    // name and number are being used for every row, so if one is refused they
    // all would be. A duplicate is not a failure: it means this student is
    // already on that course, and the other courses in the batch still file.
    if (!result.ok) {
      if (!created.length) {
        return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
      }
      failures.push({ course: name, errors: result.errors });
      continue;
    }
    if (result.duplicate) { failures.push({ course: name, duplicate: true }); continue; }

    if (row?.totalFee) {
      createPlan({ applicationId: result.application.id, phone: result.application.phone,
        name: result.application.name, institutionId: institution.id,
        institutionName: institution.name, course: row.name, totalFee: row.totalFee });
    }
    created.push(result.application);
  }

  if (!created.length) {
    return fail(409, 'ALREADY_EXISTS',
      'This student is already on file for every course selected.', { failures });
  }
  return ok({ created, skipped: failures }, { status: 201 });
}
