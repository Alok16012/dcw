import { listEntities } from '@/lib/store.js';
import { ok, fail, num, bool, VERTICAL_SET } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { vertical } = await params;
  if (!VERTICAL_SET.has(vertical)) return fail(404, 'UNKNOWN_VERTICAL', `No vertical "${vertical}".`);
  const p = request.nextUrl.searchParams;
  return ok(listEntities(vertical, {
    q: p.get('q') ?? undefined,
    type: p.get('type') ?? undefined,
    mode: p.get('mode') ?? undefined,
    approval: p.get('approval') ?? undefined,
    qualification: p.get('qualification') ?? undefined,
    city: p.get('city') ?? undefined,
    sector: p.get('sector') ?? undefined,
    wfh: bool(p.get('wfh')),
    feeMin: num(p.get('feeMin')),
    feeMax: num(p.get('feeMax')),
    sort: p.get('sort') ?? 'relevance',
    page: num(p.get('page'), 1),
    pageSize: Math.min(num(p.get('pageSize'), 20), 50)
  }));
}
