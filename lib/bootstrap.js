/**
 * Seeds the demo pipelines once per process so no console is ever empty.
 *
 * Three things are seeded together because they are one story: a person applies
 * (ATS or admissions), and an admission carries a fee schedule. Seeding the
 * applications without the schedules would leave /admin/fees showing a working
 * module with nothing in it, which reads as a bug rather than as an empty book.
 */
import { listJobs } from './jobs-repo.js';
import { listInstitutions } from './institutions-repo.js';
import { seedApplications } from './integrations/ats.js';
import { seedAdmissions, listAdmissions } from './integrations/admissions.js';
import { createPlan, recordPayment, listPlans } from './fees.js';

let done = false;

/**
 * Back-dates each seeded plan so the collection book has a past, a present and
 * a future in it, then pays what a file at that stage would plausibly have
 * paid: an enrolled student is paid up, one holding an offer has paid the
 * registration, and one still gathering documents has paid nothing.
 */
function seedFeePlans() {
  if (listPlans().length) return;
  const day = 86400000;
  listAdmissions({ sort: 'oldest' }).forEach((a, i) => {
    if (!a.courseFee) return;
    // Spread across the last four months, oldest first, so monthlyBook() has
    // more than one column with anything in it.
    const startAt = new Date(Date.now() - (100 - i * 14) * day).toISOString();
    const { plan } = createPlan({ applicationId: a.id, phone: a.phone, name: a.name,
      institutionId: a.institutionId, institutionName: a.institutionName,
      course: a.course, totalFee: a.courseFee, startAt });
    const paidUpTo = a.status === 'Enrolled' ? plan.instalments.length
      : a.status === 'Offer' ? 2
      : a.status === 'Submitted' || a.status === 'Verified' ? 1 : 0;
    for (let n = 1; n <= paidUpTo; n++) recordPayment(plan.id, n, { method: 'UPI', actor: 'seed' });
  });
}

export function ensureSeeded() {
  if (done) return;
  done = true;
  seedApplications(listJobs());
  seedAdmissions(listInstitutions());
  seedFeePlans();
}
