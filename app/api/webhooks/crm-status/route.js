/** Inbound from Sky-High (PRD §8.3). Shared-secret guarded. */
import { applyStatusChange } from '@/lib/integrations/crm.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (secret && request.headers.get('x-dcw-signature') !== secret) {
    return fail(401, 'UNAUTHORIZED', 'Invalid webhook signature.');
  }
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const res = applyStatusChange({ crmLeadId: body.crmLeadId, status: body.status, note: body.note });
  if (!res.ok) return fail(res.error === 'UNKNOWN_LEAD' ? 404 : 422, res.error, 'Could not apply status change.', res.allowed ? { allowed: res.allowed } : {});

  const wa = sendTemplate({ phone: res.lead.phone, template: 'application_status', vars: { status: res.lead.status } });
  return ok({ lead: { id: res.lead.id, status: res.lead.status }, whatsapp: wa.queued });
}
