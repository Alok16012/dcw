/**
 * Mutable job + company repository (PRD §10 Job).
 *
 * lib/data/jobs.js is a frozen demo seed. The admin console needs create,
 * update and delete, so this module takes a working copy at boot and becomes
 * the single source of truth for both the public listing (via lib/store.js)
 * and /api/admin/jobs. A job posted by an admin therefore appears on the
 * public Berojgar Bharat listing immediately — the two cannot drift.
 *
 * PERSISTENCE: process memory, matching lib/integrations/crm.js. Everything
 * resets when the server restarts, and a multi-instance deploy would give each
 * instance its own copy. Swapping in Supabase means reimplementing the exported
 * functions against real tables; no call site changes.
 */
import { jobs as seedJobs, companies as seedCompanies } from './data/jobs.js';

let jobs = seedJobs.map(j => ({ ...j }));
let companies = seedCompanies.map(c => ({ ...c }));
let seq = 0;

const QUALIFICATIONS = ['10th', '12th', 'Graduate', 'Any'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship'];

export const JOB_ENUMS = { qualifications: QUALIFICATIONS, jobTypes: JOB_TYPES };

const slugify = s => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

/** Slugs are used in public URLs, so they must stay unique across the repo. */
function uniqueSlug(base) {
  let slug = base || 'job';
  let n = 2;
  while (jobs.some(j => j.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Field-level validation. Returns {} when the input is usable. */
export function validateJob(input, { partial = false } = {}) {
  const e = {};
  const has = k => input[k] !== undefined && input[k] !== null && input[k] !== '';
  const need = k => (partial ? has(k) : true);

  if (need('title') && !String(input.title ?? '').trim()) e.title = 'Job title is required.';
  if (need('companyId') && !has('companyId') && !String(input.companyName ?? '').trim()) {
    e.companyId = 'Pick a company or enter a new company name.';
  }
  if (has('companyId') && !companies.some(c => c.id === input.companyId)) {
    e.companyId = `Unknown company "${input.companyId}".`;
  }
  if (need('location') && !String(input.location ?? '').trim()) e.location = 'Location is required.';

  const min = Number(input.salaryMin), max = Number(input.salaryMax);
  if (need('salaryMin')) {
    if (!Number.isFinite(min) || min < 0) e.salaryMin = 'Enter a valid annual minimum salary.';
    if (!Number.isFinite(max) || max < 0) e.salaryMax = 'Enter a valid annual maximum salary.';
    if (Number.isFinite(min) && Number.isFinite(max) && max < min) {
      e.salaryMax = 'Maximum salary cannot be lower than the minimum.';
    }
  }
  if (has('qualification') && !QUALIFICATIONS.includes(input.qualification)) {
    e.qualification = `Qualification must be one of: ${QUALIFICATIONS.join(', ')}.`;
  }
  if (has('jobType') && !JOB_TYPES.includes(input.jobType)) {
    e.jobType = `Job type must be one of: ${JOB_TYPES.join(', ')}.`;
  }
  if (has('openings') && (!Number.isInteger(Number(input.openings)) || Number(input.openings) < 1)) {
    e.openings = 'Openings must be a whole number of at least 1.';
  }
  if (has('experienceMin') && (Number(input.experienceMin) < 0 || Number.isNaN(Number(input.experienceMin)))) {
    e.experienceMin = 'Minimum experience cannot be negative.';
  }
  if (has('expiresOn') && Number.isNaN(Date.parse(input.expiresOn))) {
    e.expiresOn = 'Enter a valid expiry date.';
  }

  // Coordinates drive "jobs near me". A job with one half of a pair is worse
  // than a job with neither: it sorts as if it were at the equator.
  const lat = Number(input.lat), lng = Number(input.lng);
  if (has('lat') && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    e.lat = 'Latitude must be a number between -90 and 90.';
  }
  if (has('lng') && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
    e.lng = 'Longitude must be a number between -180 and 180.';
  }
  if (has('lat') !== has('lng')) {
    e[has('lat') ? 'lng' : 'lat'] = 'Give both coordinates or neither.';
  }
  return e;
}

/**
 * The optional half of a Job: coordinates, the city facet and the display
 * strings. Absent keys stay absent rather than becoming empty strings, because
 * the public listing derives a sensible fallback for every one of them and an
 * empty string would win over that fallback.
 */
function optionalJobFields(input) {
  const out = {};
  const text = k => { if (input[k] !== undefined && String(input[k]).trim()) out[k] = String(input[k]).trim(); };
  text('city'); text('area'); text('eligibility'); text('roleType'); text('deadlineLabel');
  if (input.lat !== undefined && input.lat !== null && input.lat !== '') {
    out.lat = Number(input.lat);
    out.lng = Number(input.lng);
  }
  if (input.tags !== undefined) {
    const tags = (Array.isArray(input.tags) ? input.tags : String(input.tags).split(','))
      .map(t => String(t).trim()).filter(Boolean);
    if (tags.length) out.tags = tags;
  }
  return out;
}

/** Creates a company on the fly so an admin is never blocked by a missing record. */
function resolveCompany(input) {
  if (input.companyId) return input.companyId;
  const name = String(input.companyName).trim();
  const existing = companies.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const id = uniqueCompanyId(slugify(name));
  companies.push({
    id, name,
    mark: name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CO',
    about: input.companyAbout ?? '', isVerified: !!input.companyVerified
  });
  return id;
}

function uniqueCompanyId(base) {
  let id = base || 'company';
  let n = 2;
  while (companies.some(c => c.id === id)) id = `${base}-${n++}`;
  return id;
}

export function createJob(input, { actor = 'admin' } = {}) {
  const errors = validateJob(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const companyId = resolveCompany(input);
  const title = String(input.title).trim();
  const job = {
    id: `job-${Date.now().toString(36)}-${(seq++).toString(36)}`,
    slug: uniqueSlug(slugify(`${title}-${input.location ?? ''}`)),
    title,
    companyId,
    location: String(input.location).trim(),
    wfh: !!input.wfh,
    salaryMin: Number(input.salaryMin),
    salaryMax: Number(input.salaryMax),
    qualification: input.qualification ?? 'Any',
    experienceMin: Number(input.experienceMin ?? 0),
    jobType: input.jobType ?? 'Full-time',
    industry: String(input.industry ?? 'General').trim(),
    openings: Number(input.openings ?? 1),
    jd: String(input.jd ?? '').trim(),
    responsibilities: Array.isArray(input.responsibilities)
      ? input.responsibilities.map(r => String(r).trim()).filter(Boolean)
      : String(input.responsibilities ?? '').split('\n').map(r => r.trim()).filter(Boolean),
    expiresOn: input.expiresOn || todayISO(),
    isActive: input.isActive !== false,
    featured: !!input.featured,
    postedOn: todayISO(),
    createdBy: actor,
    updatedAt: new Date().toISOString(),
    ...optionalJobFields(input)
  };
  jobs.unshift(job);
  return { ok: true, job };
}

export function updateJob(id, patch, { actor = 'admin' } = {}) {
  const job = jobs.find(j => j.id === id || j.slug === id);
  if (!job) return { ok: false, error: 'NOT_FOUND' };

  const errors = validateJob(patch, { partial: true });
  if (Object.keys(errors).length) return { ok: false, errors };

  const writable = ['title', 'location', 'wfh', 'salaryMin', 'salaryMax', 'qualification',
    'experienceMin', 'jobType', 'industry', 'openings', 'jd', 'expiresOn', 'isActive', 'featured'];
  for (const k of writable) {
    if (patch[k] === undefined) continue;
    job[k] = ['salaryMin', 'salaryMax', 'experienceMin', 'openings'].includes(k) ? Number(patch[k])
      : ['wfh', 'isActive', 'featured'].includes(k) ? !!patch[k]
      : typeof patch[k] === 'string' ? patch[k].trim() : patch[k];
  }
  if (patch.responsibilities !== undefined) {
    job.responsibilities = Array.isArray(patch.responsibilities)
      ? patch.responsibilities.map(r => String(r).trim()).filter(Boolean)
      : String(patch.responsibilities).split('\n').map(r => r.trim()).filter(Boolean);
  }
  // Optional fields are clearable: an explicit empty value removes the key so
  // the listing falls back to what it derives, rather than showing a blank row.
  const blank = v => v === null || v === '' || (Array.isArray(v) && !v.length);
  for (const k of ['city', 'area', 'eligibility', 'roleType', 'deadlineLabel', 'tags']) {
    if (patch[k] === undefined) continue;
    if (blank(patch[k])) delete job[k];
    else Object.assign(job, optionalJobFields({ [k]: patch[k] }));
  }
  // Coordinates move as a pair, so they are handled outside that loop.
  if (patch.lat !== undefined || patch.lng !== undefined) {
    if (blank(patch.lat) || blank(patch.lng)) { delete job.lat; delete job.lng; }
    else Object.assign(job, optionalJobFields({ lat: patch.lat, lng: patch.lng }));
  }
  if (patch.companyId || patch.companyName) job.companyId = resolveCompany(patch);

  job.updatedAt = new Date().toISOString();
  job.updatedBy = actor;
  return { ok: true, job };
}

/**
 * Soft delete by default: expired postings still have applications hanging off
 * them, so the row has to survive for the ATS to stay coherent.
 */
export function deleteJob(id, { hard = false } = {}) {
  const i = jobs.findIndex(j => j.id === id || j.slug === id);
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  const job = jobs[i];
  if (hard) { jobs.splice(i, 1); return { ok: true, job, hard: true }; }
  job.isActive = false;
  job.updatedAt = new Date().toISOString();
  return { ok: true, job, hard: false };
}

export const listJobs = ({ includeInactive = false } = {}) =>
  (includeInactive ? jobs : jobs.filter(j => j.isActive)).slice();

export const findJob = idOrSlug => jobs.find(j => j.id === idOrSlug || j.slug === idOrSlug) ?? null;
export const listCompanies = () => companies.slice();
export const findCompany = id => companies.find(c => c.id === id) ?? null;

/** Pass a companyId to report on one employer's own postings only — an
 *  employer must never be shown DCW's total book of business. */
export function jobStats(companyId) {
  const mine = companyId ? jobs.filter(j => j.companyId === companyId) : jobs;
  const active = mine.filter(j => j.isActive);
  return {
    total: mine.length,
    active: active.length,
    inactive: mine.length - active.length,
    featured: active.filter(j => j.featured).length,
    openings: active.reduce((n, j) => n + j.openings, 0),
    companies: companyId ? 1 : companies.length,
    expiringSoon: active.filter(j => (Date.parse(j.expiresOn) - Date.now()) / 86400000 <= 7).length
  };
}

export const __resetJobs = () => {
  jobs = seedJobs.map(j => ({ ...j }));
  companies = seedCompanies.map(c => ({ ...c }));
  seq = 0;
};
