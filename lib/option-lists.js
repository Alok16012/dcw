/**
 * The vocabularies behind the console's dropdowns, made editable.
 *
 * Every `<select>` in /admin used to be a literal array written into the JSX
 * that rendered it — the five course levels appeared verbatim in
 * catalogue/[id]/page.jsx, again in AddWizard.jsx and a third time as the
 * validation list in institutions-repo.js. Adding one level meant three edits
 * and a deploy, which is not something an operations team can do, so in
 * practice the lists never changed and staff typed the value they wanted into
 * whatever free-text field was nearest.
 *
 * This module is the single list. The repositories validate against it, the
 * console renders from it, and /api/admin/options edits it.
 *
 * WHAT IS DELIBERATELY NOT HERE. Admission and application statuses are not
 * vocabulary, they are a state machine: allowedTransitions() in
 * integrations/admissions.js decides what may follow what, and renaming
 * "Verified" from a settings screen would silently break the transitions and
 * the fee triggers hanging off them. Institution `status` (draft / published /
 * archived) is the same kind of thing. Both stay in code, and the settings
 * screen says so rather than pretending otherwise.
 *
 * PERSISTENCE: process memory, matching institutions-repo.js and jobs-repo.js.
 * Swapping in Supabase means one `option_values` table (set_key, value, sort)
 * and reimplementing the exported functions; no call site changes.
 */

/**
 * The sets, and the seeds they start from.
 *
 * `field` names where the value is stored, and is what lib/option-usage.js uses
 * to count usages and to carry a rename through to the records that already
 * hold the old string. A set with no `field` is a pure picker — nothing stores
 * it — so renaming one can never orphan a record.
 *
 * `locked` values are ones the product genuinely depends on: `lib/store.js`
 * splits the public catalogue on the `10th`/`12th` levels to build the open
 * school path, and the apply flow keys EMI off `Online`. They can be renamed
 * (the label is cosmetic) but not deleted.
 */
const SETS = {
  'course.level': {
    label: 'Course level',
    hint: 'Levels a course can sit at. Used in the catalogue editor and the add-listing wizard.',
    field: 'course.level',
    seed: ['10th', '12th', 'Diploma', 'UG', 'PG']
  },
  'course.mode': {
    label: 'Study mode',
    hint: 'How the course is delivered. Shown on the public listing card.',
    field: 'course.mode',
    seed: ['Online', '100% online', 'Distance', 'Open school', 'Regular']
  },
  'course.stream': {
    label: 'Stream / branch',
    hint: 'The subject a course belongs to. This is the branch shown against a student.',
    field: 'course.stream',
    seed: ['General', 'Management', 'Commerce', 'Science', 'Arts', 'Engineering',
      'IT', 'Medical', 'Law', 'Computer Application', 'Education']
  },
  /* Cased the way the seed catalogue already cases them — "Private university",
     not "Private University". A dropdown whose options differ from the stored
     strings by a capital letter renders as nothing selected, which reads as
     missing data. Anything the catalogue holds and this list does not is folded
     in at boot by absorbCatalogueOptions(). */
  'institution.type': {
    label: 'Institution type',
    hint: 'Deemed university, State university, Private college, Open school and so on.',
    field: 'institution.type',
    seed: ['Central university', 'State university', 'Deemed university', 'Private university',
      'Government', 'Private', 'Deemed', 'Private college', 'Government college', 'Open school']
  },
  'student.qualification': {
    label: 'Student qualification',
    hint: 'What the student has already passed. Asked on the apply form and editable per student.',
    field: 'admission.qualification',
    seed: ['10th pass', '12th pass / appearing', 'Graduate', 'Post graduate', 'Diploma']
  },
  'student.counsellor': {
    label: 'Counsellors',
    hint: 'Who a student file can be assigned to.',
    field: 'admission.counsellor',
    seed: ['Priya S.', 'Ankit R.', 'Neha K.']
  },
  'job.type': {
    label: 'Job type',
    hint: 'Full-time, Part-time, Internship and so on. Offered when posting a job and shown on the public listing.',
    field: 'job.jobType',
    seed: ['Full-time', 'Part-time', 'Internship']
  },
  'job.qualification': {
    label: 'Job minimum qualification',
    hint: 'The least a candidate needs for a role. Separate from the student list because a job asks “10th”, not “10th pass”.',
    field: 'job.qualification',
    seed: ['10th', '12th', 'Graduate', 'Any']
  },
  'proof.kind': {
    label: 'Proof of work type',
    hint: 'The kinds of evidence that can be filed against a listing or an employer.',
    field: 'proof.kind',
    seed: ['Result', 'Placement', 'Admission letter', 'Certificate', 'Event', 'Press', 'Other']
  }
};

const LOCKED = {
  'course.level': ['10th', '12th'],
  'course.mode': ['Online'],
  /* `Internship` only: lib/store.js:155 labels the pay line "stipend" for it by
     name, so deleting it would leave the console offering no way to mark a
     posting as unpaid-with-a-stipend. `Full-time` and `Any` are the defaults a
     new posting falls back to, but jobs-repo resolves those through this list
     at write time, so removing either is safe — it just promotes whatever is
     first. Renaming `Internship` is allowed and carries through to the jobs;
     the stipend wording is the one thing that would not follow it. */
  'job.type': ['Internship'],
  'proof.kind': ['Other']
};

