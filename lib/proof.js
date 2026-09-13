/**
 * Proof of Work, shared by the two repositories that hold it (requirement 8).
 *
 * An institution proves itself with a result sheet or an admission letter; an
 * employer proves itself with an offer letter or a photograph from a hiring
 * drive. The evidence is the same shape either way — what it is, what it is
 * called, which year, and the file itself — so the validation and the row
 * builder live here instead of being written twice and drifting apart.
 *
 * institutions-repo.js re-exports PROOF_KINDS, so existing importers and the
 * console's type picker keep reading one list.
 */

import { getOptions, isOption } from './option-lists.js';

/**
 * What a Proof of Work entry can be, as at module load.
 *
 * The list is editable from Console → Settings now, so this export is the
 * DEFAULT rather than the truth: it is the right thing for a fallback and the
 * wrong thing for a picker. Anything rendering a dropdown should read
 * `INSTITUTION_ENUMS.proofKinds` or GET /api/admin/options, both of which are
 * live. Kept because several modules already import it and a fallback that
 * cannot go stale mid-request is worth having.
 */
export const PROOF_KINDS = getOptions('proof.kind');

/** Field-level validation. Returns {} when the input is usable. */
export function validateProof(input) {
  const errors = {};
  if (!String(input.title ?? '').trim()) errors.title = 'Give it a title a student would understand.';
  if (!input.documentId && !input.url) errors.file = 'Attach an image or document, or link to one.';
  if (input.kind && !isOption('proof.kind', input.kind)) {
    errors.kind = `Type must be one of: ${getOptions('proof.kind').join(', ')}.`;
  }
  return errors;
}

/**
 * One evidence row. `ownerId` and `seq` only shape the id — the caller owns the
 * list this is pushed onto, so it stays the one deciding where evidence lives.
 */
export function buildProofEntry(ownerId, seq, input, actor = 'admin') {
  return {
    id: `pow-${ownerId}-${seq}-${Date.now().toString(36)}`,
    kind: input.kind ?? 'Other',
    title: String(input.title).trim(),
    summary: String(input.summary ?? '').trim() || null,
    year: input.year ? Number(input.year) : null,
    courseName: input.courseName ? String(input.courseName).trim() : null,
    documentId: input.documentId ?? null,
    documentName: input.documentName ?? null,
    mimeType: input.mimeType ?? null,
    url: input.url ?? (input.documentId ? `/api/documents/${input.documentId}` : null),
    addedBy: actor, addedAt: new Date().toISOString()
  };
}
