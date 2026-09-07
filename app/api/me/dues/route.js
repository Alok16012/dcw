/**
 * What this person owes, for the payment reminder the client asked for.
 *
 * Split out from /api/me/applications because the reminder is polled by a
 * component that renders on every page, and it should not have to pull the
 * whole application list to find out whether there is anything to say.
 */
import { duesFor } from '@/lib/fees.js';
import { requireApplicant } from '@/lib/applicant.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const { applicant, error } = requireApplicant(request);
  if (error) return error;
  ensureSeeded();
  return ok({ ...duesFor(applicant.phone), name: applicant.name });
}
