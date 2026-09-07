import { predictColleges } from '@/lib/store.js';
import { isPhoneVerified } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const rank = Number(body.rank);
  if (!Number.isFinite(rank) || rank <= 0) return fail(422, 'INVALID_RANK', 'Provide a positive NEET rank.');

  const budget = body.budget == null ? null : Number(body.budget);
  if (budget != null && !Number.isFinite(budget)) return fail(422, 'INVALID_BUDGET', 'Budget must be a number of rupees.');
  const buckets = predictColleges({
    rank, category: body.category ?? 'Gen', budget,
    exam: body.exam ?? 'NEET-UG'
  });
  const total = buckets.strong.length + buckets.possible.length + buckets.backup.length;

  // PRD §6.4: show the first 3 free, gate the rest behind a verified phone
  // number — established against the OTP store, since the request can claim
  // anything.
  if (!isPhoneVerified(body.phone)) {
    const preview = [...buckets.strong, ...buckets.possible, ...buckets.backup].slice(0, 3);
    // The preview keeps each college in the bucket it actually landed in.
    // Re-labelling the first three as "strong" would be a prediction the data
    // does not support.
    const results = {
      strong: preview.filter(r => buckets.strong.includes(r)),
      possible: preview.filter(r => buckets.possible.includes(r)),
      backup: preview.filter(r => buckets.backup.includes(r))
    };
    return ok({ gated: true, shown: preview.length, total, results, preview,
      message: 'Verify your number to see all matches.' });
  }
  return ok({ gated: false, shown: total, total, results: buckets });
}
