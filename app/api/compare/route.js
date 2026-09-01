import { compare } from '@/lib/store.js';
import { ok, fail, readJson, VERTICAL_SET } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!VERTICAL_SET.has(body.vertical)) return fail(422, 'INVALID_VERTICAL', 'vertical must be distance, colleges or jobs.');
  if (!Array.isArray(body.ids) || body.ids.length === 0) return fail(422, 'IDS_REQUIRED', 'Provide 1–3 ids to compare.');
  if (body.ids.length > 3) return fail(422, 'TOO_MANY', 'Compare supports at most 3 items.');
  return ok(compare(body.vertical, body.ids));
}
