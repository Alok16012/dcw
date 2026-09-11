/**
 * Document store — the evidence behind a listing.
 *
 * Three of the client's requirements need the same thing: somewhere to put a
 * file and get back a URL the public page can show.
 *
 *   Proof of work        result sheets, placement letters, admission letters,
 *                        event photographs
 *   Recognition/approval UGC-DEB entitlement letters, AICTE approvals,
 *                        affiliation certificates
 *   Prospectus           the PDF a university already publishes
 *
 * They differ only in what the record is attached to, so they share one store
 * and one upload endpoint (/api/admin/uploads) rather than three.
 *
 * This is deliberately the same design as lib/resume-store.js — base64 bytes in
 * a Map — and carries the same caveat: PERSISTENCE is process memory, and a real
 * deploy writes to S3 or Supabase Storage and keeps only the key. `saveDocument`
 * and `getDocument` are the seam for that swap; nothing above them touches bytes.
 *
 * These files differ from resumes in one important way: they are *meant* to be
 * public. A UGC letter proves nothing if nobody can open it. So the id is still
 * unguessable, but /api/documents/[id] serves them without a session — with the
 * deliberate exception of documents marked `internal`, which are the ones an
 * admin uploaded for the record rather than for the page.
 */
import { randomUUID } from 'node:crypto';

const documents = new Map();

export const MAX_BYTES = 5 * 1024 * 1024;   // 5 MB — certificates are scans
export const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
export const ALLOWED_LABEL = 'PDF, JPG, PNG or WebP up to 5 MB';

/** What the document is evidence of. Drives the icon and the grouping on the page. */
export const DOC_PURPOSES = ['proof', 'approval', 'prospectus', 'brochure', 'other'];

const clean = (s, n = 160) => String(s ?? '').trim().slice(0, n);

/**
 * @param {{fileName?:string, mimeType:string, dataBase64:string, purpose?:string,
 *          title?:string, institutionId?:string|null, courseName?:string|null,
 *          boardId?:string|null, vertical?:string|null, internal?:boolean,
 *          uploadedBy?:string}} input
 * @returns {{ok:true,document:Object}|{ok:false,error:string,message:string}}
 */
export function saveDocument(input) {
  const mimeType = clean(input.mimeType, 80);
  if (!ALLOWED_TYPES[mimeType]) {
    return { ok: false, error: 'BAD_TYPE', message: `That file type is not accepted. Upload a ${ALLOWED_LABEL}.` };
  }
  const b64 = String(input.dataBase64 ?? '').replace(/^data:[^,]*,/, '');
  if (!b64) return { ok: false, error: 'EMPTY_FILE', message: 'That file appears to be empty.' };

  // 4 base64 characters encode 3 bytes, so an oversized upload is refused
  // before it is decoded.
  const sizeBytes = Math.floor((b64.length * 3) / 4);
  if (sizeBytes > MAX_BYTES) {
    return { ok: false, error: 'TOO_LARGE', message: `That file is ${(sizeBytes / 1048576).toFixed(1)} MB. The limit is 5 MB.` };
  }

  const id = randomUUID();
  const purpose = DOC_PURPOSES.includes(input.purpose) ? input.purpose : 'other';
  const doc = {
    id, url: `/api/documents/${id}`,
    fileName: clean(input.fileName, 120) || `document.${ALLOWED_TYPES[mimeType]}`,
    title: clean(input.title) || clean(input.fileName, 120) || 'Document',
    mimeType, sizeBytes, bytes: b64,
    kind: mimeType === 'application/pdf' ? 'pdf' : 'image',
    purpose,
    institutionId: input.institutionId ?? null,
    courseName: input.courseName ?? null,
    boardId: input.boardId ?? null,
    vertical: input.vertical ?? null,
    internal: input.internal === true,
    uploadedBy: clean(input.uploadedBy, 60) || 'admin',
    createdAt: new Date().toISOString()
  };
  documents.set(id, doc);
  return { ok: true, document: doc };
}

export const getDocument = id => documents.get(id) ?? null;

/** Everything filed against one institution, board or course. */
export function listDocuments(filter = {}) {
  let rows = [...documents.values()];
  if (!filter.includeInternal) rows = rows.filter(d => !d.internal);
  if (filter.institutionId) rows = rows.filter(d => d.institutionId === filter.institutionId);
  if (filter.boardId) rows = rows.filter(d => d.boardId === filter.boardId);
  if (filter.purpose) rows = rows.filter(d => d.purpose === filter.purpose);
  if (filter.courseName) {
    const k = filter.courseName.toLowerCase();
    rows = rows.filter(d => d.courseName?.toLowerCase() === k);
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteDocument(id) {
  const doc = documents.get(id);
  if (!doc) return { ok: false, error: 'NOT_FOUND' };
  documents.delete(id);
  return { ok: true, document: publicDocument(doc) };
}

/** Everything about a document except its bytes. */
export const publicDocument = d => d && ({
  id: d.id, url: d.url, title: d.title, fileName: d.fileName, mimeType: d.mimeType,
  kind: d.kind, sizeBytes: d.sizeBytes, purpose: d.purpose,
  institutionId: d.institutionId, courseName: d.courseName, boardId: d.boardId,
  uploadedBy: d.uploadedBy, createdAt: d.createdAt
});

export const __resetDocuments = () => documents.clear();
