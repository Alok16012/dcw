/**
 * Mutable institution + course repository (PRD §10 Institution).
 *
 * lib/data/institutions.js is a frozen demo seed and lib/content/courses.js
 * held a second, richer copy of the same course menus for the apply flow. Two
 * copies is one too many the moment an admin can edit either of them, so this
 * module takes a working copy of the seed at boot, folds the display rows from
 * the content map into it, and becomes the single source of truth for the
 * public listing (via lib/store.js), the apply flow and /admin/catalogue.
 *
 * A course edited in the console therefore changes the fee on the card, the fee
 * in the apply dialog and the fee the instalment plan is cut from, because all
 * three now read the same row.
 *
 * PERSISTENCE: process memory, matching lib/jobs-repo.js. Everything resets on
 * restart. Swapping in Supabase means reimplementing the exported functions
 * against real tables; no call site changes.
 */
import { institutions as seedInstitutions } from './data/institutions.js';
import { COURSES } from './content/courses.js';

const LEVELS = ['10th', '12th', 'Diploma', 'UG', 'PG'];
const MODES = ['Online', '100% online', 'Distance', 'Open school', 'Regular'];
export const INSTITUTION_ENUMS = { levels: LEVELS, modes: MODES, verticals: ['distance', 'colleges'] };

const slugify = s => String(s).toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);

/** "2 years" / "18 months" / "3.5 years" -> whole months. */
function monthsFrom(duration) {
  const m = String(duration ?? '').match(/([\d.]+)\s*(year|yr|month|mo)/i);
  if (!m) return 12;
  const n = Number(m[1]);
  return Math.round(/^mo/i.test(m[2]) ? n : n * 12);
}

/* The content map stores level as 'ug'/'pg' and mode as 'online'/'distance',
   because those are the two questions the /distance path cards ask. The
   catalogue stores the schema's own vocabulary. Translate once, here, rather
   than teaching every consumer both dialects. */
const LEVEL_FROM_CONTENT = { ug: 'UG', pg: 'PG' };
const MODE_FROM_CONTENT = { online: 'Online', distance: 'Distance' };

const courseId = (instId, name) => `${instId}-${slugify(name)}`;

/**
 * Folds one [name, duration, fee, mrp, note, level, mode] display row into the
 * schema's InstitutionCourse shape, borrowing whatever the seed's headline
 * course already established (stream, eligibility, deadline) so a merged row is
 * not thinner than the row beside it.
 */
function courseFromContentRow(instId, row, headline) {
  const [name, duration, fee, mrp, note, level, mode] = row;
  const months = monthsFrom(duration);
  const totalFee = Number(fee) || 0;
  return {
    id: courseId(instId, name), name, level: LEVEL_FROM_CONTENT[level] ?? headline?.level ?? 'UG',
    stream: headline?.stream ?? 'General', durationMonths: months,
    mode: MODE_FROM_CONTENT[mode] ?? headline?.mode ?? 'Online',
    totalFee, mrpFee: mrp == null ? null : Number(mrp),
    emiAvailable: totalFee > 0, emiMonthly: totalFee > 0 ? Math.round(totalFee / months) : null,
    seats: null, eligibility: headline?.eligibility ?? '10+2 from a recognised board',
    examAccepted: headline?.examAccepted ?? [], deadline: headline?.deadline ?? 'Rolling',
    note: note ?? null, isActive: true
  };
}

/** Seed course rows carry no `note` and no isActive flag; normalise both. */
const normaliseSeedCourse = (instId, c) => ({
  note: null, isActive: true, ...c, id: c.id || courseId(instId, c.name)
});

function bootstrapInstitution(inst) {
  const courses = inst.courses.map(c => normaliseSeedCourse(inst.id, c));
  const rows = COURSES[inst.id];
  if (rows) {
    const headline = courses[0];
    for (const row of rows) {
      const existing = courses.find(c => c.name.toLowerCase() === String(row[0]).toLowerCase());
      // The seed row wins on the facts it already has; the content row
      // contributes the one thing it knows better — the sales note.
      if (existing) { existing.note = existing.note ?? row[4] ?? null; continue; }
      courses.push(courseFromContentRow(inst.id, row, headline));
    }
  }
  return { ...inst, courses, approvals: inst.approvals.map(a => ({ ...a })), cutoffs: inst.cutoffs.map(c => ({ ...c })) };
}

