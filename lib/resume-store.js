/**
 * Resume store.
 *
 * A job application without a resume is a phone number and a hope. This holds
 * the file a candidate attaches — either one they upload, or a snapshot of the
 * resume they built in /jobs/resume-builder — and hands back a URL that the ATS
 * record carries in `resumeUrl` and the recruiter console links to.
 *
 * PERSISTENCE: process memory, same caveat as the CRM adapters. Bytes are held
 * as a base64 string, which is exactly why MAX_BYTES is small: this is a demo
 * store, not object storage. A real deploy uploads to S3/Supabase Storage and
 * keeps only the key — the exported functions are the seam for that swap.
 *
 * PRIVACY: a resume carries a person's name, number and history. Files are
 * addressed by an unguessable id and never listed publicly; /api/resumes/[id]
 * serves one only to the applicant it belongs to or to a signed-in recruiter.
 */
import { randomUUID } from 'node:crypto';

const resumes = new Map();

export const MAX_BYTES = 2 * 1024 * 1024;   // 2 MB
export const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};
export const ALLOWED_LABEL = 'PDF, DOC or DOCX up to 2 MB';

const digits = p => String(p ?? '').replace(/\D/g, '');

/**
 * @param {{phone:string,name?:string,fileName?:string,mimeType?:string,
 *          dataBase64?:string,builder?:Object,source?:string}} input
 * @returns {{ok:true,resume:Object}|{ok:false,error:string,message:string}}
 */
export function saveResume(input) {
  const phone = digits(input.phone);
  if (!phone) return { ok: false, error: 'PHONE_REQUIRED', message: 'A resume has to belong to a verified number.' };

  const id = randomUUID();
  const base = { id, phone, name: String(input.name ?? '').trim() || null,
    url: `/api/resumes/${id}`, createdAt: new Date().toISOString() };

  // A resume built on this site is structured data, not a file: storing the
  // fields means the recruiter console can render it and the candidate can
  // still edit it, which a flattened PDF would have thrown away.
  if (input.builder) {
    const resume = { ...base, kind: 'builder', fileName: `${(input.name || 'resume').replace(/\s+/g, '-').toLowerCase()}-dcw.json`,
      mimeType: 'application/json', bytes: null, sizeBytes: JSON.stringify(input.builder).length, builder: input.builder };
    resumes.set(id, resume);
    return { ok: true, resume };
  }

  const mimeType = String(input.mimeType ?? '');
  if (!ALLOWED_TYPES[mimeType]) {
    return { ok: false, error: 'BAD_TYPE', message: `That file type is not accepted. Attach a ${ALLOWED_LABEL}.` };
  }
  const b64 = String(input.dataBase64 ?? '').replace(/^data:[^,]*,/, '');
  if (!b64) return { ok: false, error: 'EMPTY_FILE', message: 'That file appears to be empty.' };
  // 4 base64 characters encode 3 bytes; checking before decoding means an
  // oversized upload is refused without allocating it.
  const sizeBytes = Math.floor((b64.length * 3) / 4);
  if (sizeBytes > MAX_BYTES) {
    return { ok: false, error: 'TOO_LARGE', message: `That file is ${(sizeBytes / 1048576).toFixed(1)} MB. The limit is 2 MB.` };
  }
  const resume = { ...base, kind: 'upload',
    fileName: String(input.fileName ?? `resume.${ALLOWED_TYPES[mimeType]}`).slice(0, 120),
    mimeType, sizeBytes, bytes: b64, builder: null };
  resumes.set(id, resume);
  return { ok: true, resume };
}

export const getResume = id => resumes.get(id) ?? null;
export const listResumesFor = phone => [...resumes.values()]
  .filter(r => r.phone === digits(phone))
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** What a list or an API response may show: everything except the bytes. */
export const publicResume = r => r && ({ id: r.id, url: r.url, kind: r.kind, name: r.name,
  fileName: r.fileName, mimeType: r.mimeType, sizeBytes: r.sizeBytes, createdAt: r.createdAt });

export const __resetResumes = () => resumes.clear();
