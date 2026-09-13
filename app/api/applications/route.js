/**
 * The one endpoint an Apply button posts to.
 *
 * Before this route existed, every Apply button on the public site posted to
 * /api/leads, which creates a counselling lead and nothing else. That meant no
 * application record was ever filed: the recruiter console showed only seeded
 * fixtures, the counselling console had nothing at all, and the student's
 * /applications page could show only what their own browser had written to
 * localStorage. An "application" was a word on a button.
 *
 * This route files the real thing. It still creates the lead — the counselling
 * relationship is genuinely separate and the CRM is still the system of record
 * for it — and then, depending on what is being applied to, files either an ATS
 * application (a job) or an admission (a course), cuts the fee schedule for the
 * latter, and issues the applicant an identity cookie so they can watch their
 * own pipeline afterwards without ever typing someone else's number.
 */
import { NextResponse } from 'next/server';
import { getJob, getInstitution } from '@/lib/store.js';
import { findInstitution, findCourse } from '@/lib/institutions-repo.js';
import { upsertLead } from '@/lib/integrations/crm.js';
import { apply as fileJobApplication } from '@/lib/integrations/ats.js';
import { apply as fileAdmission } from '@/lib/integrations/admissions.js';
import { createPlan } from '@/lib/fees.js';
import { getResume } from '@/lib/resume-store.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
import { isValidPhone, isPhoneVerified } from '@/lib/integrations/otp.js';
import { signApplicant, APPLICANT_COOKIE, applicantCookieOptions } from '@/lib/applicant.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { fail, readJson, VERTICAL_SET } from '@/lib/http.js';
import { DATA_PROVENANCE } from '@/lib/data/schema.js';
import { DRIVER } from '@/lib/integrations/index.js';