let institutions = seedInstitutions.map(bootstrapInstitution);
let seq = 0;

/** Every row, active or not — lib/store.js applies its own isActive filters. */
export const allInstitutions = () => institutions;
export const listInstitutions = ({ includeInactive = false, vertical } = {}) =>
  institutions.filter(i => (includeInactive || i.isActive) && (!vertical || i.vertical === vertical));
export const findInstitution = idOrSlug =>
  institutions.find(i => i.id === idOrSlug || i.slug === idOrSlug) ?? null;

function uniqueId(base) {
  let id = base || 'institution';
  let n = 2;
  while (institutions.some(i => i.id === id)) id = `${base}-${n++}`;
  return id;
}

/** Field-level validation. Returns {} when the input is usable. */
export function validateInstitution(input, { partial = false } = {}) {
  const e = {};
  const has = k => input[k] !== undefined && input[k] !== null && input[k] !== '';
  const need = k => (partial ? has(k) : true);

  if (need('name') && !String(input.name ?? '').trim()) e.name = 'Name is required.';
  if (need('vertical') && !['distance', 'colleges'].includes(input.vertical)) {
    e.vertical = 'Vertical must be distance or colleges.';
  }
  if (need('city') && !String(input.city ?? '').trim()) e.city = 'City is required.';
  if (need('type') && !String(input.type ?? '').trim()) e.type = 'Type is required.';
  if (has('rating') && (Number(input.rating) < 0 || Number(input.rating) > 5)) {
    e.rating = 'Rating must be between 0 and 5.';
  }
  if (has('established') && (!Number.isInteger(Number(input.established)) || Number(input.established) < 1800)) {
    e.established = 'Enter a four-digit year.';
  }
  if (has('featuredPriority') && (Number(input.featuredPriority) < 0 || Number(input.featuredPriority) > 100)) {
    e.featuredPriority = 'Priority runs from 0 to 100.';
  }
  return e;
}

/** Field-level validation for one course. Fee is the field the fee module cuts
 *  instalments from, so a missing or negative fee is refused rather than
 *  silently becoming zero. */
export function validateCourse(input, { partial = false } = {}) {
  const e = {};
  const has = k => input[k] !== undefined && input[k] !== null && input[k] !== '';
  const need = k => (partial ? has(k) : true);

  if (need('name') && !String(input.name ?? '').trim()) e.name = 'Course name is required.';
  if (need('totalFee')) {
    const f = Number(input.totalFee);
    if (!Number.isFinite(f) || f < 0) e.totalFee = 'Enter the total fee in rupees.';
  }
  if (has('mrpFee')) {
    const mrp = Number(input.mrpFee), fee = Number(input.totalFee);
    if (!Number.isFinite(mrp) || mrp < 0) e.mrpFee = 'Enter a valid list fee.';
    else if (Number.isFinite(fee) && mrp < fee) e.mrpFee = 'The list fee cannot be below the payable fee.';
  }
  if (has('level') && !LEVELS.includes(input.level)) e.level = `Level must be one of: ${LEVELS.join(', ')}.`;
  if (has('durationMonths') && (!Number.isInteger(Number(input.durationMonths)) || Number(input.durationMonths) < 1)) {
    e.durationMonths = 'Duration must be a whole number of months.';
  }
  if (has('seats') && (!Number.isInteger(Number(input.seats)) || Number(input.seats) < 0)) {
    e.seats = 'Seats must be a whole number.';
  }
  return e;
}

