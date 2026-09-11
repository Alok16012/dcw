import { findBoard, updateBoard, deleteBoard } from '@/lib/boards-repo.js';
import { listDocuments } from '@/lib/document-store.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'boards:read');
  if (error) return error;
  const board = findBoard(id);
  if (!board) return fail(404, 'NOT_FOUND', `No board "${id}".`);
  return ok({ board, documents: listDocuments({ boardId: id, includeInternal: true }) });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, session } = requirePermission(request, 'boards:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = updateBoard(id, body, { actor: session.name });
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', `No board "${id}".`);
  }
  return ok({ board: result.board });
}

/** Soft by default: a student who applied through this board still has to
 *  resolve it on their application. ?hard=true only for one added by mistake. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'boards:write');
  if (error) return error;
  const hard = request.nextUrl.searchParams.get('hard') === 'true';
  const result = deleteBoard(id, { hard });
  if (!result.ok) return fail(404, 'NOT_FOUND', `No board "${id}".`);
  return ok({ board: result.board, hard: result.hard });
}
