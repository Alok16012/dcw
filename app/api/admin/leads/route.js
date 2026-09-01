import { listLeads, leadActivity } from '@/lib/integrations/crm.js';
import { requireRole } from '@/lib/auth.js';
import { ok } from '@/lib/http.js';

/** Counselling leads (Sky-High CRM). Admin only — employers never see these. */
export async function GET(request) {
  const { error } = requireRole(request, ['admin']);
  if (error) return error;
  const rows = listLeads().map(l => ({ ...l, activity: leadActivity(l.id).length }));
  return ok({ rows, total: rows.length });
}
