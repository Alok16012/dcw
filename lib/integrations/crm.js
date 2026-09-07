/**
 * Sky-High CRM adapter (PRD §8.3).
 * Demo driver keeps leads in process memory and mimics the real contract:
 * dedupe within 30 days, round-robin assignment, status webhook payloads.
 */
import { DRIVER, isDemo, requireLiveConfig } from './index.js';

const leads = [];
const activity = [];
const DEDUPE_WINDOW_DAYS = 30;
const TEAMS = { distance: ['Priya S.', 'Ankit R.'], colleges: ['Neha K.', 'Rohit M.'], jobs: ['Vikas P.'] };
let rr = 0;

const daysSince = iso => (Date.now() - new Date(iso).getTime()) / 86400000;
const leadId = () => `SKY-${String(leads.length + 1).padStart(5, '0')}`;

/**
 * @returns {{ok:true, lead:Object, duplicate:boolean, assignedTo:string}}
 */
export function upsertLead(input) {
  if (!isDemo) {
    requireLiveConfig('crm', ['SKYHIGH_API_URL', 'SKYHIGH_API_KEY']);
    throw new Error('crm: live Sky-High driver not implemented yet');
  }

  const phone = String(input.phone || '').replace(/\D/g, '');
  const existing = leads.find(l => l.phone === phone && daysSince(l.createdAt) <= DEDUPE_WINDOW_DAYS);

  if (existing) {
    // PRD §8.2: do not create a second lead — log activity against the first.
    activity.push({ leadId: existing.id, at: new Date().toISOString(), type: 'repeat_enquiry',
      note: `Repeat enquiry from ${input.vertical} (${input.interestType}${input.interestId ? ': ' + input.interestId : ''}${input.course ? ' — ' + input.course : ''})` });
    existing.touchedAt = new Date().toISOString();
    existing.enquiryCount = (existing.enquiryCount ?? 1) + 1;
    // The newest answer wins: someone who declines WhatsApp on a later enquiry
    // has withdrawn that permission, and the record has to reflect it.
    if (input.consent) existing.consent = input.consent;
    return { ok: true, lead: existing, duplicate: true, assignedTo: existing.assignedTo };
  }

  const team = TEAMS[input.vertical] ?? TEAMS.distance;
  const assignedTo = team[rr++ % team.length];
  const lead = {
    id: leadId(), crmLeadId: leadId(), vertical: input.vertical,
    name: input.name, phone, whatsappSame: input.whatsappSame === true,
    consent: input.consent ?? null,
    city: input.city ?? null, qualification: input.qualification ?? null,
    interestType: input.interestType ?? 'general', interestId: input.interestId ?? null,
    /* interestId is the institution, so on its own it cannot say which of that
       institution's programmes the person applied for. The apply form asks them
       to pick one and the confirmation screen reads it back to them; without
       this field the counsellor who picks the lead up sees only "amity-online"
       and has to ask again the question the form already answered. */
    course: input.course ?? null,
    associateCode: input.associateCode ?? null,
    phoneVerified: !!input.phoneVerified,
    source: input.source ?? {}, status: 'New', assignedTo,
    enquiryCount: 1, createdAt: new Date().toISOString(), touchedAt: new Date().toISOString()
  };
  leads.push(lead);
  activity.push({ leadId: lead.id, at: lead.createdAt, type: 'created', note: `Lead captured from ${lead.source.url ?? 'app'}` });
  return { ok: true, lead, duplicate: false, assignedTo };
}

export const listLeads = () => leads.slice();
export const getLead = id => leads.find(l => l.id === id || l.crmLeadId === id) ?? null;
export const leadActivity = id => activity.filter(a => a.leadId === id);

/** Inbound webhook from Sky-High: status change flows back to the student view. */
export function applyStatusChange({ crmLeadId, status, note }) {
  const lead = getLead(crmLeadId);
  if (!lead) return { ok: false, error: 'UNKNOWN_LEAD' };
  const allowed = ['New', 'Contacted', 'Documents pending', 'Submitted', 'Confirmed', 'Dropped'];
  if (!allowed.includes(status)) return { ok: false, error: 'BAD_STATUS', allowed };
  lead.status = status;
  lead.touchedAt = new Date().toISOString();
  activity.push({ leadId: lead.id, at: lead.touchedAt, type: 'status', note: note ?? `Status → ${status}` });
  return { ok: true, lead };
}

export const __resetCrm = () => { leads.length = 0; activity.length = 0; rr = 0; };
export const CRM_DRIVER = DRIVER;
