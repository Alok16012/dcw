/**
 * One upload endpoint for every kind of supporting file.
 *
 * Proof of work, approval certificates and prospectuses are all "a file plus
 * what it is evidence of", so they share this route rather than growing three
 * near-identical ones. The response carries the document's URL, which the caller
 * then stores against the institution, the approval or the course.
 *
 * Files arrive as base64 in JSON rather than as multipart, because that is what
 * lib/document-store.js holds and what a Supabase Storage swap would replace.
 */
import { saveDocument, publicDocument, listDocuments, deleteDocument, ALLOWED_LABEL, DOC_PURPOSES, MAX_BYTES } from '@/lib/document-store.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requirePermission(request, 'catalogue:read');
  if (error) return error;
  const sp = request.nextUrl.searchParams;
  return ok({
    rows: listDocuments({
      institutionId: sp.get('institutionId') ?? undefined,
      boardId: sp.get('boardId') ?? undefined,
      purpose: sp.get('purpose') ?? undefined,
      includeInternal: true
    }).map(publicDocument),
    limits: { maxBytes: MAX_BYTES, label: ALLOWED_LABEL, purposes: DOC_PURPOSES }
  });
}

export async function POST(request) {
  const { error, session } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = saveDocument({ ...body, uploadedBy: session.name });
  if (!result.ok) return fail(422, result.error, result.message);
  return ok({ document: publicDocument(result.document) }, { status: 201 });
}

export async function DELETE(request) {
  const { error } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return fail(400, 'ID_REQUIRED', 'Say which document to remove.');
  const result = deleteDocument(id);
  if (!result.ok) return fail(404, 'NOT_FOUND', 'That document is already gone.');
  return ok({ document: result.document });
}
