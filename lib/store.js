/**
 * In-memory query layer over the demo dataset.
 *
 * This is the single source of truth for both the React UI and the /api routes,
 * so the two can never drift. Swapping in Supabase means reimplementing these
 * functions against the real tables — the call sites do not change.
 */
import { institutions, boards, countries, skillCourses } from './data/index.js';
// Jobs and companies are mutable (admin CRUD), so they come from the repository
// rather than the frozen seed — a job posted in /admin is listed publicly at once.
import { listJobs, findJob, findCompany, listCompanies } from './jobs-repo.js';

const money = n => '₹' + n.toLocaleString('en-IN');
const yearsFromMonths = m => (m % 12 === 0 ? `${m / 12} years` : `${(m / 12).toFixed(1)} years`);

function approvalLabel(a) {
  if (a.body === 'UGC-DEB') return 'UGC entitled';
  if (a.body === 'INI') return 'INI';
  if (a.body === 'NMC') return 'NMC approved';
  return `${a.body} ${a.grade}`;
}

/** Projects an Institution into the flat shape the listing/detail cards render. */
export function institutionCard(inst) {
  const c = inst.courses[0] ?? null;
  const topCutoff = inst.cutoffs.find(x => x.category === 'Gen');
  // The entrance exam is a property of the course, not of the vertical. Calling
  // every college cutoff a NEET cutoff labelled NIT Patna — a JEE Main
  // institute — as a medical seat, so read the exam the course actually takes.
  const exam = c?.examAccepted?.[0] ?? null;
  // Per-category closing ranks, keyed the way the seed keys them ('Gen',
  // 'OBC', …), so consumers can use a real cutoff instead of guessing an offset.
  const cutoffs = Object.fromEntries(inst.cutoffs.map(x => [x.category, x.closingRank]));
  return {
    id: inst.id, slug: inst.slug, vertical: inst.vertical, mark: inst.mark, name: inst.name,
    place: `${inst.city}, ${inst.state}`, type: inst.type,
    // Two facts the card projection dropped, both of which the public listing
    // now filters on. `streams` is the set of subjects this institution
    // actually teaches — the seed records it per course, so a "Medical" or
    // "Engineering" filter can be answered from the catalogue instead of being
    // guessed from the name. `country` is what makes a study-abroad filter
    // possible at all. Both are additive: nothing that read this shape before
    // sees a changed field.
    streams: [...new Set(inst.courses.map(x => x.stream).filter(Boolean))],
    country: inst.country ?? null,
    course: c?.name ?? '—',
    fee: c?.totalFee ?? 0,
    emi: inst.vertical === 'colleges'
      ? (c?.seats != null ? `${c.seats} seats` : '—')
      : (c?.emiMonthly != null ? `${money(c.emiMonthly)}/mo` : 'No EMI'),
    rating: inst.rating, reviews: inst.reviews,
    approval: inst.approvals.map(approvalLabel).slice(0, 3),
    // The strike-through price is real catalogue data, not a display flourish:
    // it is the fee before the current intake discount, so the card must carry
    // it rather than reconstruct one.
    mrp: c?.mrpFee ?? null,
    duration: c ? yearsFromMonths(c.durationMonths) : '—',
    exam, cutoffs, cutoff: topCutoff?.closingRank ?? null,
    mode: inst.vertical === 'colleges' && topCutoff
      ? `${exam ?? 'Entrance'} • cutoff ${topCutoff.closingRank}`
      : (c?.mode ?? '—'),
    deadline: c?.deadline ?? '—',
    featured: inst.featuredPriority >= 80, priority: inst.featuredPriority
  };
}

/** Projects a Job into the same flat card shape, so one card component serves all verticals. */
/** Whole days since an ISO date, used for the "posted this week" facet. */
function daysSince(iso) {
  const d = Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000);
  return Number.isFinite(d) ? Math.max(0, d) : null;
}

const monthly = n => '₹' + Math.round(n / 12).toLocaleString('en-IN');

