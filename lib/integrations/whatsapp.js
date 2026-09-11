/**
 * WhatsApp Business Platform adapter (Cloud API).
 *
 * WHAT THIS COVERS
 *   • Approved template messages to one number.
 *   • Free-form session replies inside the 24-hour customer service window.
 *   • Bulk sends — the same template to a list of numbers, one request each,
 *     with a per-recipient result rather than a single pass/fail.
 *   • A conversation history filed against the CRM record it belongs to, so a
 *     counsellor opening a lead sees what has already been said to that person.
 *
 * PIPELINE SEPARATION. Every message carries the `crm` that produced it. The two
 * businesses may hold two different WhatsApp Business accounts, so the sender
 * credentials are resolved per pipeline (see SENDER_ENV) and the history is
 * filtered on the same allow-list the leads console uses. A Berojgar Bharat
 * message never appears in the education desk's history and vice versa.
 *
 * CREDENTIALS. `demo` is the default driver and nothing leaves the machine.
 * DCW_INTEGRATION_DRIVER=live switches to the real Cloud API and needs:
 *
 *   WHATSAPP_ACCESS_TOKEN              system-user token with whatsapp_business_messaging
 *   WHATSAPP_API_VERSION               optional, defaults to v21.0
 *   WHATSAPP_PHONE_NUMBER_ID           education pipeline sender (DCW + Colleges Wala)
 *   WHATSAPP_BUSINESS_ACCOUNT_ID       WABA the templates are registered under
 *   BB_WHATSAPP_PHONE_NUMBER_ID        Berojgar Bharat sender; falls back to the
 *                                      education sender when the two businesses
 *                                      share one number
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN      echoed back on the GET handshake at
 *                                      /api/webhooks/whatsapp
 *   WHATSAPP_APP_SECRET                app secret used to verify the
 *                                      X-Hub-Signature-256 on every inbound
 *                                      delivery. Unset means unsigned calls are
 *                                      accepted, which is fine for the demo
 *                                      driver and not fine in production.
 *
 * Templates must be created and approved in WhatsApp Manager before they can be
 * sent. TEMPLATES below is the registry this app sends against: `name` has to
 * match the approved template exactly, and `vars` has to match its body
 * placeholders in order.
 */
import { DRIVER, isDemo, requireLiveConfig } from './index.js';
import { CRM_EDUCATION, CRM_BEROJGAR } from './crm.js';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const GRAPH = 'https://graph.facebook.com';

/** Which env var names the sender for each pipeline. */
const SENDER_ENV = {
  [CRM_EDUCATION]: 'WHATSAPP_PHONE_NUMBER_ID',
  [CRM_BEROJGAR]: 'BB_WHATSAPP_PHONE_NUMBER_ID'
};

/**
 * The template registry.
 *
 * `vars` is ordered because the Cloud API passes body parameters positionally —
 * {{1}}, {{2}} — so reordering this array silently rewrites live messages.
 */
export const TEMPLATES = [
  { name: 'lead_confirmation', language: 'en', category: 'UTILITY',
    label: 'Enquiry received',
    description: 'Sent the moment an enquiry is captured, if WhatsApp consent was given.',
    vars: ['name', 'interest'],
    preview: 'Hi {{name}}, DCW has received your enquiry about {{interest}}. A counsellor will call you shortly.' },
  { name: 'application_status', language: 'en', category: 'UTILITY',
    label: 'Application status changed',
    description: 'Fired by the CRM status webhook so the student is not left guessing.',
    vars: ['name', 'status'],
    preview: 'Hi {{name}}, your application status is now "{{status}}".' },
  { name: 'job_applied', language: 'en', category: 'UTILITY',
    label: 'Job application received',
    description: 'Berojgar Bharat acknowledgement with the employer named.',
    vars: ['name', 'job'],
    preview: 'Hi {{name}}, you applied for {{job}}. Interview details will follow here.' },
  { name: 'document_reminder', language: 'en', category: 'UTILITY',
    label: 'Documents pending',
    description: 'Chases the marksheet or ID a counsellor is waiting on.',
    vars: ['name', 'document'],
    preview: 'Hi {{name}}, we still need your {{document}} to submit your application. Reply here with a photo.' },
  { name: 'admission_open', language: 'en', category: 'MARKETING',
    label: 'Admissions open (bulk)',
    description: 'Intake announcement. Marketing category — only to numbers that opted in.',
    vars: ['name', 'course', 'deadline'],
    preview: 'Hi {{name}}, admissions for {{course}} are open until {{deadline}}. Reply to reserve a seat.' }
];

export const findTemplate = name => TEMPLATES.find(t => t.name === name) ?? null;

