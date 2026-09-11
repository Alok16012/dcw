/**
 * Reviews, written down once and read from everywhere.
 *
 * Before this module the nine reviews on /reviews lived inside the component
 * that rendered them, as prose. They named an institution in a `subject` string
 * ("B.Com (Distance) · Amity Online") and nothing could act on that: the Amity
 * detail page could not show them, the listing card could not count them, and
 * the star rating on a card came from a hardcoded number on the institution
 * record that no review had ever contributed to.
 *
 * A review here carries the keys that make it reusable:
 *
 *   vertical      distance | colleges | jobs
 *   institutionId the catalogue row it is about, or null for a general review
 *   courseName    the specific programme, when the reviewer named one
 *   jobId / companyId  the Berojgar Bharat equivalents
 *
 * so the same record renders on /reviews, on the institution's detail page, as
 * a count on its listing card, and against a course row — with no second copy.
 *
 * DCW reviews are kept apart from Google ratings (lib/integrations/maps.js)
 * everywhere both are shown. They measure different things and Google's terms
 * do not permit blending their rating into someone else's average.
 *
 * PERSISTENCE: process memory, like every other repository here.
 */
import { randomUUID } from 'node:crypto';

/** Demo seed. Same nine reviews the page always showed, now keyed to the catalogue. */
const SEED = [
  { name: 'Priya Sharma', city: 'Patna', rating: 5, vertical: 'distance',
    institutionId: 'amity-online', courseName: 'B.Com', subject: 'B.Com (Distance) · Amity University Online',
    text: 'I had already paid a registration fee to an agent before I found this site. The fee table here matched what the university accounts office told me on the phone, and the agent’s number did not. That comparison alone saved me ₹18,000.',
    helpful: 34, verified: true, createdAt: '2026-08-14T00:00:00.000Z' },
  { name: 'Rahul Verma', city: 'Ranchi', rating: 4, vertical: 'jobs',
    companyId: 'bajaj-finserv', subject: 'Field Sales Executive · Bajaj Finserv',
    text: 'The salary band on the listing was the actual band in the interview, which I did not expect. One mark off because the interview location was in a different part of the city than the posting said.',
    helpful: 21, verified: true, createdAt: '2026-08-02T00:00:00.000Z' },
  { name: 'Anjali Kumari', city: 'Gaya', rating: 5, vertical: 'distance',
    boardId: 'nios', subject: 'Class 12 · NIOS',
    text: 'I dropped out in 2021 and thought I had lost the year permanently. The board comparison explained the on-demand exam option in plain Hindi and English. I sat for two subjects in October and finished.',
    helpful: 47, verified: true, createdAt: '2026-07-21T00:00:00.000Z' },
  { name: 'Mohd Imran', city: 'Lucknow', rating: 4, vertical: 'colleges',
    institutionId: 'gmc-patna', subject: 'B.Sc Nursing counselling',
    text: 'Counsellor called within the day and did not push a single college. She told me one of the options I was excited about had a pending approval, which I could not find anywhere else.',
    helpful: 19, verified: true, createdAt: '2026-07-08T00:00:00.000Z' },
  { name: 'Sneha Patel', city: 'Pune', rating: 3, vertical: 'jobs',
    subject: 'Digital Marketing Intern',
    text: 'Good listings and the resume builder is genuinely useful. But two of the internships I applied for had already closed, so the posted dates need to be tighter.',
    helpful: 28, verified: false, createdAt: '2026-06-27T00:00:00.000Z' },
  { name: 'Vikas Singh', city: 'Delhi NCR', rating: 5, vertical: 'distance',
    institutionId: 'manipal-online', courseName: 'MBA', subject: 'MBA (Online) · fee comparison',
    text: 'Four universities, one table, total cost including exam fees. I had been building that spreadsheet myself for three weeks.',
    helpful: 52, verified: true, createdAt: '2026-06-11T00:00:00.000Z' },
  { name: 'Fatima Khan', city: 'Kolkata', rating: 5, vertical: 'jobs',
    subject: 'Relationship Officer',
    text: 'The “jobs near me” list put three openings within 8 km of my house on the screen. Every other site kept showing me Bengaluru.',
    helpful: 31, verified: true, createdAt: '2026-05-19T00:00:00.000Z' },
  { name: 'Arjun Nair', city: 'Bengaluru', rating: 4, vertical: 'colleges',
    institutionId: 'aiims-patna', subject: 'NEET rank predictor',
    text: 'The predictor was honest about being a range and not a promise, which I appreciated. My actual allotment landed inside the range it gave me.',
    helpful: 26, verified: true, createdAt: '2026-05-04T00:00:00.000Z' },
  { name: 'Deepak Yadav', city: 'Patna', rating: 2, vertical: 'distance',
    institutionId: 'ignou', subject: 'Admission support',
    text: 'Information on the site is solid but I waited two days for a callback during the admission rush. Got it eventually and the help was good, just late.',
    helpful: 14, verified: true, createdAt: '2026-04-22T00:00:00.000Z' }
];

