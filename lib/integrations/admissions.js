/**
 * Admissions pipeline — the college/university/board half of the CRM.
 *
 * lib/integrations/ats.js tracks a HIRING relationship: one application per
 * person per job, through a recruiter's funnel. This module tracks an ADMISSION
 * instead: one application per person per (institution, course), through the
 * funnel a counsellor actually works — collect documents, verify them, submit
 * to the institution, receive the offer, enrol.
 *
 * The two are deliberately separate rather than one "applications" table with a
 * type column, because the stages are not the same shape: nothing in hiring
 * corresponds to "documents pending", and nothing in admissions corresponds to
 * "interview". Both link back to a single Sky-High lead by leadId, which is
 * what lets one person be a counselling lead once and an applicant many times.
 *
 * PERSISTENCE: process memory, same caveat as crm.js and ats.js.
 */
import { isDemo, requireLiveConfig, DRIVER } from './index.js';

export const STAGES = ['Applied', 'Documents pending', 'Verified', 'Submitted', 'Offer', 'Enrolled'];
export const CLOSED = ['Rejected', 'On hold', 'Withdrawn'];
/** Enrolled is the end of the funnel, not somewhere a counsellor still has work. */
export const OPEN_STAGES = STAGES.filter(s => s !== 'Enrolled');
export const ALL_STATUSES = [...STAGES, ...CLOSED];

/** What the applicant is told at each stage, in their words rather than ours.
 *  The client-side tracker reads this so the two views cannot drift. */
export const STAGE_COPY = {
  'Applied': 'We have your application. A counsellor is picking it up.',
  'Documents pending': 'Your counsellor needs your documents to go further.',
  'Verified': 'Documents checked. Your file is ready to go to the institution.',
  'Submitted': 'Submitted to the institution. Waiting on their decision.',
  'Offer': 'You have an offer. Confirm your seat to enrol.',
  'Enrolled': 'Enrolled. Welcome — your fee schedule is below.',
  'Rejected': 'The institution could not offer a seat this cycle.',
  'On hold': 'Paused. Your counsellor will explain what is needed.',
  'Withdrawn': 'You asked us to stop this application.'
};

/** Stages a counsellor may move an application to from its current one. */
export function allowedTransitions(status) {
  if (status === 'Enrolled' || status === 'Withdrawn') return [];
  if (CLOSED.includes(status)) return ['Applied', 'Documents pending', 'Submitted'];
  const i = STAGES.indexOf(status);
  const forward = i >= 0 && i < STAGES.length - 1 ? [STAGES[i + 1]] : [];
  const back = i > 0 ? [STAGES[i - 1]] : [];
  return [...forward, ...back, 'Rejected', 'On hold'];
}

const admissions = [];
const activity = [];
let seq = 0;

const admissionId = () => `ADM-${String(++seq).padStart(5, '0')}`;
const now = () => new Date().toISOString();
const digits = p => String(p ?? '').replace(/\D/g, '');
const key = (institutionId, course) => `${institutionId}::${String(course ?? '').toLowerCase()}`;

function log(applicationId, type, note, actor) {
  activity.push({ applicationId, at: now(), type, note, actor: actor ?? 'system' });
}

/**
 * One application per (institution, course, phone). A repeat submit logs a
 * touch rather than erroring, the same way the CRM treats a repeat enquiry.
 * @returns {{ok:true, application:Object, duplicate:boolean}}
 */
export function apply(input) {
  if (!isDemo) {
    requireLiveConfig('admissions', ['ADMISSIONS_API_URL', 'ADMISSIONS_API_KEY']);
    throw new Error('admissions: live driver not implemented yet');
  }
  const phone = digits(input.phone);
  const existing = admissions.find(a => a.phone === phone && key(a.institutionId, a.course) === key(input.institutionId, input.course));
  if (existing) {
    existing.touchedAt = now();
    existing.attempts = (existing.attempts ?? 1) + 1;
    log(existing.id, 'repeat', 'Applicant re-submitted this application.', 'applicant');
    return { ok: true, application: existing, duplicate: true };
  }

  const application = {
    id: admissionId(),
    vertical: input.vertical === 'colleges' ? 'colleges' : 'distance',
    institutionId: input.institutionId ?? null,
    institutionName: input.institutionName ?? null,
    course: input.course ?? null,
    /* The stream the course sits in, copied onto the student at the moment they
       apply rather than looked up through the course each time it is shown.
       Two reasons: a course can be renamed or retired under a student who is
       already enrolled, and a board applicant has a branch but no course row to
       read it from. `null` is a truthful answer and the console prints it as
       "Not recorded" rather than guessing. */
    branch: input.branch ?? null,
    courseFee: Number(input.courseFee ?? 0) || 0,
    name: String(input.name ?? '').trim(),
    phone,
    email: input.email ?? null,
    city: input.city ?? null,
    qualification: input.qualification ?? null,
    documentUrl: input.documentUrl ?? null,
    leadId: input.leadId ?? null,
    source: input.source ?? {},
    status: 'Applied',
    counsellor: input.counsellor ?? null,
    appliedAt: now(),
    touchedAt: now(),
    attempts: 1
  };
  admissions.push(application);
  log(application.id, 'created', `Applied to ${application.institutionName ?? application.institutionId} — ${application.course ?? 'course not stated'}.`, 'applicant');
  return { ok: true, application, duplicate: false };
}

