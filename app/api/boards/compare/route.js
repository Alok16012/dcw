import { listBoards, boardComparison } from '@/lib/boards-repo.js';
import { ok } from '@/lib/http.js';

/**
 * The open-school board comparison, read from the editable record rather than
 * the frozen seed, so a fee corrected in /admin/boards shows here immediately.
 *
 * `rows` keeps the shape it always had. It is built by the repository now
 * because the same seven rows are drawn on /distance/boards, and two lists of
 * fields that had to agree were two lists that could disagree.
 */
export async function GET() {
  return ok({ boards: listBoards(), rows: boardComparison() });
}
