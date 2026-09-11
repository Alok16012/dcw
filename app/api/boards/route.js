/** The public board list, read from the record /admin/boards edits. */
import { listBoards, boardComparison, BOARD_FACTS } from '@/lib/boards-repo.js';
import { ok } from '@/lib/http.js';

export async function GET() {
  return ok({ rows: listBoards(), fields: BOARD_FACTS, comparison: boardComparison() });
}
