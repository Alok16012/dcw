/**
 * Proof of Work for one employer — the Berojgar Bharat half of requirement 8.
 *
 * The institution equivalent is /api/admin/institutions/[id]/proof. Same shape,
 * same capability, different owner: offer letters, hiring-drive photographs and
 * registration certificates belong to the company, not to a single vacancy.
 *
 * `proof:write` is admin and staff only. An employer can manage its own
 * postings, but the evidence that an employer is real is not something that
 * employer gets to file about itself.
 */
import { addCompanyProof, deleteCompanyProof, findCompany, PROOF_KINDS } from '@/lib/jobs-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'proof:read');
  if (error) return error;
  ensureSeeded();
  const company = findCompany(id);
  if (!company) return fail(404, 'NOT_FOUND', `No employer "${id}".`);
  return ok({ rows: company.proofOfWork, kinds: PROOF_KINDS });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { error, session } = requirePermission(request, 'proof:write');
  if (error) return error;
  ensureSeeded();
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = addCompanyProof(id, body, { actor: session.name });
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', `No employer "${id}".`);
  }
  return ok({ proof: result.proof, rows: result.company.proofOfWork }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'proof:write');
  if (error) return error;
  const proofId = request.nextUrl.searchParams.get('proofId');
  if (!proofId) return fail(400, 'PROOF_ID_REQUIRED', 'Say which proof entry to remove.');

  const result = deleteCompanyProof(id, proofId);
  if (!result.ok) return fail(404, 'NOT_FOUND', 'That proof entry is already gone.');
  return ok({ proof: result.proof, rows: result.company.proofOfWork });
}