export function createInstitution(input, { actor = 'admin' } = {}) {
  const errors = validateInstitution(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = String(input.name).trim();
  const id = uniqueId(slugify(input.id || name));
  const inst = {
    id, vertical: input.vertical, slug: id, name,
    mark: String(input.mark ?? '').trim().toUpperCase()
      || name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    type: String(input.type).trim(),
    city: String(input.city).trim(), state: String(input.state ?? '').trim(),
    country: String(input.country ?? 'India').trim(),
    established: input.established ? Number(input.established) : null,
    rating: Number(input.rating ?? 4), reviews: Number(input.reviews ?? 0),
    nirfRank: input.nirfRank ? Number(input.nirfRank) : null,
    featuredPriority: Number(input.featuredPriority ?? 0),
    description: String(input.description ?? '').trim(),
    isActive: input.isActive !== false,
    approvals: Array.isArray(input.approvals) ? input.approvals.map(a => ({
      body: String(a.body ?? '').trim(), grade: String(a.grade ?? '').trim(),
      validTill: a.validTill ?? null, certificateUrl: a.certificateUrl ?? null
    })).filter(a => a.body) : [],
    courses: [], cutoffs: [], placement: null,
    createdBy: actor, updatedAt: new Date().toISOString()
  };
  institutions.unshift(inst);
  seq++;
  if (Array.isArray(input.courses)) for (const c of input.courses) addCourse(inst.id, c);
  return { ok: true, institution: inst };
}

export function updateInstitution(id, patch, { actor = 'admin' } = {}) {
  const inst = findInstitution(id);
  if (!inst) return { ok: false, error: 'NOT_FOUND' };
  const errors = validateInstitution(patch, { partial: true });
  if (Object.keys(errors).length) return { ok: false, errors };

  const numeric = ['rating', 'reviews', 'established', 'nirfRank', 'featuredPriority'];
  const writable = ['name', 'vertical', 'type', 'city', 'state', 'country', 'description',
    'mark', 'isActive', ...numeric];
  for (const k of writable) {
    if (patch[k] === undefined) continue;
    inst[k] = k === 'isActive' ? !!patch[k]
      : numeric.includes(k) ? (patch[k] === '' || patch[k] === null ? null : Number(patch[k]))
      : String(patch[k]).trim();
  }
  if (Array.isArray(patch.approvals)) {
    inst.approvals = patch.approvals
      .map(a => ({ body: String(a.body ?? '').trim(), grade: String(a.grade ?? '').trim(),
        validTill: a.validTill ?? null, certificateUrl: a.certificateUrl ?? null }))
      .filter(a => a.body);
  }
  inst.updatedAt = new Date().toISOString();
  inst.updatedBy = actor;
  return { ok: true, institution: inst };
}

/**
 * Soft delete by default: an institution with applications against it has to
 * survive so the admissions pipeline stays coherent, exactly as with jobs.
 */
export function deleteInstitution(id, { hard = false } = {}) {
  const i = institutions.findIndex(x => x.id === id || x.slug === id);
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  const inst = institutions[i];
  if (hard) { institutions.splice(i, 1); return { ok: true, institution: inst, hard: true }; }
  inst.isActive = false;
  inst.updatedAt = new Date().toISOString();
  return { ok: true, institution: inst, hard: false };
}

export const listCourses = (institutionId, { includeInactive = false } = {}) => {
  const inst = findInstitution(institutionId);
  if (!inst) return [];
  return inst.courses.filter(c => includeInactive || c.isActive !== false);
};

export const findCourse = (institutionId, courseIdOrName) => {
  const inst = findInstitution(institutionId);
  if (!inst) return null;
  const key = String(courseIdOrName ?? '').toLowerCase();
  return inst.courses.find(c => c.id === courseIdOrName || c.name.toLowerCase() === key) ?? null;
};

export function addCourse(institutionId, input) {
  const inst = findInstitution(institutionId);
  if (!inst) return { ok: false, error: 'NOT_FOUND' };
  const errors = validateCourse(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const name = String(input.name).trim();
  if (inst.courses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, errors: { name: `${inst.name} already lists a course called "${name}".` } };
  }
  const months = Number(input.durationMonths) || monthsFrom(input.duration) || 12;
  const totalFee = Number(input.totalFee) || 0;
  const course = {
    id: courseId(inst.id, name), name,
    level: input.level ?? 'UG', stream: String(input.stream ?? 'General').trim(),
    durationMonths: months, mode: input.mode ?? (inst.vertical === 'colleges' ? 'Regular' : 'Online'),
    totalFee, mrpFee: input.mrpFee ? Number(input.mrpFee) : null,
    emiAvailable: input.emiAvailable !== false && totalFee > 0,
    emiMonthly: input.emiMonthly ? Number(input.emiMonthly) : (totalFee > 0 ? Math.round(totalFee / months) : null),
    seats: input.seats === '' || input.seats == null ? null : Number(input.seats),
    eligibility: String(input.eligibility ?? '10+2 from a recognised board').trim(),
    examAccepted: Array.isArray(input.examAccepted) ? input.examAccepted
      : String(input.examAccepted ?? '').split(',').map(s => s.trim()).filter(Boolean),
    deadline: String(input.deadline ?? 'Rolling').trim(),
    note: input.note ? String(input.note).trim() : null,
    isActive: input.isActive !== false
  };
  inst.courses.push(course);
  inst.updatedAt = new Date().toISOString();
  return { ok: true, course, institution: inst };
}

export function updateCourse(institutionId, cid, patch) {
  const inst = findInstitution(institutionId);
  if (!inst) return { ok: false, error: 'NOT_FOUND' };
  const course = findCourse(institutionId, cid);
  if (!course) return { ok: false, error: 'NOT_FOUND' };
  const errors = validateCourse({ totalFee: course.totalFee, ...patch }, { partial: true });
  if (Object.keys(errors).length) return { ok: false, errors };

  const numeric = ['totalFee', 'mrpFee', 'durationMonths', 'emiMonthly', 'seats'];
  for (const k of ['name', 'level', 'stream', 'mode', 'eligibility', 'deadline', 'note', 'isActive', ...numeric]) {
    if (patch[k] === undefined) continue;
    course[k] = k === 'isActive' ? !!patch[k]
      : numeric.includes(k) ? (patch[k] === '' || patch[k] === null ? null : Number(patch[k]))
      : patch[k] === null ? null : String(patch[k]).trim();
  }
  if (patch.examAccepted !== undefined) {
    course.examAccepted = Array.isArray(patch.examAccepted) ? patch.examAccepted
      : String(patch.examAccepted).split(',').map(s => s.trim()).filter(Boolean);
  }
  // EMI follows the fee unless it was set by hand in the same edit: a fee cut
  // that left last season's instalment on the card would understate the total.
  if (patch.totalFee !== undefined && patch.emiMonthly === undefined) {
    course.emiMonthly = course.totalFee > 0 ? Math.round(course.totalFee / (course.durationMonths || 12)) : null;
    course.emiAvailable = course.totalFee > 0;
  }
  inst.updatedAt = new Date().toISOString();
  return { ok: true, course, institution: inst };
}

/** Soft by default, for the same reason institutions are. */
export function deleteCourse(institutionId, cid, { hard = false } = {}) {
  const inst = findInstitution(institutionId);
  if (!inst) return { ok: false, error: 'NOT_FOUND' };
  const i = inst.courses.findIndex(c => c.id === cid || c.name === cid);
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  if (inst.courses.filter(c => c.isActive !== false).length === 1 && !hard) {
    return { ok: false, error: 'LAST_COURSE', message: 'An institution needs at least one live course. Deactivate the institution instead.' };
  }
  const course = inst.courses[i];
  if (hard) { inst.courses.splice(i, 1); } else { course.isActive = false; }
  inst.updatedAt = new Date().toISOString();
  return { ok: true, course, hard };
}

/** Headline numbers for the console's catalogue tab. */
export function catalogueStats() {
  const live = institutions.filter(i => i.isActive);
  const courses = live.flatMap(i => i.courses.filter(c => c.isActive !== false));
  const fees = courses.map(c => c.totalFee).filter(f => f > 0).sort((a, b) => a - b);
  return {
    institutions: institutions.length,
    active: live.length,
    inactive: institutions.length - live.length,
    distance: live.filter(i => i.vertical === 'distance').length,
    colleges: live.filter(i => i.vertical === 'colleges').length,
    courses: courses.length,
    medianFee: fees.length ? fees[Math.floor(fees.length / 2)] : 0,
    missingFee: courses.filter(c => !c.totalFee).length,
    withoutCourses: live.filter(i => !i.courses.some(c => c.isActive !== false)).length
  };
}

export const __resetInstitutions = () => {
  institutions = seedInstitutions.map(bootstrapInstitution);
  seq = 0;
};
