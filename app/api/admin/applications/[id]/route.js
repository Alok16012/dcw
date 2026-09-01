import { getApplication, applicationActivity, setStatus, addNote, rateApplication, allowedTransitions } from '@/lib/integrations/ats.js';
import { findJob } from '@/lib/jobs-repo.js';
import { requireRole, scopeToCompany } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

function resolve(request, id) {
  const { error, session } = requireRole(request, ['admin', 'employer']);
  if (error) return { error };
  const application = getApplication(id);
  if (!application) return { error: fail(404, 'NOT_FOUND', `No application "${id}".`) };
  const company = scopeToCompany(session);
  if (company && (findJob(application.jobId)?.companyId ?? null) !== company) {
    return { error: fail(403, 'FORBIDDEN', 'This candidate applied to another company.') };
  }
  return { session, application };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, application } = resolve(request, id);
  if (error) return error;
  return ok({
    application,
    activity: applicationActivity(application.id),
    allowed: allowedTransitions(application.status)
  });
}

/** One endpoint for the three recruiter actions: move stage, note, rate. */
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, application, session } = resolve(request, id);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const actor = session.name;

  if (body.status) {
    const r = setStatus(application.id, body.status, { note: body.note, actor });
    if (!r.ok) {
      return r.error === 'ILLEGAL_TRANSITION'
        ? fail(409, r.error, `Cannot move ${r.from} → ${body.status}.`, { allowed: r.allowed })
        : fail(422, r.error, 'Unknown status.', { allowed: r.allowed });
    }
    return ok({ application: r.application, allowed: allowedTransitions(r.application.status) });
  }
  if (body.rating !== undefined) {
    const r = rateApplication(application.id, body.rating, { actor });
    if (!r.ok) return fail(422, r.error, 'Rating must be a whole number from 1 to 5.');
    return ok({ application: r.application });
  }
  if (body.note) {
    const r = addNote(application.id, body.note, { actor });
    if (!r.ok) return fail(422, r.error, 'Note cannot be empty.');
    return ok({ application: r.application });
  }
  return fail(422, 'NO_ACTION', 'Provide one of: status, rating, note.');
}
