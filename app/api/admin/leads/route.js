import { listLeads, leadActivity, crmSummary } from '@/lib/integrations/crm.js';
import { requirePermission, crmsFor, scopeToAssociate } from '@/lib/auth.js';
import { ok } from '@/lib/http.js';

/**
 * Counselling leads.
 *
 * The pipeline separation is applied here, from the signed session, and there is
 * no parameter that widens it: `?crm=berojgar` from a staff account scoped to
 * education narrows the response to nothing rather than reaching across. An
 * associate additionally sees only the leads their own referral code produced.
 */
export async function GET(request) {
  const { error, session } = requirePermission(request, 'leads:read:own');
  if (error) return error;

  const allowed = crmsFor(session);
  const asked = request.nextUrl.searchParams.get('crm');
  const crms = asked ? allowed.filter(c => c === asked) : allowed;

  const scope = { crms, associateCode: scopeToAssociate(session) ?? undefined };
  const rows = listLeads(scope).map(l => ({ ...l, activity: leadActivity(l.id, { crms }).length }));
  return ok({ rows, total: rows.length, crms: crmSummary(allowed), activeCrm: asked ?? null });
}
