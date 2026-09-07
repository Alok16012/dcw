import { jobStats } from '@/lib/jobs-repo.js';
import { pipelineStats, listApplications } from '@/lib/integrations/ats.js';
import { pipelineStats as admissionStats, listAdmissions } from '@/lib/integrations/admissions.js';
import { catalogueStats } from '@/lib/institutions-repo.js';
import { collectionSummary, monthlyBook } from '@/lib/fees.js';
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
  const isAdmin = session.role === 'admin';

  return ok({
    jobs: jobStats(companyId),
    pipeline: pipelineStats({ companyId }),
    leads: isAdmin ? listLeads().length : null,
    recent: listApplications(companyId ? { companyId } : {}).slice(0, 8),
    /* The education half of the business. An employer sees none of it: the
       catalogue, the counselling pipeline and the fee book are DCW's, not
       theirs, and `recentAdmissions` carries student contact details. */
    catalogue: isAdmin ? catalogueStats() : null,
    admissions: isAdmin ? admissionStats() : null,
    recentAdmissions: isAdmin ? listAdmissions().slice(0, 8) : null,
    fees: isAdmin ? collectionSummary() : null,
    feeBook: isAdmin ? monthlyBook({ months: 6 }) : null
  });
}
