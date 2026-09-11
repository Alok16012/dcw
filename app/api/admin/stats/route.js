import { jobStats } from '@/lib/jobs-repo.js';
import { pipelineStats, listApplications } from '@/lib/integrations/ats.js';
import { pipelineStats as admissionStats, listAdmissions } from '@/lib/integrations/admissions.js';
import { catalogueStats } from '@/lib/institutions-repo.js';
import { collectionSummary, monthlyBook } from '@/lib/fees.js';
import { listLeads } from '@/lib/integrations/crm.js';
import { listReviews } from '@/lib/reviews-repo.js';
import { requireRole, scopeToCompany, crmsFor, scopeToAssociate, can } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const { error, session } = requireRole(request, ['admin', 'employer', 'staff', 'associate']);
  if (error) return error;
  ensureSeeded();
  // Every figure here is scoped to the caller. An employer's dashboard must
  // report on its own hiring only — `recent` in particular carries candidate
  // names and phone numbers.
  const companyId = scopeToCompany(session);
  const isAdmin = session.role === 'admin';
  // The lead badge counts only what this session's pipelines actually hold, so
  // a staff account on the education desk never sees a Berojgar Bharat total.
  const leadCount = can(session, 'leads:read:own')
    ? listLeads({ crms: crmsFor(session), associateCode: scopeToAssociate(session) ?? undefined }).length
    : null;

  return ok({
    jobs: jobStats(companyId),
    pipeline: pipelineStats({ companyId }),
    leads: leadCount,
    recent: can(session, 'applications:read:own') ? listApplications(companyId ? { companyId } : {}).slice(0, 8) : [],
    /* The education half of the business. An employer sees none of it: the
       catalogue, the counselling pipeline and the fee book are DCW's, not
       theirs, and `recentAdmissions` carries student contact details. Staff run
       the catalogue, so they get those two; the fee book stays with admin. */
    catalogue: can(session, 'catalogue:read') ? catalogueStats() : null,
    // How many public reviews are waiting on a moderator. A queue, so the rail
    // badges it; zero is left undefined so no badge is drawn.
    reviewsPending: can(session, 'catalogue:write')
      ? listReviews({ includeUnpublished: true }).filter(r => r.status === 'pending').length
      : null,
    admissions: can(session, 'applications:read') ? admissionStats() : null,
    recentAdmissions: can(session, 'applications:read') ? listAdmissions().slice(0, 8) : null,
    fees: isAdmin ? collectionSummary() : null,
    feeBook: isAdmin ? monthlyBook({ months: 6 }) : null
  });
}
