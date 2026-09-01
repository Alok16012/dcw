/**
 * Applicant tracking for Berojgar Bharat — the recruiter-side CRM.
 *
 * lib/integrations/crm.js tracks the *counselling* relationship with a student
 * (Sky-High, one lead per person, deduped across the whole app). This module
 * tracks the *hiring* relationship instead: one application per person per job,
 * moving through a recruiter pipeline. They are deliberately separate — a
 * candidate can be one CRM lead and simultaneously sit at different stages on
 * four different jobs — and are linked by leadId.
 *
 * Pipeline mirrors what a Naukri recruiter dashboard exposes.
 *
 * PERSISTENCE: process memory, same caveat as crm.js.
 */
import { isDemo, requireLiveConfig, DRIVER } from './index.js';

export const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired'];
export const CLOSED = ['Rejected', 'On hold', 'Withdrawn'];
/** Hired is the end of the funnel, not a place someone is waiting — it is a
 *  stage for ordering but never open work. */
export const OPEN_STAGES = STAGES.filter(s => s !== 'Hired');
export const ALL_STATUSES = [...STAGES, ...CLOSED];

/** Stages a recruiter may move an application to from its current one. */
export function allowedTransitions(status) {
  if (status === 'Hired' || status === 'Withdrawn') return [];
  if (CLOSED.includes(status)) return ['Applied', 'Shortlisted', 'Interview'];
  const i = STAGES.indexOf(status);
  const forward = i >= 0 && i < STAGES.length - 1 ? [STAGES[i + 1]] : [];
  const back = i > 0 ? [STAGES[i - 1]] : [];
  return [...forward, ...back, 'Rejected', 'On hold'];
}

const applications = [];
const activity = [];
let seq = 0;

const appId = () => `APP-${String(++seq).padStart(5, '0')}`;
const now = () => new Date().toISOString();
const digits = p => String(p ?? '').replace(/\D/g, '');

function log(applicationId, type, note, actor) {
  activity.push({ applicationId, at: now(), type, note, actor: actor ?? 'system' });
}

/**
 * One application per (job, phone). A repeat submit is not an error — it logs
 * a touch, the same way the CRM treats a repeat enquiry.
 * @returns {{ok:true, application:Object, duplicate:boolean}}
 */
export function apply(input) {
  if (!isDemo) {
    requireLiveConfig('ats', ['ATS_API_URL', 'ATS_API_KEY']);
    throw new Error('ats: live driver not implemented yet');
  }
  const phone = digits(input.phone);
  const existing = applications.find(a => a.jobId === input.jobId && a.phone === phone);
  if (existing) {
    existing.touchedAt = now();
    existing.attempts = (existing.attempts ?? 1) + 1;
    log(existing.id, 'repeat', 'Candidate re-submitted this application.', 'candidate');
    return { ok: true, application: existing, duplicate: true };
  }

  const application = {
    id: appId(),
    jobId: input.jobId,
    jobTitle: input.jobTitle ?? null,
    companyId: input.companyId ?? null,
    name: String(input.name ?? '').trim(),
    phone,
    email: input.email ?? null,
    city: input.city ?? null,
    qualification: input.qualification ?? null,
    experienceYears: Number(input.experienceYears ?? 0),
    resumeUrl: input.resumeUrl ?? null,
    leadId: input.leadId ?? null,
    source: input.source ?? {},
    status: 'Applied',
    rating: null,
    appliedAt: now(),
    touchedAt: now(),
    attempts: 1
  };
  applications.push(application);
  log(application.id, 'created', `Applied to ${application.jobTitle ?? application.jobId}.`, 'candidate');
  return { ok: true, application, duplicate: false };
}

/** Recruiter moves an application along the pipeline. */
export function setStatus(id, status, { note, actor = 'recruiter' } = {}) {
  const a = applications.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  if (!ALL_STATUSES.includes(status)) return { ok: false, error: 'BAD_STATUS', allowed: ALL_STATUSES };
  if (a.status === status) return { ok: true, application: a, unchanged: true };
  if (!allowedTransitions(a.status).includes(status)) {
    return { ok: false, error: 'ILLEGAL_TRANSITION', from: a.status, allowed: allowedTransitions(a.status) };
  }
  const from = a.status;
  a.status = status;
  a.touchedAt = now();
  log(a.id, 'status', note ?? `${from} → ${status}`, actor);
  return { ok: true, application: a, from };
}

export function addNote(id, note, { actor = 'recruiter' } = {}) {
  const a = applications.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  if (!String(note ?? '').trim()) return { ok: false, error: 'EMPTY_NOTE' };
  log(a.id, 'note', String(note).trim(), actor);
  a.touchedAt = now();
  return { ok: true, application: a };
}