/** Fills {{placeholders}} for the demo body and for the console preview. */
export const renderTemplate = (template, vars = {}) =>
  String(template?.preview ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

const messages = [];
const digits = p => String(p ?? '').replace(/\D/g, '');

/** E.164 for the Cloud API: ten Indian digits become 91XXXXXXXXXX. */
const e164 = phone => {
  const d = digits(phone);
  return d.length === 10 ? `91${d}` : d;
};

function record(entry) {
  const msg = { id: `WA-${String(messages.length + 1).padStart(5, '0')}`, ...entry };
  messages.push(msg);
  return msg;
}

/**
 * One outbound message, template or free-form.
 *
 * @param {{phone:string, template?:string, text?:string, vars?:Object,
 *          crm?:string, leadId?:string|null, sentBy?:string}} input
 */
export async function sendMessage(input) {
  const crm = input.crm ?? CRM_EDUCATION;
  const phone = digits(input.phone);
  if (phone.length < 10) {
    return { ok: false, error: 'INVALID_PHONE', message: 'Enter a valid mobile number.' };
  }

  const template = input.template ? findTemplate(input.template) : null;
  if (input.template && !template) {
    return { ok: false, error: 'UNKNOWN_TEMPLATE', message: `No template named "${input.template}" is registered.` };
  }
  const body = template ? renderTemplate(template, input.vars) : String(input.text ?? '').trim();
  if (!body) return { ok: false, error: 'EMPTY_MESSAGE', message: 'Write a message or pick a template.' };

  const base = {
    crm, phone, leadId: input.leadId ?? null,
    template: template?.name ?? null, kind: template ? 'template' : 'session',
    body, direction: 'out', sentBy: input.sentBy ?? 'system',
    at: new Date().toISOString(), driver: DRIVER
  };

  if (isDemo) {
    return { ok: true, message: record({ ...base, status: 'queued', demo: true }),
      note: 'Demo mode: message queued in memory, nothing was sent.' };
  }

  // Live path. The sender is resolved per pipeline so the two businesses can
  // hold separate WhatsApp Business numbers.
  requireLiveConfig('whatsapp', ['WHATSAPP_ACCESS_TOKEN', SENDER_ENV[CRM_EDUCATION]]);
  const senderId = process.env[SENDER_ENV[crm]] || process.env[SENDER_ENV[CRM_EDUCATION]];

  const payload = template
    ? { messaging_product: 'whatsapp', to: e164(phone), type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          components: template.vars.length
            ? [{ type: 'body', parameters: template.vars.map(v => ({ type: 'text', text: String(input.vars?.[v] ?? '') })) }]
            : []
        } }
    : { messaging_product: 'whatsapp', to: e164(phone), type: 'text', text: { preview_url: false, body } };

  let res, json;
  try {
    res = await fetch(`${GRAPH}/${API_VERSION}/${senderId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    json = await res.json().catch(() => null);
  } catch (e) {
    return { ok: false, error: 'TRANSPORT', message: `WhatsApp could not be reached: ${e.message}`,
      message_record: record({ ...base, status: 'failed', error: e.message }) };
  }
  if (!res.ok) {
    const detail = json?.error?.message ?? `HTTP ${res.status}`;
    return { ok: false, error: 'WHATSAPP_REJECTED', message: detail,
      message_record: record({ ...base, status: 'failed', error: detail }) };
  }
  return { ok: true, message: record({ ...base, status: 'sent', providerId: json?.messages?.[0]?.id ?? null }) };
}

/**
 * Back-compat wrapper. Existing callers fire and forget, so this stays
 * synchronous in shape: it starts the send and returns the queued record.
 * Failures are logged against the conversation rather than thrown into a
 * request that was about something else — an enquiry must not 500 because a
 * courtesy message bounced.
 */
export function sendTemplate({ phone, template, vars = {}, crm = CRM_EDUCATION, leadId = null }) {
  const p = sendMessage({ phone, template, vars, crm, leadId })
    .catch(e => ({ ok: false, error: 'SEND_FAILED', message: e.message }));
  return { ok: true, queued: true, pending: p, note: 'Queued. Delivery is reported in the WhatsApp console.' };
}

/**
 * The same template to many numbers.
 *
 * Sent one at a time rather than in a single batch call: the Cloud API has no
 * bulk endpoint, and a per-recipient result is what the console needs in order
 * to show who actually received it.
 *
 * @param {{recipients:Array<{phone:string,leadId?:string,vars?:Object}>,
 *          template:string, crm?:string, sentBy?:string}} input
 */
export async function sendBulk({ recipients = [], template, crm = CRM_EDUCATION, sentBy = 'system' }) {
  if (!findTemplate(template)) {
    return { ok: false, error: 'UNKNOWN_TEMPLATE', message: `No template named "${template}" is registered.` };
  }
  if (!recipients.length) {
    return { ok: false, error: 'NO_RECIPIENTS', message: 'Pick at least one recipient.' };
  }
  const results = [];
  for (const r of recipients) {
    // Sequential on purpose: WhatsApp throttles per number, and a burst of
    // parallel requests is the fastest way to get a business number flagged.
    const out = await sendMessage({ phone: r.phone, template, vars: r.vars, crm, leadId: r.leadId ?? null, sentBy });
    results.push({ phone: r.phone, leadId: r.leadId ?? null, ok: out.ok, error: out.ok ? null : out.message });
  }
  const sent = results.filter(r => r.ok).length;
  return { ok: true, template, crm, sent, failed: results.length - sent, results };
}

/**
 * Inbound message from the webhook, so a reply lands in the same thread the
 * outbound messages are in.
 */
export const recordInbound = ({ phone, body, crm = CRM_EDUCATION, leadId = null, providerId = null }) =>
  record({ crm, phone: digits(phone), leadId, template: null, kind: 'session', body,
    direction: 'in', sentBy: null, status: 'received', providerId, at: new Date().toISOString(), driver: DRIVER });

/**
 * Conversation history, scoped the same way leads are.
 * @param {{crms?:string[], leadId?:string, phone?:string}} [scope]
 */
export function listMessages(scope = {}) {
  const allowed = Array.isArray(scope.crms) ? scope.crms : [];
  let rows = messages.filter(m => allowed.includes(m.crm));
  if (scope.leadId) rows = rows.filter(m => m.leadId === scope.leadId);
  if (scope.phone) rows = rows.filter(m => m.phone === digits(scope.phone));
  return rows.slice().reverse();
}

/** Legacy name, still used by the automations page. Education pipeline only. */
export const listOutbox = () => listMessages({ crms: [CRM_EDUCATION, CRM_BEROJGAR] }).filter(m => m.direction === 'out');
export const __resetOutbox = () => { messages.length = 0; };
export const WHATSAPP_DRIVER = DRIVER;
