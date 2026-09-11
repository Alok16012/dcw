/**
 * The WhatsApp console (client requirement 15).
 *
 * GET   conversation history + the approved template registry + which
 *       credentials are configured.
 * POST  one message, or the same template to a list of recipients.
 *
 * Pipeline separation is enforced here rather than in the UI: `crms` comes from
 * the signed session, a `crm` in the request body can only narrow that list, and
 * history is filtered on the result. Someone signed in to the Berojgar Bharat
 * desk cannot read or send on the education number by editing a fetch.
 */
import { listMessages, sendMessage, sendBulk, TEMPLATES, findTemplate, renderTemplate } from '@/lib/integrations/whatsapp.js';
import { CRM_CONFIG } from '@/lib/integrations/crm.js';
import { requirePermission, crmsFor } from '@/lib/auth.js';
import { DRIVER } from '@/lib/integrations/index.js';
import { ok, fail, readJson } from '@/lib/http.js';

/** Which WhatsApp env vars are set. Never the values — only whether they exist. */
const credentialStatus = () => ({
  driver: DRIVER,
  accessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
  educationSender: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
  berojgarSender: Boolean(process.env.BB_WHATSAPP_PHONE_NUMBER_ID),
  wabaId: Boolean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
  webhookToken: Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
  required: ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'BB_WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN']
});

/** The pipelines this session may touch, narrowed by ?crm= if one was asked for. */
function scopeFor(session, asked) {
  const allowed = crmsFor(session);
  return asked ? allowed.filter(c => c === asked) : allowed;
}

export async function GET(request) {
  const { error, session } = requirePermission(request, 'whatsapp:read');
  if (error) return error;

  const sp = request.nextUrl.searchParams;
  const crms = scopeFor(session, sp.get('crm'));
  const rows = listMessages({
    crms,
    leadId: sp.get('leadId') ?? undefined,
    phone: sp.get('phone') ?? undefined
  });

  return ok({
    rows,
    total: rows.length,
    templates: TEMPLATES,
    crms: crms.map(id => ({ id, label: CRM_CONFIG[id]?.label ?? id })),
    credentials: credentialStatus()
  });
}

export async function POST(request) {
  const { error, session } = requirePermission(request, 'whatsapp:send');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const allowed = crmsFor(session);
  const crm = body.crm ?? allowed[0];
  if (!allowed.includes(crm)) {
    return fail(403, 'FORBIDDEN', 'Your account cannot send on that pipeline.');
  }
  if (body.template && !findTemplate(body.template)) {
    return fail(422, 'UNKNOWN_TEMPLATE', `No approved template named "${body.template}".`);
  }

  if (Array.isArray(body.recipients)) {
    if (!body.template) {
      // WhatsApp only permits templates outside an open 24-hour window, and a
      // bulk send is by definition to people who are not mid-conversation.
      return fail(422, 'TEMPLATE_REQUIRED', 'A bulk send has to use an approved template.');
    }
    const result = await sendBulk({ recipients: body.recipients, template: body.template, crm, sentBy: session.name });
    if (!result.ok) return fail(422, result.error, result.message);
    return ok(result, { status: 201 });
  }

  const result = await sendMessage({
    phone: body.phone, template: body.template, text: body.text, vars: body.vars,
    crm, leadId: body.leadId ?? null, sentBy: session.name
  });
  if (!result.ok) return fail(422, result.error, result.message, { record: result.message_record ?? null });
  return ok({
    message: result.message,
    preview: body.template ? renderTemplate(findTemplate(body.template), body.vars) : null,
    note: result.note ?? null
  }, { status: 201 });
}
