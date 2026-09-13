/**
 * What is actually using a dropdown option, and what a rename has to follow.
 *
 * lib/option-lists.js deliberately knows nothing about courses, students or
 * proof — it is a list of strings. This module is the bridge: it walks the
 * repositories that store those strings, so the settings screen can say
 * "7 courses are UG" before somebody deletes UG, and so renaming "PG" to
 * "Master's" changes the seven courses as well as the dropdown.
 *
 * WHY A RENAME CASCADES BUT A DELETE DOES NOT. Renaming is the same value
 * under a new label; leaving records on the old string would split one level
 * into two and break every filter that groups on it. Deleting is "stop offering
 * this from now on" — the records that already hold it are history, and blanking
 * a field across the catalogue to tidy a dropdown destroys more than it fixes.
 * So a delete reports the count and leaves the data alone.
 */
import { allInstitutions } from './institutions-repo.js';
import { listCompanies, listJobs } from './jobs-repo.js';
import { listAdmissions } from './integrations/admissions.js';
import { OPTION_SET_KEYS, optionSetMeta, addOption } from './option-lists.js';

const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

/**
 * Every place one field is stored, as a flat list of
 * `{ label, rows: () => object[] , key: string }`.
 *
 * `rows()` must return the live objects, not copies, or a rename would edit a
 * snapshot and vanish. allInstitutions(), listCompanies() and listAdmissions()
 * all hand back the real records for exactly this reason.
 */
const FIELDS = {
  'course.level': [
    { label: 'course', rows: () => allInstitutions().flatMap(i => i.courses), key: 'level' }
  ],
  'course.mode': [
    { label: 'course', rows: () => allInstitutions().flatMap(i => i.courses), key: 'mode' }
  ],
  'course.stream': [
    { label: 'course', rows: () => allInstitutions().flatMap(i => i.courses), key: 'stream' },
    // A student's branch is the stream of the course they applied to, so the two
    // have to move together or a rename would leave every enrolled student
    // filed under a branch that no longer exists.
    { label: 'student', rows: () => listAdmissions(), key: 'branch' }
  ],
  'institution.type': [
    { label: 'listing', rows: () => allInstitutions(), key: 'type' }
  ],
  'admission.qualification': [
    { label: 'student', rows: () => listAdmissions(), key: 'qualification' }
  ],
  'admission.counsellor': [
    { label: 'student', rows: () => listAdmissions(), key: 'counsellor' }
  ],
  // Retired postings count too: a job type is still "in use" by a closed
  // vacancy, and a rename has to follow it or the archive stops matching.
  'job.jobType': [
    { label: 'job', rows: () => listJobs({ includeInactive: true }), key: 'jobType' }
  ],
  'job.qualification': [
    { label: 'job', rows: () => listJobs({ includeInactive: true }), key: 'qualification' }
  ],
  'proof.kind': [
    { label: 'listing proof', rows: () => allInstitutions().flatMap(i => i.proofOfWork ?? []), key: 'kind' },
    { label: 'employer proof', rows: () => listCompanies().flatMap(c => c.proofOfWork ?? []), key: 'kind' }
  ]
};

/**
 * How many records hold this value, broken down by what kind of record.
 * @returns {{total:number, by:Array<{label:string,count:number}>}}
 */
export function countUsage(field, value) {
  const targets = FIELDS[field] ?? [];
  const by = targets.map(t => ({
    label: t.label,
    count: t.rows().filter(r => same(r?.[t.key], value)).length
  })).filter(x => x.count > 0);
  return { total: by.reduce((n, x) => n + x.count, 0), by };
}

/** Usage counts for every value in one set, keyed by value. */
export function usageMap(field, list) {
  return Object.fromEntries(list.map(v => [v, countUsage(field, v).total]));
}

/**
 * Folds every value the data already holds into its dropdown.
 *
 * The seeds in option-lists.js are a starting vocabulary written by hand; the
 * catalogue is thirteen years of real listings. Where the two disagree the data
 * wins, because a `<select>` whose options do not include the value a record
 * holds renders as blank and reads as missing data. Called once, from
 * ensureSeeded(), after the repositories have their rows.
 */
export function absorbCatalogueOptions() {
  for (const key of OPTION_SET_KEYS) {
    const field = optionSetMeta(key).field;
    for (const t of FIELDS[field] ?? []) {
      for (const row of t.rows()) {
        const v = row?.[t.key];
        if (typeof v === 'string' && v.trim()) addOption(key, v);
      }
    }
  }
}

/** Carries a rename through to every record holding the old string.
 *  @returns {number} how many records were rewritten. */
export function applyRename(field, from, to) {
  let n = 0;
  for (const t of FIELDS[field] ?? []) {
    for (const row of t.rows()) {
      if (row && same(row[t.key], from)) { row[t.key] = to; n++; }
    }
  }
  return n;
}
