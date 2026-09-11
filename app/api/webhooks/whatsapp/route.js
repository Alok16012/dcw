/**
 * WhatsApp Cloud API webhook.
 *
 * GET  the one-time verification handshake Meta performs when the callback URL
 *      is saved in the app dashboard. It echoes `hub.challenge` back, but only
 *      when `hub.verify_token` matches WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 * POST inbound messages and delivery receipts.
 *
 * Which pipeline an inbound message belongs to is decided by which of our
 * numbers it arrived on (`metadata.phone_number_id`), not by anything in the
 * message — that is what keeps a Berojgar Bharat reply out of the education
 * desk's history.
 *
 * SIGNATURE VERIFICATION. Meta signs each delivery with X-Hub-Signature-256 over
 * the raw body, keyed by the app secret. It is checked here when
 * WHATSAPP_APP_SECRET is set, and the request is refused when it does not match.
 * Without that variable the endpoint accepts unsigned calls so the demo driver
 * is testable — which is exactly why it must be set before going live.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { recordInbound } from '@/lib/integrations/whatsapp.js';
import { CRM_EDUCATION, CRM_BEROJGAR } from '@/lib/integrations/crm.js';
import { ok, fail } from '@/lib/http.js';

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!expected) return fail(503, 'NOT_CONFIGURED', 'Set WHATSAPP_WEBHOOK_VERIFY_TOKEN to enable the webhook.');
  if (sp.get('hub.mode') === 'subscribe' && sp.get('hub.verify_token') === expected) {
    // Meta expects the bare challenge as text/plain, not a JSON envelope.
    return new Response(sp.get('hub.challenge') ?? '', { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return fail(403, 'BAD_VERIFY_TOKEN', 'Verification token did not match.');
}

function signatureValid(raw, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;            // demo/unconfigured: see the note above
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(header.slice(7)), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Our number → the pipeline that owns it. */
const crmForSender = phoneNumberId =>
  (phoneNumberId && phoneNumberId === process.env.BB_WHATSAPP_PHONE_NUMBER_ID) ? CRM_BEROJGAR : CRM_EDUCATION;

export async function POST(request) {
  // Read as text first: the signature is over the exact bytes Meta sent, so
  // parsing and re-serialising would break the comparison.
  const raw = await request.text();
  if (!signatureValid(raw, request.headers.get('x-hub-signature-256'))) {
    return fail(401, 'BAD_SIGNATURE', 'Payload signature did not verify.');
  }

  let payload;
  try { payload = JSON.parse(raw); } catch { return fail(400, 'BAD_JSON', 'Body must be JSON.'); }

  const recorded = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const crm = crmForSender(value.metadata?.phone_number_id);
      for (const m of value.messages ?? []) {
        recorded.push(recordInbound({
          phone: m.from,
          body: m.text?.body ?? `[${m.type}]`,
          crm,
          providerId: m.id ?? null
        }));
      }
    }
  }
  // Always 200 on a verified delivery. A non-2xx makes Meta retry, and a retry
  // storm over one malformed message costs more than dropping it.
  return ok({ received: recorded.length });
}
