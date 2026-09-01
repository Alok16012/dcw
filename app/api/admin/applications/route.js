import { listApplications, pipelineStats, STAGES, CLOSED } from '@/lib/integrations/ats.js';
import { findJob } from '@/lib/jobs-repo.js';
import { requireRole, scopeToCompany } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const { error, session } = requireRole(request, ['admin', 'employer']);
  if (error) return error;
  ensureSeeded();

  const p = request.nextUrl.searchParams;
  let rows = listApplications({
    jobId: p.get('jobId') ?? undefined,
    status: p.get('status') ?? undefined,
    q: p.get('q') ?? undefined,
    sort: p.get('sort') ?? undefined
  });

  const company = scopeToCompany(session);
  if (company) rows = rows.filter(a => (findJob(a.jobId)?.companyId ?? null) === company);

  return ok({ rows, stats: pipelineStats({ jobId: p.get('jobId') ?? undefined, companyId: company ?? undefined }), stages: STAGES, closed: CLOSED });
}
