import { getInstitution } from '@/lib/store.js';
import { ok, fail, VERTICAL_SET } from '@/lib/http.js';

export async function GET(_request, { params }) {
  const { vertical, slug } = await params;
  if (!VERTICAL_SET.has(vertical)) return fail(404, 'UNKNOWN_VERTICAL', `No vertical "${vertical}".`);
  const inst = getInstitution(vertical, slug);
  if (!inst) return fail(404, 'NOT_FOUND', `No institution "${slug}" in ${vertical}.`);
  return ok(inst);
}