const normalise = r => ({
  id: r.id ?? `rv-${randomUUID().slice(0, 8)}`,
  name: r.name, city: r.city ?? null, rating: Number(r.rating),
  vertical: r.vertical,
  institutionId: r.institutionId ?? null,
  courseName: r.courseName ?? null,
  jobId: r.jobId ?? null,
  companyId: r.companyId ?? null,
  boardId: r.boardId ?? null,
  subject: r.subject, text: r.text,
  helpful: Number(r.helpful ?? 0),
  verified: r.verified === true,
  status: r.status ?? 'published',
  createdAt: r.createdAt ?? new Date().toISOString()
});

let reviews = SEED.map(normalise);

/**
 * Every review the filter matches, newest first.
 *
 * Filters compose, which is what makes one store serve three surfaces: no
 * filter is the /reviews page, `{institutionId}` is the detail page, and
 * `{institutionId, courseName}` is one row of the fee table.
 *
 * @param {{vertical?:string, institutionId?:string, courseName?:string,
 *          jobId?:string, companyId?:string, boardId?:string,
 *          includeUnpublished?:boolean}} [filter]
 */
export function listReviews(filter = {}) {
  let rows = reviews;
  if (!filter.includeUnpublished) rows = rows.filter(r => r.status === 'published');
  if (filter.vertical) rows = rows.filter(r => r.vertical === filter.vertical);
  if (filter.institutionId) rows = rows.filter(r => r.institutionId === filter.institutionId);
  if (filter.courseName) {
    const k = filter.courseName.toLowerCase();
    // A course-level filter still shows the institution's general reviews: a
    // page about one programme with three empty slots is worse than a page that
    // says "two about this course, six about the university".
    rows = rows.filter(r => !r.courseName || r.courseName.toLowerCase() === k);
  }
  if (filter.jobId) rows = rows.filter(r => r.jobId === filter.jobId);
  if (filter.companyId) rows = rows.filter(r => r.companyId === filter.companyId);
  if (filter.boardId) rows = rows.filter(r => r.boardId === filter.boardId);
  return rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Average, count and the 5→1 distribution, from the same rows the page renders. */
export function summariseReviews(filter = {}) {
  const rows = listReviews(filter);
  const count = rows.length;
  const average = count ? Number((rows.reduce((n, r) => n + r.rating, 0) / count).toFixed(1)) : null;
  return {
    count, average,
    verified: rows.filter(r => r.verified).length,
    distribution: [5, 4, 3, 2, 1].map(n => ({ stars: n, count: rows.filter(r => r.rating === n).length })),
    latest: rows[0] ?? null
  };
}

/** Counts for every institution in one pass, so a listing page is not N queries. */
export function summaryByInstitution() {
  const map = new Map();
  for (const r of reviews) {
    if (r.status !== 'published' || !r.institutionId) continue;
    const cur = map.get(r.institutionId) ?? { count: 0, total: 0 };
    cur.count += 1; cur.total += r.rating;
    map.set(r.institutionId, cur);
  }
  return new Map([...map].map(([k, v]) => [k, { count: v.count, average: Number((v.total / v.count).toFixed(1)) }]));
}

export function addReview(input) {
  const e = {};
  if (!String(input.name ?? '').trim()) e.name = 'Add your name.';
  if (!String(input.text ?? '').trim() || String(input.text).trim().length < 20) {
    e.text = 'Write at least a couple of sentences — it is more use to the next person.';
  }
  const rating = Number(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) e.rating = 'Give a rating from 1 to 5.';
  if (!['distance', 'colleges', 'jobs'].includes(input.vertical)) e.vertical = 'Pick which side of DCW this is about.';
  if (Object.keys(e).length) return { ok: false, errors: e };

  const review = normalise({
    ...input, rating, helpful: 0,
    subject: String(input.subject ?? '').trim() || 'General feedback',
    // A review is verified when it can be matched to an application or a
    // counselling session in our records — never on the reviewer's say-so.
    verified: false,
    // Moderated before it appears, because a public review page is a place
    // people can be defamed.
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  reviews.unshift(review);
  return { ok: true, review };
}

export function setReviewStatus(id, status) {
  if (!['published', 'pending', 'rejected'].includes(status)) return { ok: false, error: 'BAD_STATUS' };
  const r = reviews.find(x => x.id === id);
  if (!r) return { ok: false, error: 'NOT_FOUND' };
  r.status = status;
  return { ok: true, review: r };
}

export function markHelpful(id) {
  const r = reviews.find(x => x.id === id && x.status === 'published');
  if (!r) return { ok: false, error: 'NOT_FOUND' };
  r.helpful += 1;
  return { ok: true, review: r };
}

export const __resetReviews = () => { reviews = SEED.map(normalise); };
