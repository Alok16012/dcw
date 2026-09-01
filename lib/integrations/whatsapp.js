/** WhatsApp Automation Module adapter (existing Baileys service, PRD §8.2/§12). */
import { DRIVER, isDemo, requireLiveConfig } from './index.js';

const outbox = [];

export function sendTemplate({ phone, template, vars = {} }) {
  if (!isDemo) {
    requireLiveConfig('whatsapp', ['WA_SERVICE_URL', 'WA_SERVICE_TOKEN']);
    throw new Error('whatsapp: live Baileys driver not implemented yet');
  }
  const body = {
    lead_confirmation: `Hi ${vars.name ?? 'there'}, DCW has received your enquiry${vars.interest ? ' about ' + vars.interest : ''}. A counsellor will call you shortly.`,
    application_status: `Update: your application status is now "${vars.status}".`,
    job_applied: `You applied for ${vars.job ?? 'a role'}. Interview details will follow here.`
  }[template] ?? `DCW notification (${template})`;

  const msg = { id: `WA-${outbox.length + 1}`, phone, template, body, queuedAt: new Date().toISOString(), driver: DRIVER, demo: true };
  outbox.push(msg);
  return { ok: true, queued: msg, note: 'Demo mode: message queued in memory, nothing was sent.' };
}

export const listOutbox = () => outbox.slice();
export const __resetOutbox = () => { outbox.length = 0; };