export const OPTION_SET_KEYS = Object.keys(SETS);

/** key -> string[]. Rebuilt from the seeds by __resetOptionLists(). */
let values = new Map(OPTION_SET_KEYS.map(k => [k, SETS[k].seed.slice()]));

const clean = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase();

export const isOptionSet = key => Object.hasOwn(SETS, key);
export const optionSetMeta = key => (isOptionSet(key) ? { key, ...SETS[key] } : null);

/** The live values for one set. Always a copy — callers sort and filter these. */
export const getOptions = key => (values.get(key) ?? []).slice();

/** Is `value` one of this set's options? Case-insensitive, because the value
 *  a record already holds was typed by a person. */
export const isOption = (key, value) => (values.get(key) ?? []).some(v => same(v, value));

/** Every set, with its values — one request for the whole settings screen. */
export const listOptionSets = () => OPTION_SET_KEYS.map(key => ({
  key, label: SETS[key].label, hint: SETS[key].hint, field: SETS[key].field ?? null,
  locked: LOCKED[key] ?? [], values: getOptions(key)
}));

/**
 * Adds one value.
 *
 * Duplicate-insensitive rather than duplicate-erroring: "Diploma" and "diploma"
 * in the same dropdown is a data problem, not two options, and a settings screen
 * that refuses the second one with a red message teaches nothing a silent
 * no-op does not.
 */
export function addOption(key, value) {
  if (!isOptionSet(key)) return { ok: false, error: 'NO_SET' };
  const v = clean(value);
  if (!v) return { ok: false, error: 'EMPTY', message: 'Type the option first.' };
  if (v.length > 60) return { ok: false, error: 'TOO_LONG', message: 'Keep it under 60 characters.' };
  const list = values.get(key);
  if (list.some(x => same(x, v))) return { ok: true, values: list.slice(), duplicate: true };
  list.push(v);
  return { ok: true, values: list.slice(), duplicate: false };
}

/**
 * Renames one value in place.
 *
 * The position is kept because these lists are ordered by meaning — 10th, 12th,
 * Diploma, UG, PG is a progression, and re-sorting on rename would scramble it.
 * Carrying the new string through to the records that hold the old one is NOT
 * done here: this module has no idea what a course is. lib/option-usage.js does
 * that, and the route calls both.
 */
export function renameOption(key, from, to) {
  if (!isOptionSet(key)) return { ok: false, error: 'NO_SET' };
  const v = clean(to);
  if (!v) return { ok: false, error: 'EMPTY', message: 'Type the new name first.' };
  if (v.length > 60) return { ok: false, error: 'TOO_LONG', message: 'Keep it under 60 characters.' };
  const list = values.get(key);
  const i = list.findIndex(x => same(x, from));
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  if (list.some((x, j) => j !== i && same(x, v))) {
    return { ok: false, error: 'DUPLICATE', message: `“${v}” is already in this list.` };
  }
  const previous = list[i];
  list[i] = v;
  return { ok: true, previous, value: v, values: list.slice() };
}

/**
 * Removes one value.
 *
 * The caller is expected to have counted usages first and to pass `force` only
 * when somebody has been shown the count and said yes anyway. Removing a value
 * never touches the records holding it — a course whose level was deleted keeps
 * reading "UG", it just stops being offered in the dropdown — because silently
 * blanking a field across the catalogue is a far worse outcome than a stale
 * string, and the settings screen says which records are affected.
 */
export function removeOption(key, value, { force = false } = {}) {
  if (!isOptionSet(key)) return { ok: false, error: 'NO_SET' };
  const list = values.get(key);
  const i = list.findIndex(x => same(x, value));
  if (i === -1) return { ok: false, error: 'NOT_FOUND' };
  if ((LOCKED[key] ?? []).some(x => same(x, value))) {
    return { ok: false, error: 'LOCKED',
      message: `“${list[i]}” is used by the public site's own logic and cannot be removed. Rename it instead.` };
  }
  if (list.length === 1 && !force) {
    return { ok: false, error: 'LAST_VALUE', message: 'A dropdown needs at least one option.' };
  }
  const [removed] = list.splice(i, 1);
  return { ok: true, value: removed, values: list.slice() };
}

/** Drag-to-reorder. Unknown or missing entries are ignored rather than dropped,
 *  so a stale client cannot delete a value by sending an incomplete order. */
export function reorderOptions(key, order) {
  if (!isOptionSet(key)) return { ok: false, error: 'NO_SET' };
  if (!Array.isArray(order)) return { ok: false, error: 'BAD_ORDER' };
  const list = values.get(key);
  const seen = [];
  for (const want of order) {
    const hit = list.find(x => same(x, want));
    if (hit && !seen.includes(hit)) seen.push(hit);
  }
  for (const x of list) if (!seen.includes(x)) seen.push(x);
  values.set(key, seen);
  return { ok: true, values: seen.slice() };
}

export const __resetOptionLists = () => {
  values = new Map(OPTION_SET_KEYS.map(k => [k, SETS[k].seed.slice()]));
};