const envelope = (data, init = {}) =>
  NextResponse.json({ ok: true, data, meta: { provenance: DATA_PROVENANCE, driver: DRIVER } }, { status: 200, ...init });

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const kind = body.kind === 'job' ? 'job' : 'course';
  if (!VERTICAL_SET.has(body.vertical)) return fail(422, 'INVALID_VERTICAL', 'vertical must be distance, colleges or jobs.');
  if (!body.name?.trim()) return fail(422, 'NAME_REQUIRED', 'Name is required.');
  if (!isValidPhone(body.phone)) return fail(422, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');
  // Checked against the OTP store, not against a flag in the request: a caller
  // can set phoneVerified to anything it likes.
  if (!isPhoneVerified(body.phone)) return fail(422, 'OTP_REQUIRED', 'Verify the mobile number before submitting.');
  if (body.consent?.contact !== true) {
    return fail(422, 'CONSENT_REQUIRED', 'Tick the contact permission before submitting.');
  }

  ensureSeeded();

  // The target has to exist. An application filed against an id that is not in
  // the catalogue is worse than a rejected form: it sits in the console looking
  // real and can never be actioned.
  const job = kind === 'job' ? getJob(body.interestId) : null;
  const institution = kind === 'course' ? findInstitution(body.interestId) : null;
  if (kind === 'job' && !job) return fail(404, 'NOT_FOUND', `No job "${body.interestId}".`);
  if (kind === 'course' && !institution && body.interestType !== 'board') {
    return fail(404, 'NOT_FOUND', `No institution "${body.interestId}".`);
  }

  // A resume is optional, but if one is claimed it has to be a resume this
  // server issued to this number — a resumeId is otherwise a way to attach
  // somebody else's file to your own application.
  let resume = null;
  if (body.resumeId) {
    resume = getResume(body.resumeId);
    if (!resume) return fail(404, 'NO_RESUME', 'That resume is no longer on file. Attach it again.');
    if (resume.phone !== String(body.phone).replace(/\D/g, '')) {
      return fail(403, 'RESUME_NOT_YOURS', 'That resume belongs to a different mobile number.');
    }
  }

  /**
   * One application, or several.
   *
   * The form used to send a single `course` string because the dialog offered a
   * single `<select>`. It now offers a multi-select with a "select all", because
   * somebody comparing BA, B.Com and BBA at the same university is applying to a
   * university, not to one of three courses, and making them run the OTP three
   * times to say so was the reason most of them ran it once.
   *
   * `course` is still accepted and still means exactly what it meant, so nothing
   * that posts the old shape — including the admin console and any saved form —
   * changes behaviour. What comes out the other end is one admission per course,
   * because that is what the pipeline already models: one file per (institution,
   * course, phone), each with its own stage and its own fee schedule. Folding
   * three courses into one row would give a counsellor a file they cannot move,
   * since the three will not be verified or offered on the same day.
   *
   * The cap is the number of live courses at the institution: a request asking
   * for more than exist is either a mistake or an attempt to fan out the fee
   * module, and neither deserves the benefit of the doubt.
   */
  const asked = Array.isArray(body.courses) && body.courses.length ? body.courses
    : body.course != null ? [body.course] : [];
  const live = institution ? institution.courses.filter(c => c.isActive !== false) : [];
  if (kind === 'course' && institution && asked.length > Math.max(live.length, 1)) {
    return fail(422, 'TOO_MANY_COURSES',
      `${institution.name} lists ${live.length} course${live.length === 1 ? '' : 's'}. Pick from those.`);
  }

  const picked = [];
  for (const raw of asked) {
    const row = kind === 'course' && institution ? findCourse(institution.id, raw) : null;
    const name = row?.name ?? (typeof raw === 'string' && raw.trim() ? raw.trim() : null);
    if (!name) continue;
    // Case-insensitively unique: the multi-select cannot produce a duplicate,
    // but a hand-built request can, and two identical rows would be one
    // application and one confusing "already applied" toast.
    if (picked.some(p => p.name.toLowerCase() === name.toLowerCase())) continue;
    picked.push({ row, name });
  }
  // A board application, or an enquiry-shaped post with no course at all, still
  // files one admission — that has always been allowed and the pipeline handles
  // a null course.
  if (!picked.length) picked.push({ row: null, name: null });

  const course = picked[0].row;
  const courseName = picked.map(p => p.name).filter(Boolean).join(', ') || null;

  const { lead, duplicate: leadDuplicate, assignedTo } = upsertLead({
    vertical: body.vertical, name: body.name.trim(), phone: body.phone,
    whatsappSame: body.consent.whatsapp === true,
    city: body.city, qualification: body.qualification,
    interestType: body.interestType ?? (kind === 'job' ? 'job' : 'course'),
    interestId: body.interestId ?? null,
    course: courseName,
    associateCode: body.associateCode ?? null, phoneVerified: true,
    consent: { contact: true, whatsapp: body.consent.whatsapp === true,
      text: typeof body.consent.text === 'string' ? body.consent.text : null,
      at: new Date().toISOString() },
    source: {
      url: body.source?.url ?? null, device: body.source?.device ?? null,
      utm_source: body.source?.utm_source ?? null, utm_medium: body.source?.utm_medium ?? null,
      utm_campaign: body.source?.utm_campaign ?? null
    }
  });

  let application, fee = null, duplicate = leadDuplicate;
  /** One entry per course applied to. Empty for a job application. */
  const filedCourses = [];

  if (kind === 'job') {
    const filed = fileJobApplication({
      jobId: job.id, jobTitle: job.title, companyId: job.companyId,
      name: body.name.trim(), phone: body.phone, email: body.email, city: body.city,
      qualification: body.qualification, experienceYears: body.experienceYears,
      resumeUrl: resume?.url ?? null, leadId: lead.id, source: body.source ?? {}
    });
    duplicate = duplicate || filed.duplicate;
    application = { kind: 'job', id: filed.application.id, status: filed.application.status,
      title: job.title, where: job.company?.name ?? null, appliedAt: filed.application.appliedAt,
      resumeUrl: filed.application.resumeUrl };
  } else {
    // One pass per chosen course. Each gets its own admission and its own fee
    // schedule, for the reason set out where `picked` is built.
    for (const { row, name } of picked) {
      const filed = fileAdmission({
        vertical: body.vertical === 'colleges' ? 'colleges' : 'distance',
        institutionId: institution?.id ?? body.interestId ?? null,
        institutionName: institution?.name ?? body.where ?? null,
        course: name, courseFee: row?.totalFee ?? 0,
        // The branch travels with the student from here on. See the note on
        // `branch` in lib/integrations/admissions.js.
        branch: row?.stream ?? null,
        name: body.name.trim(), phone: body.phone, email: body.email, city: body.city,
        qualification: body.qualification, documentUrl: resume?.url ?? null,
        leadId: lead.id, counsellor: assignedTo, source: body.source ?? {}
      });
      duplicate = duplicate || filed.duplicate;
      // The schedule is only meaningful once there is a fee to schedule. A board
      // application, or a course whose fee the catalogue does not carry, gets an
      // application without a plan rather than a plan full of zeroes.
      let planSummary = null;
      if (row?.totalFee && !filed.duplicate) {
        const { plan } = createPlan({ applicationId: filed.application.id, phone: body.phone,
          name: body.name.trim(), institutionId: institution.id, institutionName: institution.name,
          course: row.name, totalFee: row.totalFee });
        planSummary = { planId: plan.id, totalFee: plan.totalFee, instalments: plan.instalments.length,
          first: plan.instalments[0] ?? null };
      }
      filedCourses.push({
        kind: 'course', id: filed.application.id, status: filed.application.status,
        title: name ?? institution?.name ?? 'Application',
        where: institution?.name ?? body.where ?? null, appliedAt: filed.application.appliedAt,
        resumeUrl: filed.application.documentUrl, branch: filed.application.branch,
        duplicate: filed.duplicate, fee: planSummary
      });
      if (!fee) fee = planSummary;
    }
    // `application` stays singular and stays first, so every existing reader —
    // the success screen, the localStorage copy, the WhatsApp template — keeps
    // working unchanged. `applications` beside it is the whole set.
    application = { ...filedCourses[0], title: courseName ?? institution?.name ?? 'Application' };
  }

  // WhatsApp is a separate opt-in. Confirming an application the person made
  // does not license a message on a channel they declined.
  const wa = lead.consent?.whatsapp
    ? sendTemplate({ phone: lead.phone,
        template: kind === 'job' ? 'job_applied' : 'lead_confirmation',
        crm: lead.crm, leadId: lead.id,
        vars: { name: lead.name, job: application.title, interest: application.title } })
    : { queued: null };

  const res = envelope({
    application, applications: filedCourses, fee, duplicate,
    lead: { id: lead.id, crmLeadId: lead.crmLeadId, status: lead.status, assignedTo },
    whatsapp: !!wa.queued
  }, { status: 201 });
  // Issued only here, immediately after an OTP this server checked. It is what
  // /api/me/* trusts instead of a phone number in a query string.
  res.cookies.set(APPLICANT_COOKIE, signApplicant({ phone: body.phone, name: body.name.trim() }), applicantCookieOptions);
  return res;
}
