import { jobStats } from '@/lib/jobs-repo.js';
import { pipelineStats, listApplications } from '@/lib/integrations/ats.js';
import { listLeads } from '@/lib/integrations/crm.js';
import { requireRole, scopeToCompany } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const { error, session } = requireRole(request, ['admin', 'employer']);
  if (error) return error;
  ensureSeeded();
  // Every figure here is scoped to the caller. An employer's dashboard must
  // report on its own hiring only — `recent` in particular carries candidate
  // names and phone numbers.
  const companyId = scopeToCompany(session);
  return ok({
    jobs: jobStats(companyId),
    pipeline: pipelineStats({ companyId }),
    leads: session.role === 'admin' ? listLeads().length : null,
    recent: listApplications(companyId ? { companyId } : {}).slice(0, 8)
  });
}
