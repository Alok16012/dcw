/**
 * "Where is my application?" — the client side of the pipeline.
 *
 * /applications could previously show only what the person's own browser had
 * written to localStorage, plus two hardcoded sample cards. Clear the browser
 * and your applications vanished; open the site on a phone and they were never
 * there at all. This reads the real records instead: job applications from the
 * ATS, admissions from the counselling pipeline, and the fee position for each.
 *
 * The phone comes from the signed cookie, never from the request. Accepting a
 * number from the caller would make this a ten-digit enumeration of every
 * applicant DCW has.
 */
import { listApplications, STAGES as JOB_STAGES, CLOSED as JOB_CLOSED } from '@/lib/integrations/ats.js';
import { listAdmissions, STAGES as ADM_STAGES, CLOSED as ADM_CLOSED, STAGE_COPY } from '@/lib/integrations/admissions.js';
import { planForApplication, outstandingOf, paidOf, nextDue, duesFor } from '@/lib/fees.js';
import { requireApplicant } from '@/lib/applicant.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

/** What the client-side timeline draws: the stages, and where this file sits.
 *  A closed application keeps the stage it reached so the timeline still reads
 *  as a history rather than collapsing to a single red dot. */
const timeline = (stages, closed, status, reached) => ({
  steps: stages.map((s, i) => ({
    label: s,
    state: closed.includes(status)
      ? (i <= reached ? 'done' : 'skipped')
      : i < stages.indexOf(status) ? 'done' : i === stages.indexOf(status) ? 'current' : 'upcoming'
  })),
  closed: closed.includes(status) ? status : null
});

export async function GET(request) {
  const { applicant, error } = requireApplicant(request);
  if (error) return error;
  ensureSeeded();

  const phone = applicant.phone;

  const jobs = listApplications().filter(a => a.phone === phone).map(a => ({
    kind: 'job', id: a.id, title: a.jobTitle, where: a.companyId, status: a.status,
    appliedAt: a.appliedAt, updatedAt: a.touchedAt, resumeUrl: a.resumeUrl,
    // Applied is index 0, so a rejection straight from Applied still shows the
    // one step that did happen.
    ...timeline(JOB_STAGES, JOB_CLOSED, a.status, Math.max(0, JOB_STAGES.indexOf(a.status)))
  }));

  const courses = listAdmissions().filter(a => a.phone === phone).map(a => {
    const plan = planForApplication(a.id);
    return {
      kind: 'course', id: a.id, title: a.course ?? a.institutionName, where: a.institutionName,
      status: a.status, note: STAGE_COPY[a.status] ?? null,
      appliedAt: a.appliedAt, updatedAt: a.touchedAt, counsellor: a.counsellor ?? null,
      fee: plan ? { planId: plan.id, totalFee: plan.totalFee, paid: paidOf(plan),
        outstanding: outstandingOf(plan), next: nextDue(plan) } : null,
      ...timeline(ADM_STAGES, ADM_CLOSED, a.status, Math.max(0, ADM_STAGES.indexOf(a.status)))
    };
  });

  const rows = [...jobs, ...courses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return ok({
    applicant: { name: applicant.name, phone },
    applications: rows,
    counts: { total: rows.length, jobs: jobs.length, courses: courses.length },
    dues: duesFor(phone)
  });
}
