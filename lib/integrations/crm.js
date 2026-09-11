/**
 * CRM adapters (PRD §8.3).
 *
 * TWO PIPELINES, NOT ONE.
 *
 *   education — Distance Courses Wala + Colleges Wala. One counselling desk
 *               works both, so a student who enquires about a distance MBA and
 *               later about an MBBS seat is the same person on the same record.
 *   berojgar  — Berojgar Bharat. A separate business with separate staff,
 *               separate consent and separate reporting.
 *
 * The separation is structural, not a filter applied at read time: each CRM has
 * its own record store, its own id series, its own assignment roster and its own
 * dedupe window. The same phone number enquiring on both sides produces two
 * records, because they are two relationships — and no query, however it is
 * written, can join them.
 *
 * Demo driver keeps records in process memory and mimics the real contract:
 * dedupe within 30 days, round-robin assignment, status webhook payloads.
 */
import { DRIVER, isDemo, requireLiveConfig } from './index.js';

export const CRM_EDUCATION = 'education';
export const CRM_BEROJGAR = 'berojgar';
export const CRM_IDS = [CRM_EDUCATION, CRM_BEROJGAR];

/** The routing table. Adding a vertical without adding it here is a hard error. */
const CRM_BY_VERTICAL = {
  distance: CRM_EDUCATION,
  colleges: CRM_EDUCATION,
  jobs: CRM_BEROJGAR
};

export function crmForVertical(vertical) {
  const crm = CRM_BY_VERTICAL[vertical];
  if (!crm) throw new Error(`crm: no pipeline is configured for vertical "${vertical}"`);
  return crm;
}

/**
 * Per-CRM configuration. `prefix` is what a counsellor reads out on the phone,
 * and it has to differ: "SKY-00007" and "BBC-00007" being the same number in
 * two systems is exactly the confusion this separation exists to prevent.
 *
 * `env` names the credentials the live driver needs. They are separate keys on
 * purpose — one vendor account per business, so revoking Berojgar Bharat's
 * access cannot take the education desk offline.
 */
export const CRM_CONFIG = {
  [CRM_EDUCATION]: {
    id: CRM_EDUCATION,
    label: 'DCW + Colleges Wala',
    description: 'Shared counselling pipeline for Distance Courses Wala and Colleges Wala.',
    verticals: ['distance', 'colleges'],
    prefix: 'SKY',
    teams: { distance: ['Priya S.', 'Ankit R.'], colleges: ['Neha K.', 'Rohit M.'] },
    env: ['SKYHIGH_API_URL', 'SKYHIGH_API_KEY']
  },
  [CRM_BEROJGAR]: {
    id: CRM_BEROJGAR,
    label: 'Berojgar Bharat',
    description: 'Separate hiring pipeline. Never merged with the education desk.',
    verticals: ['jobs'],
    prefix: 'BBC',
    teams: { jobs: ['Vikas P.', 'Sunita D.'] },
    env: ['BB_CRM_API_URL', 'BB_CRM_API_KEY']
  }
};

const DEDUPE_WINDOW_DAYS = 30;

/** One isolated store per pipeline. Nothing reaches across. */
const stores = Object.fromEntries(CRM_IDS.map(id => [id, { leads: [], activity: [], rr: 0 }]));
const storeFor = crm => {
  const s = stores[crm];
  if (!s) throw new Error(`crm: unknown pipeline "${crm}"`);
  return s;
};

const daysSince = iso => (Date.now() - new Date(iso).getTime()) / 86400000;
const leadId = crm => `${CRM_CONFIG[crm].prefix}-${String(storeFor(crm).leads.length + 1).padStart(5, '0')}`;

/**
 * @returns {{ok:true, lead:Object, duplicate:boolean, assignedTo:string, crm:string}}
 */
