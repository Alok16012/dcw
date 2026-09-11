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

/** What a Proof of Work entry can be. Drives the console's type picker. */
export const PROOF_KINDS = ['Result', 'Placement', 'Admission letter', 'Certificate', 'Event', 'Press', 'Other'];

/** Field-level validation. Returns {} when the input is usable. */
export function validateProof(input) {
  const errors = {};
  if (!String(input.title ?? '').trim()) errors.title = 'Give it a title a student would understand.';
  if (!input.documentId && !input.url) errors.file = 'Attach an image or document, or link to one.';
  if (input.kind && !PROOF_KINDS.includes(input.kind)) errors.kind = `Type must be one of: ${PROOF_KINDS.join(', ')}.`;
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
