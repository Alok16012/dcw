/**
 * Proof of Work for one listing (client requirement 8).
 *
 * Result sheets, placement letters, admission letters, event photographs — the
 * evidence that the claims on a listing are real. The file itself goes through
 * /api/admin/uploads and arrives here as a `documentId`; this route records what
 * the file *is*, which is the part a student reads.
 */
import { addProofOfWork, deleteProofOfWork, findInstitution, PROOF_KINDS } from '@/lib/institutions-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'proof:read');
  if (error) return error;
  const inst = findInstitution(id);
  if (!inst) return fail(404, 'NOT_FOUND', `No institution "${id}".`);
  return ok({ rows: inst.proofOfWork, kinds: PROOF_KINDS });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { error, session } = requirePermission(request, 'proof:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = addProofOfWork(id, body, { actor: session.name });
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', `No institution "${id}".`);
  }
  return ok({ proof: result.proof, rows: result.institution.proofOfWork }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'proof:write');
  if (error) return error;
  const proofId = request.nextUrl.searchParams.get('proofId');
  if (!proofId) return fail(400, 'PROOF_ID_REQUIRED', 'Say which proof entry to remove.');

  const result = deleteProofOfWork(id, proofId);
  if (!result.ok) return fail(404, 'NOT_FOUND', 'That proof entry is already gone.');
  return ok({ proof: result.proof });
}
