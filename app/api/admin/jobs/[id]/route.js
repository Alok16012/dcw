import { findJob, updateJob, deleteJob } from '@/lib/jobs-repo.js';
import { listApplications, pipelineStats } from '@/lib/integrations/ats.js';
import { requireRole, scopeToCompany } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

/** Shared guard: resolves the job and refuses cross-company access. */
function resolve(request, id, roles = ['admin', 'employer']) {
  const { error, session } = requireRole(request, roles);
  if (error) return { error };
  const job = findJob(id);
  if (!job) return { error: fail(404, 'NOT_FOUND', `No job "${id}".`) };
  const company = scopeToCompany(session);
  if (company && job.companyId !== company) {
    return { error: fail(403, 'FORBIDDEN', 'This posting belongs to another company.') };
  }
  return { session, job };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, job } = resolve(request, id);
  if (error) return error;
  ensureSeeded();
  return ok({ job, applications: listApplications({ jobId: job.id }), pipeline: pipelineStats({ jobId: job.id }) });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, job, session } = resolve(request, id);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = updateJob(job.id, body, { actor: session.name });
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', 'Job disappeared.');
  }
  return ok({ job: result.job });
}

/** Soft delete (deactivate) by default; ?hard=true removes the row entirely. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, job } = resolve(request, id, ['admin']);
  if (error) return error;

  const hard = request.nextUrl.searchParams.get('hard') === 'true';
  const result = deleteJob(job.id, { hard });
  if (!result.ok) return fail(404, 'NOT_FOUND', 'Job disappeared.');
  return ok({ job: result.job, hard: result.hard });
}
