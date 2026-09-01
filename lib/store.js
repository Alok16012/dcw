/**
 * In-memory query layer over the demo dataset.
 *
 * This is the single source of truth for both the React UI and the /api routes,
 * so the two can never drift. Swapping in Supabase means reimplementing these
 * functions against the real tables — the call sites do not change.
 */
import { institutions, jobs, companies, boards, countries, skillCourses } from './data/index.js';

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
  return {
    id: inst.id, slug: inst.slug, vertical: inst.vertical, mark: inst.mark, name: inst.name,
    place: `${inst.city}, ${inst.state}`, type: inst.type,
    course: c?.name ?? '—',
    fee: c?.totalFee ?? 0,
    emi: inst.vertical === 'colleges'
      ? (c?.seats != null ? `${c.seats} seats` : '—')
      : (c?.emiMonthly != null ? `${money(c.emiMonthly)}/mo` : 'No EMI'),
    rating: inst.rating, reviews: inst.reviews,
    approval: inst.approvals.map(approvalLabel).slice(0, 3),
    duration: c ? yearsFromMonths(c.durationMonths) : '—',
    mode: inst.vertical === 'colleges' && topCutoff ? `NEET • cutoff ${topCutoff.closingRank}` : (c?.mode ?? '—'),
    deadline: c?.deadline ?? '—',
    featured: inst.featuredPriority >= 80, priority: inst.featuredPriority
  };
}

/** Projects a Job into the same flat card shape, so one card component serves all verticals. */
export function jobCard(job) {
  const co = companies.find(c => c.id === job.companyId);
  const perMonth = n => `${Math.round(n / 12000)}K`;
  const posted = job.postedOn === '2026-08-30' ? 'Posted today' : 'Verified company';
  return {
    id: job.id, slug: job.slug, vertical: 'jobs', mark: co?.mark ?? 'JB', name: job.title,
    place: `${co?.name ?? 'Company'} • ${job.wfh ? 'Remote' : job.location.split(',')[0]}`,
    type: job.jobType,
    course: `${job.qualification} • ${job.experienceMin === 0 ? 'Fresher' : job.experienceMin + '+ yrs'}`,
    fee: job.salaryMin,
    emi: `${job.openings} openings`,
    rating: 4.5, reviews: job.openings * 8,
    approval: [co?.isVerified ? 'Verified company' : 'Unverified', job.wfh ? 'WFH' : posted].filter(Boolean),
    duration: `₹${perMonth(job.salaryMin)}–${perMonth(job.salaryMax)}/mo`,
    mode: job.industry,
    deadline: `Apply by ${new Date(job.expiresOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    featured: job.featured, priority: job.featured ? 90 : 50
  };
}

const SORTS = {
  relevance: (a, b) => b.featured - a.featured || b.priority - a.priority || b.rating - a.rating,
  'fee-asc': (a, b) => a.fee - b.fee,
  'fee-desc': (a, b) => b.fee - a.fee,
  rating: (a, b) => b.rating - a.rating,
  fastest: (a, b) => parseFloat(a.duration) - parseFloat(b.duration)
};

/**
 * @param {'distance'|'colleges'|'jobs'} vertical
 * @param {{q?:string,type?:string,mode?:string,feeMin?:number,feeMax?:number,approval?:string,
 *          wfh?:boolean,qualification?:string,sort?:string,page?:number,pageSize?:number}} opts
 */
export function listEntities(vertical, opts = {}) {
  const { q, type, mode, feeMin, feeMax, approval, wfh, qualification,
    sort = 'relevance', page = 1, pageSize = 20 } = opts;

  let rows = vertical === 'jobs'
    ? jobs.filter(j => j.isActive).map(jobCard)
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
  if (wfh != null && vertical === 'jobs') {
    const ids = new Set(jobs.filter(j => j.wfh === wfh).map(j => j.id));
    rows = rows.filter(r => ids.has(r.id));
  }
  if (qualification && vertical === 'jobs') {
    rows = rows.filter(r => r.course.toLowerCase().startsWith(qualification.toLowerCase()));
  }

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
  const job = jobs.find(j => j.id === idOrSlug || j.slug === idOrSlug);
  if (!job) return null;
  return { ...job, company: companies.find(c => c.id === job.companyId) ?? null, card: jobCard(job) };
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
export function predictColleges({ rank, category = 'Gen', budget }) {
  const out = { strong: [], possible: [], backup: [] };
  for (const inst of institutions.filter(i => i.vertical === 'colleges' && i.isActive)) {
    const cut = inst.cutoffs.find(c => c.category === category) ?? inst.cutoffs.find(c => c.category === 'Gen');
    if (!cut) continue;
    const card = institutionCard(inst);
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

export { boards, countries, skillCourses, companies };
