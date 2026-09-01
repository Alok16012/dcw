/** PRD §8.2 — the single reusable lead endpoint. Forwards to Sky-High. */
import { upsertLead, listLeads } from '@/lib/integrations/crm.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
import { isValidPhone, isPhoneVerified } from '@/lib/integrations/otp.js';
import { ok, fail, readJson, VERTICAL_SET } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  if (!VERTICAL_SET.has(body.vertical)) return fail(422, 'INVALID_VERTICAL', 'vertical must be distance, colleges or jobs.');
  if (!body.name?.trim()) return fail(422, 'NAME_REQUIRED', 'Name is required.');
  if (!isValidPhone(body.phone)) return fail(422, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');
  // Checked against the OTP store, not against the flag in the request: a
  // caller can set phoneVerified to anything it likes.
  if (!isPhoneVerified(body.phone)) return fail(422, 'OTP_REQUIRED', 'Verify the mobile number before submitting.');

  const { lead, duplicate, assignedTo } = upsertLead({
    vertical: body.vertical, name: body.name.trim(), phone: body.phone,
    whatsappSame: body.whatsappSame, city: body.city, qualification: body.qualification,
    interestType: body.interestType ?? 'general', interestId: body.interestId ?? null,
    associateCode: body.associateCode ?? null, phoneVerified: true,
    source: {
      url: body.source?.url ?? null, device: body.source?.device ?? null,
      utm_source: body.source?.utm_source ?? null, utm_medium: body.source?.utm_medium ?? null,
      utm_campaign: body.source?.utm_campaign ?? null
    }
  });

  const wa = sendTemplate({ phone: lead.phone, template: 'lead_confirmation',
    vars: { name: lead.name, interest: lead.interestId ?? lead.interestType } });

  return ok({ lead: { id: lead.id, crmLeadId: lead.crmLeadId, status: lead.status, assignedTo, enquiryCount: lead.enquiryCount },
    duplicate, whatsapp: wa.queued });
}

/** Read-only mirror for the admin/leads view. Sky-High stays the source of truth. */
export async function GET() {
  return ok({ leads: listLeads(), note: 'Demo mirror. Sky-High CRM is the system of record.' });
}
