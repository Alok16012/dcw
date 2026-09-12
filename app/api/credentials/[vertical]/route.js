import { credentials } from '@/lib/store.js';
import { ok, fail, VERTICAL_SET } from '@/lib/http.js';

/**
 * What a vertical has on file: the recognitions its listings rest on, and the
 * evidence behind them. Read-only and public, like the listing it summarises.
 *
 * Mounted at /api/credentials/[vertical] rather than under /api/[vertical]/
 * with the other per-vertical reads, because /api/jobs/[id] already owns that
 * shape — a static `jobs` segment beats the dynamic `[vertical]` one, so
 * /api/jobs/credentials would resolve to a job called "credentials" and 404.
 *
 * Everything returned is counted out of the catalogue at request time, so the
 * two sections on the vertical home stay in step with the admin console
 * without anybody republishing anything.
 */
export async function GET(_request, { params }) {
  const { vertical } = await params;
  if (!VERTICAL_SET.has(vertical)) return fail(404, 'UNKNOWN_VERTICAL', `No vertical "${vertical}".`);
  return ok(credentials(vertical));
}