export function upsertLead(input) {
  const crm = crmForVertical(input.vertical);
  const config = CRM_CONFIG[crm];

  if (!isDemo) {
    requireLiveConfig(`crm:${crm}`, config.env);
    throw new Error(`crm: live driver for the ${config.label} pipeline is not implemented yet`);
  }

  const store = storeFor(crm);
  const phone = String(input.phone || '').replace(/\D/g, '');
  // Scoped to this pipeline's own array, so the same number on the other side of
  // the business is a different person as far as this desk is concerned.
  const existing = store.leads.find(l => l.phone === phone && daysSince(l.createdAt) <= DEDUPE_WINDOW_DAYS);

  if (existing) {
    // PRD §8.2: do not create a second lead — log activity against the first.
    store.activity.push({ leadId: existing.id, at: new Date().toISOString(), type: 'repeat_enquiry',
      note: `Repeat enquiry from ${input.vertical} (${input.interestType}${input.interestId ? ': ' + input.interestId : ''}${input.course ? ' — ' + input.course : ''})` });
    existing.touchedAt = new Date().toISOString();
    existing.enquiryCount = (existing.enquiryCount ?? 1) + 1;
    // The newest answer wins: someone who declines WhatsApp on a later enquiry
    // has withdrawn that permission, and the record has to reflect it.
    if (input.consent) existing.consent = input.consent;
    return { ok: true, lead: existing, duplicate: true, assignedTo: existing.assignedTo, crm };
  }

  const team = config.teams[input.vertical] ?? Object.values(config.teams)[0];
  const assignedTo = team[store.rr++ % team.length];
  const id = leadId(crm);
  const lead = {
    id, crmLeadId: id, crm, vertical: input.vertical,
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
  store.leads.push(lead);
  store.activity.push({ leadId: lead.id, at: lead.createdAt, type: 'created', note: `Lead captured from ${lead.source.url ?? 'app'}` });
  return { ok: true, lead, duplicate: false, assignedTo, crm };
}

/**
 * Every lead the caller is entitled to, and not one more.
 *
 * `crms` is the allow-list from the signed session — never a query parameter.
 * Omitting it returns nothing rather than everything: a caller that forgets to
 * pass its scope should see an empty console, not the whole business.
 *
 * @param {{crms?:string[], vertical?:string, associateCode?:string}} [scope]
 */
export function listLeads(scope = {}) {
  const allowed = Array.isArray(scope.crms) ? scope.crms.filter(c => stores[c]) : [];
  let rows = allowed.flatMap(c => stores[c].leads);
  if (scope.vertical) rows = rows.filter(l => l.vertical === scope.vertical);
  if (scope.associateCode) rows = rows.filter(l => l.associateCode === scope.associateCode);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lookup is pipeline-scoped for the same reason listing is. */
export function getLead(id, scope = {}) {
  const allowed = Array.isArray(scope.crms) && scope.crms.length ? scope.crms.filter(c => stores[c]) : CRM_IDS;
  for (const c of allowed) {
    const hit = stores[c].leads.find(l => l.id === id || l.crmLeadId === id);
    if (hit) return hit;
  }
  return null;
}

export const leadActivity = (id, scope = {}) => {
  const lead = getLead(id, scope);
  if (!lead) return [];
  return storeFor(lead.crm).activity.filter(a => a.leadId === lead.id);
};

/** Headline counts per pipeline, for the console's CRM switcher. */
export const crmSummary = (crms = CRM_IDS) => crms.filter(c => stores[c]).map(c => ({
  ...CRM_CONFIG[c],
  total: stores[c].leads.length,
  open: stores[c].leads.filter(l => !['Confirmed', 'Dropped'].includes(l.status)).length
}));

/** Inbound webhook from the vendor: status change flows back to the student view. */
export function applyStatusChange({ crmLeadId, status, note }) {
  const lead = getLead(crmLeadId);
  if (!lead) return { ok: false, error: 'UNKNOWN_LEAD' };
  const allowed = ['New', 'Contacted', 'Documents pending', 'Submitted', 'Confirmed', 'Dropped'];
  if (!allowed.includes(status)) return { ok: false, error: 'BAD_STATUS', allowed };
  lead.status = status;
  lead.touchedAt = new Date().toISOString();
  storeFor(lead.crm).activity.push({ leadId: lead.id, at: lead.touchedAt, type: 'status', note: note ?? `Status → ${status}` });
  return { ok: true, lead };
}

export const __resetCrm = () => {
  for (const id of CRM_IDS) stores[id] = { leads: [], activity: [], rr: 0 };
};
export const CRM_DRIVER = DRIVER;