export function setStatus(id, status, { note, actor = 'counsellor' } = {}) {
  const a = admissions.find(x => x.id === id);
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

/**
 * Editable student fields, and what counts as a valid value.
 *
 * `status` is deliberately absent: it moves through setStatus(), which is the
 * only thing that knows allowedTransitions(), and letting a general-purpose
 * PATCH write it would let a file jump from Applied to Enrolled without ever
 * passing document verification. `phone` is absent for a different reason — it
 * is the identity the applicant cookie and the fee plan are keyed to, so
 * changing it would silently detach a student from their own records. Both are
 * refused loudly by validateAdmission() rather than quietly dropped.
 */
const WRITABLE = ['name', 'email', 'city', 'qualification', 'branch', 'course',
  'courseFee', 'institutionId', 'institutionName', 'counsellor', 'documentUrl', 'vertical'];

export function validateAdmission(patch) {
  const e = {};
  const has = k => patch[k] !== undefined;
  if (has('name') && !String(patch.name ?? '').trim()) e.name = 'Name is required.';
  if (has('email') && patch.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(patch.email).trim())) {
    e.email = 'That does not look like an email address.';
  }
  if (has('courseFee')) {
    const f = Number(patch.courseFee);
    if (!Number.isFinite(f) || f < 0) e.courseFee = 'Enter the course fee in rupees.';
  }
  if (has('vertical') && !['distance', 'colleges'].includes(patch.vertical)) {
    e.vertical = 'Vertical must be distance or colleges.';
  }
  if (has('phone')) e.phone = 'The mobile number identifies the student and cannot be changed here.';
  if (has('status')) e.status = 'Move the file through its stages instead of setting the status directly.';
  return e;
}

/**
 * Edits a student file.
 *
 * Every change is written to the same activity log the stage moves use, and the
 * note names the fields — "who changed the fee" is the first question asked
 * about a file whose instalments stopped matching the course.
 */
export function updateAdmission(id, patch, { actor = 'admin' } = {}) {
  const a = admissions.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  const errors = validateAdmission(patch);
  if (Object.keys(errors).length) return { ok: false, errors };

  const changed = [];
  for (const k of WRITABLE) {
    if (patch[k] === undefined) continue;
    const next = k === 'courseFee' ? (Number(patch[k]) || 0)
      : patch[k] === null || patch[k] === '' ? null
      : String(patch[k]).trim();
    if (next === a[k]) continue;
    a[k] = next;
    changed.push(k);
  }
  if (!changed.length) return { ok: true, application: a, changed };
  a.touchedAt = now();
  log(a.id, 'edit', `Updated ${changed.join(', ')}.`, actor);
  return { ok: true, application: a, changed };
}

/**
 * Creates a student file from the console, for the case the public form cannot
 * cover: somebody who walked into the Patna office, or a batch typed up from a
 * counsellor's notebook.
 *
 * It goes through apply() rather than pushing a row of its own, so a student
 * added by staff and one who applied on the site are the same shape and hit the
 * same duplicate rule. `status` is accepted here — and only here — because a
 * file being back-entered is often already past Applied; it is walked up the
 * stages one at a time so the activity log reads as history rather than
 * appearing fully formed at Enrolled.
 */
export function createAdmission(input, { actor = 'admin' } = {}) {
  const errors = validateAdmission({ ...input, phone: undefined, status: undefined });
  if (!String(input.name ?? '').trim()) errors.name = 'Name is required.';
  if (digits(input.phone).length !== 10) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (Object.keys(errors).length) return { ok: false, errors };

  const { application, duplicate } = apply({ ...input, counsellor: input.counsellor ?? null });
  if (duplicate) return { ok: true, application, duplicate: true };
  log(application.id, 'created', `Added in the console by ${actor}.`, actor);

  const target = input.status;
  if (target && target !== 'Applied' && ALL_STATUSES.includes(target)) {
    const path = CLOSED.includes(target)
      ? ['Documents pending', target]
      : STAGES.slice(1, STAGES.indexOf(target) + 1);
    for (const s of path) setStatus(application.id, s, { actor });
  }
  return { ok: true, application, duplicate: false };
}

export function addNote(id, note, { actor = 'counsellor' } = {}) {
  const a = admissions.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  if (!String(note ?? '').trim()) return { ok: false, error: 'EMPTY_NOTE' };
  log(a.id, 'note', String(note).trim(), actor);
  a.touchedAt = now();
  return { ok: true, application: a };
}

export function assignCounsellor(id, counsellor, { actor = 'admin' } = {}) {
  const a = admissions.find(x => x.id === id);
  if (!a) return { ok: false, error: 'NOT_FOUND' };
  a.counsellor = String(counsellor ?? '').trim() || null;
  a.touchedAt = now();
  log(a.id, 'assign', a.counsellor ? `Assigned to ${a.counsellor}` : 'Unassigned', actor);
  return { ok: true, application: a };
}

