/**
 * PRD §8.2 — the single reusable lead endpoint. Routes to the CRM that owns the
 * vertical: distance and colleges to the shared education pipeline, jobs to
 * Berojgar Bharat's own.
 *
 * POST only. This route used to also export a GET that returned every lead in
 * the business — name, phone number, qualification — to any unauthenticated
 * caller. Reading leads now goes through /api/admin/leads, which checks the
 * session and applies the pipeline scope.
 */
import { upsertLead } from '@/lib/integrations/crm.js';
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
  // Contact permission is a precondition, not a field to record after the fact:
  // without it there is no lawful basis to hand the number to a counsellor, so
  // the lead is refused rather than created and flagged.
  if (body.consent?.contact !== true) {
    return fail(422, 'CONSENT_REQUIRED', 'Tick the contact permission before submitting.');
  }

  const { lead, duplicate, assignedTo, crm } = upsertLead({
    vertical: body.vertical, name: body.name.trim(), phone: body.phone,
    // One source of truth for the channel: the permission the person gave.
    whatsappSame: body.consent.whatsapp === true,
    city: body.city, qualification: body.qualification,
    interestType: body.interestType ?? 'general', interestId: body.interestId ?? null,
    // The form has always sent this; the route used to drop it silently.
    course: typeof body.course === 'string' && body.course.trim() ? body.course.trim() : null,
    associateCode: body.associateCode ?? null, phoneVerified: true,
    consent: {
      contact: true, whatsapp: body.consent.whatsapp === true,
      text: typeof body.consent.text === 'string' ? body.consent.text : null,
      at: new Date().toISOString()
    },
    source: {
      url: body.source?.url ?? null, device: body.source?.device ?? null,
      utm_source: body.source?.utm_source ?? null, utm_medium: body.source?.utm_medium ?? null,
      utm_campaign: body.source?.utm_campaign ?? null
    }
  });

  // WhatsApp is a separate opt-in. Confirming an enquiry the person asked for
  // does not license a message on a channel they declined.
  const wa = lead.consent?.whatsapp
    ? sendTemplate({ phone: lead.phone, template: 'lead_confirmation',
        // The message is filed against the lead in the pipeline that produced
        // it, so the conversation history stays on the right side of the wall.
        crm, leadId: lead.id,
        vars: { name: lead.name, interest: lead.course ?? lead.interestId ?? lead.interestType } })
    : { queued: false, skipped: 'no_whatsapp_consent' };

  return ok({ lead: { id: lead.id, crmLeadId: lead.crmLeadId, crm, status: lead.status, assignedTo, enquiryCount: lead.enquiryCount },
    duplicate, whatsapp: wa.queued });
}
