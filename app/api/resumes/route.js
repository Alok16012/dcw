/**
 * Resume intake.
 *
 * The job apply form had no way to attach a resume at all, which meant a
 * recruiter opening an application saw a name, a number and nothing to read.
 * Two ways in: a file the candidate already has, or the resume they built on
 * this site, stored as fields rather than a flattened PDF so it stays editable.
 *
 * The number has to be OTP-verified before a file is accepted. Without that
 * check this is an open, unauthenticated file store on the public internet.
 */
import { saveResume, listResumesFor, publicResume, ALLOWED_LABEL, MAX_BYTES } from '@/lib/resume-store.js';
import { isValidPhone, isPhoneVerified } from '@/lib/integrations/otp.js';
import { applicantFromRequest } from '@/lib/applicant.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!isValidPhone(body.phone)) return fail(422, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');
  if (!isPhoneVerified(body.phone)) return fail(422, 'OTP_REQUIRED', 'Verify the mobile number before attaching a resume.');
  if (!body.builder && !body.dataBase64) {
    return fail(422, 'NOTHING_TO_SAVE', `Attach a file (${ALLOWED_LABEL}) or use the resume you built here.`);
  }

  const result = saveResume(body);
  if (!result.ok) return fail(422, result.error, result.message, { limitBytes: MAX_BYTES, accepts: ALLOWED_LABEL });
  return ok({ resume: publicResume(result.resume) }, { status: 201 });
}

/** The candidate's own resumes, so the apply form can offer "use the one on
 *  file" instead of asking for the same upload twice. */
export async function GET(request) {
  const applicant = applicantFromRequest(request);
  if (!applicant) return fail(401, 'NO_APPLICANT', 'Verify your mobile number to see your saved resumes.');
  return ok({ resumes: listResumesFor(applicant.phone).map(publicResume) });
}