export function rateApplication(id, rating, { actor = 'recruiter' } = {}) {
  const a = applications.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) return { ok: false, error: 'BAD_RATING' };
  a.rating = r;
  a.touchedAt = now();
  log(a.id, 'rating', `Rated ${r}/5`, actor);
  return { ok: true, application: a };
}

/** @param {{jobId?:string,status?:string,q?:string,sort?:string}} f */
export function listApplications(f = {}) {
  let rows = applications.slice();
  if (f.jobId) rows = rows.filter(a => a.jobId === f.jobId);
  if (f.companyId) rows = rows.filter(a => a.companyId === f.companyId);
  if (f.status) rows = rows.filter(a => a.status === f.status);
  if (f.q) {
    const n = f.q.toLowerCase();
    rows = rows.filter(a => `${a.name} ${a.phone} ${a.city ?? ''} ${a.jobTitle ?? ''}`.toLowerCase().includes(n));
  }
  rows.sort(f.sort === 'oldest'
    ? (a, b) => a.appliedAt.localeCompare(b.appliedAt)
    : (a, b) => b.touchedAt.localeCompare(a.touchedAt));
  return rows;
}

export const getApplication = id => applications.find(a => a.id === id) ?? null;
export const applicationActivity = id => activity.filter(x => x.applicationId === id);

/** Funnel counts for the dashboard, plus per-job totals. */
export function pipelineStats({ jobId, companyId } = {}) {
  let rows = applications;
  if (jobId) rows = rows.filter(a => a.jobId === jobId);
  if (companyId) rows = rows.filter(a => a.companyId === companyId);
  const byStatus = Object.fromEntries(ALL_STATUSES.map(s => [s, 0]));
  for (const a of rows) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  const inPipeline = OPEN_STAGES.reduce((n, s) => n + byStatus[s], 0);
  return {
    total: rows.length,
    byStatus,
    inPipeline,
    hired: byStatus.Hired,
    rejected: byStatus.Rejected,
    conversion: rows.length ? +((byStatus.Hired / rows.length) * 100).toFixed(1) : 0
  };
}

export function countsByJob() {
  const m = new Map();
  for (const a of applications) {
    const e = m.get(a.jobId) ?? { total: 0, new: 0 };
    e.total++;
    if (a.status === 'Applied') e.new++;
    m.set(a.jobId, e);
  }
  return m;
}

export const __resetAts = () => { applications.length = 0; activity.length = 0; seq = 0; };
export const ATS_DRIVER = DRIVER;

/**
 * Deterministic seed so the recruiter console is never empty on a fresh boot.
 * Demo data only — see lib/data/schema.js.
 */
export function seedApplications(jobList) {
  if (applications.length) return;
  const people = [
    ['Rahul Kumar', '9876543210', 'Patna', '12th', 0], ['Priya Sharma', '9876543211', 'Gaya', 'Graduate', 1],
    ['Amit Raj', '9876543212', 'Muzaffarpur', '12th', 0], ['Sneha Verma', '9876543213', 'Patna', 'Graduate', 2],
    ['Vikash Singh', '9876543214', 'Bhagalpur', '10th', 0], ['Anjali Gupta', '9876543215', 'Patna', 'Graduate', 3],
    ['Rohit Yadav', '9876543216', 'Darbhanga', '12th', 1], ['Kavita Devi', '9876543217', 'Patna', '10th', 0],
    ['Suraj Prasad', '9876543218', 'Ara', 'Graduate', 2], ['Neha Kumari', '9876543219', 'Patna', '12th', 0]
  ];
  const preset = ['Applied', 'Applied', 'Shortlisted', 'Interview', 'Applied', 'Shortlisted', 'Rejected', 'Applied', 'Offered', 'Hired'];
  people.forEach(([name, phone, city, qual, exp], i) => {
    const job = jobList[i % jobList.length];
    if (!job) return;
    const { application } = apply({
      jobId: job.id, jobTitle: job.title, companyId: job.companyId,
      name, phone, city, qualification: qual, experienceYears: exp,
      source: { url: '/jobs', seeded: true }
    });
    const target = preset[i];
    if (target === application.status) return;
    // Walk the pipeline properly so the activity log reads like real history.
    const path = CLOSED.includes(target) ? ['Shortlisted', target] : STAGES.slice(1, STAGES.indexOf(target) + 1);
    for (const s of path) setStatus(application.id, s, { actor: 'seed' });
  });
}
