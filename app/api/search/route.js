import { searchAll } from '@/lib/store.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  return ok(searchAll(p.get('q') ?? '', p.get('vertical') ?? undefined));
}
