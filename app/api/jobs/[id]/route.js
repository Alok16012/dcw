import { getJob } from '@/lib/store.js';
import { ok, fail } from '@/lib/http.js';

export async function GET(_request, { params }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return fail(404, 'NOT_FOUND', `No job "${id}".`);
  return ok(job);
}
