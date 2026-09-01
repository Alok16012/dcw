import { checkAbroadEligibility } from '@/lib/store.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const marks = Number(body.marks);
  if (!Number.isFinite(marks) || marks < 0 || marks > 100) return fail(422, 'INVALID_MARKS', 'Marks must be between 0 and 100.');
  return ok(checkAbroadEligibility({ marks, neetQualified: !!body.neetQualified, budget: body.budget ?? null }));
}