/** @param {{institutionId?:string,status?:string,branch?:string,vertical?:string,phone?:string,q?:string,sort?:string}} f */
export function listAdmissions(f = {}) {
  let rows = admissions.slice();
  if (f.institutionId) rows = rows.filter(a => a.institutionId === f.institutionId);
  if (f.vertical) rows = rows.filter(a => a.vertical === f.vertical);
  if (f.status) rows = rows.filter(a => a.status === f.status);
  if (f.branch) rows = rows.filter(a => (a.branch ?? '') === f.branch);
  if (f.phone) { const p = digits(f.phone); rows = rows.filter(a => a.phone === p); }
  if (f.q) {
    const n = f.q.toLowerCase();
    rows = rows.filter(a => `${a.name} ${a.phone} ${a.email ?? ''} ${a.city ?? ''} ${a.institutionName ?? ''} ${a.course ?? ''} ${a.branch ?? ''}`.toLowerCase().includes(n));
  }
  rows.sort(f.sort === 'oldest'
    ? (a, b) => a.appliedAt.localeCompare(b.appliedAt)
    : (a, b) => b.touchedAt.localeCompare(a.touchedAt));
  return rows;
}

export const getAdmission = id => admissions.find(a => a.id === id) ?? null;
export const admissionActivity = id => activity.filter(x => x.applicationId === id);

/** Funnel counts for the dashboard. */
export function pipelineStats({ institutionId, vertical } = {}) {
  let rows = admissions;
  if (institutionId) rows = rows.filter(a => a.institutionId === institutionId);
  if (vertical) rows = rows.filter(a => a.vertical === vertical);
  const byStatus = Object.fromEntries(ALL_STATUSES.map(s => [s, 0]));
  for (const a of rows) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  return {
    total: rows.length,
    byStatus,
    inPipeline: OPEN_STAGES.reduce((n, s) => n + byStatus[s], 0),
    enrolled: byStatus.Enrolled,
    rejected: byStatus.Rejected,
    conversion: rows.length ? +((byStatus.Enrolled / rows.length) * 100).toFixed(1) : 0
  };
}

export function countsByInstitution() {
  const m = new Map();
  for (const a of admissions) {
    const e = m.get(a.institutionId) ?? { total: 0, new: 0, enrolled: 0 };
    e.total++;
    if (a.status === 'Applied') e.new++;
    if (a.status === 'Enrolled') e.enrolled++;
    m.set(a.institutionId, e);
  }
  return m;
}

export const __resetAdmissions = () => { admissions.length = 0; activity.length = 0; seq = 0; };
export const ADMISSIONS_DRIVER = DRIVER;

/**
 * Deterministic seed so the counselling console is never empty on a fresh boot.
 * Demo data only — see lib/data/schema.js. Mirrors ats.seedApplications, and
 * deliberately reuses the same ten people: in real life the person who applies
 * for a job is often the same person finishing a degree, and a dashboard that
 * never shows one human on both sides teaches the wrong thing about the data.
 */
export function seedAdmissions(institutionList) {
  if (admissions.length) return;
  const people = [
    ['Rahul Kumar', '9876543210', 'Patna', '12th'], ['Priya Sharma', '9876543211', 'Gaya', 'Graduate'],
    ['Sneha Verma', '9876543213', 'Patna', 'Graduate'], ['Anjali Gupta', '9876543215', 'Patna', 'Graduate'],
    ['Rohit Yadav', '9876543216', 'Darbhanga', '12th'], ['Suraj Prasad', '9876543218', 'Ara', 'Graduate'],
    ['Neha Kumari', '9876543219', 'Patna', '12th'], ['Amit Raj', '9876543212', 'Muzaffarpur', '12th']
  ];
  const preset = ['Applied', 'Documents pending', 'Verified', 'Submitted', 'Offer', 'Enrolled', 'Applied', 'On hold'];
  people.forEach(([name, phone, city, qual], i) => {
    const inst = institutionList[i % institutionList.length];
    if (!inst) return;
    const course = (inst.courses ?? []).find(c => c.isActive !== false) ?? null;
    const { application } = apply({
      vertical: inst.vertical, institutionId: inst.id, institutionName: inst.name,
      course: course?.name ?? null, courseFee: course?.totalFee ?? 0,
      branch: course?.stream ?? null,
      name, phone, city, qualification: qual,
      counsellor: ['Priya S.', 'Ankit R.', 'Neha K.'][i % 3],
      source: { url: `/${inst.vertical}`, seeded: true }
    });
    const target = preset[i];
    if (target === application.status) return;
    // Walk the pipeline properly so the activity log reads like real history.
    const path = CLOSED.includes(target) ? ['Documents pending', target] : STAGES.slice(1, STAGES.indexOf(target) + 1);
    for (const s of path) setStatus(application.id, s, { actor: 'seed' });
  });
}
