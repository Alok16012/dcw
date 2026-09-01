import { predictColleges } from '@/lib/store.js';
import { isPhoneVerified } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const rank = Number(body.rank);
  if (!Number.isFinite(rank) || rank <= 0) return fail(422, 'INVALID_RANK', 'Provide a positive NEET rank.');

  const buckets = predictColleges({ rank, category: body.category ?? 'Gen', budget: body.budget ?? null });
  const total = buckets.strong.length + buckets.possible.length + buckets.backup.length;

  // PRD §6.4: show the first 3 free, gate the rest behind a verified phone
  // number — established against the OTP store, since the request can claim
  // anything.
  if (!isPhoneVerified(body.phone)) {
    const preview = [...buckets.strong, ...buckets.possible, ...buckets.backup].slice(0, 3);
    return ok({ gated: true, shown: preview.length, total,
      results: { strong: preview.filter(r => buckets.strong.includes(r)), possible: [], backup: [] },
      preview, message: 'Verify your number to see all matches.' });
  }
  return ok({ gated: false, shown: total, total, results: buckets });
}
