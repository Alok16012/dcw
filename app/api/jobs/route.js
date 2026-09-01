import { listEntities } from '@/lib/store.js';
import { ok, num, bool } from '@/lib/http.js';

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  return ok(listEntities('jobs', {
    q: p.get('q') ?? undefined,
    type: p.get('jobType') ?? undefined,
    qualification: p.get('qualification') ?? undefined,
    wfh: bool(p.get('wfh')),
    feeMin: num(p.get('salaryMin')),
    feeMax: num(p.get('salaryMax')),
    sort: p.get('sort') ?? 'relevance',
    page: num(p.get('page'), 1),
    pageSize: Math.min(num(p.get('pageSize'), 20), 50)
  }));
}
