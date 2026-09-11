/**
 * Board administration (client requirement 4).
 *
 * Open-school boards used to be a constant in three files. They are now one
 * editable record, and this is where /admin/boards edits it — so correcting
 * NIOS's fee is a form submission rather than a deployment.
 */
import { listBoards, createBoard, BOARD_FACTS } from '@/lib/boards-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requirePermission(request, 'boards:read');
  if (error) return error;
  return ok({ rows: listBoards({ includeInactive: true }), fields: BOARD_FACTS });
}

export async function POST(request) {
  const { error, session } = requirePermission(request, 'boards:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = createBoard(body, { actor: session.name });
  if (!result.ok) return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
  return ok({ board: result.board }, { status: 201 });
}