/** Projects a Job into the same flat card shape, so one card component serves all verticals. */
export function jobCard(job) {
  const co = findCompany(job.companyId);
  const pay = job.salaryMin === job.salaryMax
    ? `${monthly(job.salaryMin)}/mo`
    : `${monthly(job.salaryMin)}–${monthly(job.salaryMax).replace('₹', '')}/mo`;
  const city = job.city ?? (job.wfh ? 'Remote' : job.location.split(',').slice(-2, -1)[0]?.trim() ?? job.location);
  return {
    // The public URL is /jobs/:slug, and saved/compare entries are keyed on this
    // id, so the card id is the slug rather than the internal record id.
    id: job.slug, slug: job.slug, vertical: 'jobs', mark: co?.mark ?? 'JB', name: job.title,
    company: co?.name ?? 'Company',
    place: `${co?.name ?? 'Company'} • ${job.wfh ? 'Work from home' : (job.area ? `${job.area}, ${city}` : city)}`,
    city, area: job.area ?? null, wfh: !!job.wfh,
    // Coordinates travel with the card because "jobs near me" ranks on them.
    pos: job.lat != null && job.lng != null ? [job.lat, job.lng] : null,
    type: job.jobType,
    course: job.eligibility ?? `${job.qualification} • ${job.experienceMin === 0 ? 'Fresher' : job.experienceMin + '+ yrs'}`,
    qualification: job.qualification, experienceMin: job.experienceMin,
    fee: job.salaryMin, salaryMax: job.salaryMax,
    emi: `${job.openings} opening${job.openings === 1 ? '' : 's'}`,
    // The formatted string above is for a card; the raw count is for anything
    // that has to add openings up (the hero proof tiles total them).
    openings: job.openings,
    // Employer reputation belongs to the company. The previous projection
    // invented reviews as openings × 8, which read as data but was arithmetic.
    rating: co?.rating ?? null, reviews: co?.reviews ?? null,
    approval: job.tags ?? [co?.isVerified ? 'Verified company' : 'Unverified', job.wfh ? 'Work from home' : null].filter(Boolean),
    duration: job.jobType === 'Internship' ? `${pay} stipend` : pay,
    mode: job.roleType ?? job.industry,
    sector: job.industry,
    postedDays: daysSince(job.postedOn),
    deadline: job.deadlineLabel
      ?? `Apply by ${new Date(job.expiresOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    featured: job.featured, priority: job.featured ? 90 : 50
  };
}

const SORTS = {
  relevance: (a, b) => b.featured - a.featured || b.priority - a.priority || (b.rating ?? 0) - (a.rating ?? 0),
  'fee-asc': (a, b) => a.fee - b.fee,
  'fee-desc': (a, b) => b.fee - a.fee,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  fastest: (a, b) => parseFloat(a.duration) - parseFloat(b.duration)
};

/**
 * @param {'distance'|'colleges'|'jobs'} vertical
 * @param {{q?:string,type?:string,mode?:string,feeMin?:number,feeMax?:number,approval?:string,
 *          wfh?:boolean,qualification?:string,city?:string,sector?:string,
 *          sort?:string,page?:number,pageSize?:number}} opts
 */
export function listEntities(vertical, opts = {}) {
  const { q, type, mode, feeMin, feeMax, approval, wfh, qualification, city, sector,
    sort = 'relevance', page = 1, pageSize = 20 } = opts;

  let rows = vertical === 'jobs'
    ? listJobs().map(jobCard)
    : institutions.filter(i => i.isActive && i.vertical === vertical).map(institutionCard);

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(r => `${r.name} ${r.place} ${r.course} ${r.mode}`.toLowerCase().includes(needle));
  }
  if (type) rows = rows.filter(r => r.type.toLowerCase() === type.toLowerCase());
  if (mode) rows = rows.filter(r => r.mode.toLowerCase().includes(mode.toLowerCase()));
  if (feeMin != null) rows = rows.filter(r => r.fee >= feeMin);
  if (feeMax != null) rows = rows.filter(r => r.fee <= feeMax);
  if (approval) rows = rows.filter(r => r.approval.some(a => a.toLowerCase().includes(approval.toLowerCase())));
  // Both of these used to re-derive from the source rows: wfh by rebuilding an
  // id set, qualification by string-matching the display line. The card now
  // carries the real fields, so they filter on the value rather than its prose.
  if (wfh != null && vertical === 'jobs') rows = rows.filter(r => r.wfh === wfh);
  if (qualification && vertical === 'jobs') {
    rows = rows.filter(r => r.qualification?.toLowerCase() === qualification.toLowerCase());
  }
  if (city && vertical === 'jobs') rows = rows.filter(r => r.city === city);
  if (sector && vertical === 'jobs') rows = rows.filter(r => r.sector === sector);

  rows.sort(SORTS[sort] ?? SORTS.relevance);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: start + pageSize < total
  };
}

export function getInstitution(vertical, slug) {
  const inst = institutions.find(i => i.vertical === vertical && (i.slug === slug || i.id === slug));
  return inst ? { ...inst, card: institutionCard(inst) } : null;
}

export function getJob(idOrSlug) {
  const job = findJob(idOrSlug);
  if (!job) return null;
  return { ...job, company: findCompany(job.companyId), card: jobCard(job) };
}

/** Compare up to 3 items; flags which rows actually differ (PRD §5.5). */
export function compare(vertical, ids) {
  const picked = ids.slice(0, 3).map(id => vertical === 'jobs'
    ? (getJob(id)?.card ?? null)
    : (getInstitution(vertical, id)?.card ?? null)).filter(Boolean);
  const fields = ['fee', 'duration', 'mode', 'deadline', 'rating', 'emi', 'type'];
  const rows = fields.map(f => {
    const values = picked.map(p => p[f]);
    return { field: f, values, differs: new Set(values.map(String)).size > 1 };
  });
  return { items: picked, rows };
}

export function searchAll(q, vertical) {
  if (!q || q.trim().length < 2) return { query: q ?? '', current: [], other: [] };
  const hit = v => listEntities(v, { q, pageSize: 5 }).rows.map(r => ({ ...r, vertical: v }));
  const current = vertical ? hit(vertical) : [];
  const other = ['distance', 'colleges', 'jobs'].filter(v => v !== vertical).flatMap(hit).slice(0, 6);
  return { query: q, current, other };
}

/** Rank predictor (PRD §6.4). Buckets by margin against last-year closing rank. */
/** The counselling forms say 'General'; the cutoff table says 'Gen'. */
const CATEGORY_KEY = { General: 'Gen', Gen: 'Gen', OBC: 'OBC', SC: 'SC', ST: 'ST', EWS: 'EWS' };

/**
 * Buckets colleges against a rank using their recorded closing ranks.
 *
 * `exam` is not optional decoration: a closing rank only means something
 * alongside the exam that produced it, and the catalogue holds both medical
 * (NEET-UG) and engineering (JEE Main) institutions. Without the filter a NEET
 * rank was being matched against NIT Patna's JEE closing rank.
 *
 * A college with no cutoff for the requested category falls back to the
 * General cutoff; `exactCategory` records which of the two was used so the
 * interface can say so rather than implying a category-specific prediction.
 */
export function predictColleges({ rank, category = 'Gen', budget, exam = 'NEET-UG' }) {
  const key = CATEGORY_KEY[category] ?? 'Gen';
  const out = { strong: [], possible: [], backup: [] };
  for (const inst of institutions.filter(i => i.vertical === 'colleges' && i.isActive)) {
    if (exam && !inst.courses.some(c => c.examAccepted?.includes(exam))) continue;
    const exact = inst.cutoffs.find(c => c.category === key);
    const cut = exact ?? inst.cutoffs.find(c => c.category === 'Gen');
    if (!cut) continue;
    const card = { ...institutionCard(inst), closingRank: cut.closingRank, cutoffCategory: cut.category, exactCategory: Boolean(exact) };
    if (budget != null && card.fee > budget) continue;
    if (rank <= cut.closingRank * 0.8) out.strong.push(card);
    else if (rank <= cut.closingRank * 1.15) out.possible.push(card);
    else out.backup.push(card);
  }
  return out;
}

export function checkAbroadEligibility({ marks, neetQualified, budget }) {
  const reasons = [];
  if (marks < 50) reasons.push('NMC requires at least 50% in PCB for foreign medical study.');
  if (!neetQualified) reasons.push('NEET qualification is required to practise in India after an overseas MBBS.');
  const affordable = countries.filter(c => budget == null || c.totalCostMin <= budget);
  return { eligible: reasons.length === 0, reasons, countries: affordable };
}

export { boards, countries, skillCourses, listCompanies };
