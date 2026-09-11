'use client';
import { useRef, useState } from 'react';
import { api, ApiError } from '@/lib/admin-client.js';
import { IconUpload, IconClose, IconEye, IconAlert } from './icons.jsx';

/**
 * One upload control, shared by every screen that files a document: approval
 * certificates, prospectuses, proof of work, board circulars.
 *
 * The file is read in the browser and posted as base64 to /api/admin/uploads,
 * which is what lib/document-store.js holds. Multipart would mean a second
 * body-parsing path for no gain while the store is in memory, and swapping the
 * store for Supabase Storage later replaces the route, not this component.
 *
 * `value` is the document record the parent already has, so the control shows
 * what is attached rather than resetting to empty after a save.
 */
export default function FileField({
  label, hint, purpose = 'other', institutionId = null, boardId = null,
  courseName = null, title = null, internal = false, value, onUploaded, onCleared
}) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    // Clearing the input means picking the same file twice in a row still fires.
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error('That file could not be read.'));
        r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
        r.readAsDataURL(file);
      });
      const d = await api('/admin/uploads', {
        method: 'POST',
        body: {
          fileName: file.name, mimeType: file.type, dataBase64,
          purpose, institutionId, boardId, courseName, internal,
          title: title || file.name
        }
      });
      onUploaded?.(d.document);
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : e2.message || 'Upload failed.');
    }
    setBusy(false);
  }

  return (
    <div className="adm-field">
      <span>{label}</span>
      {value ? (
        <div className="adm-file">
          <b>{value.title || value.fileName}</b>
          <small>{value.kind === 'pdf' ? 'PDF' : 'Image'} · {Math.max(1, Math.round((value.sizeBytes ?? 0) / 1024))} KB</small>
          <a className="adm-btn sm" href={value.url} target="_blank" rel="noreferrer"><IconEye />View</a>
          {onCleared && (
            <button type="button" className="adm-btn sm ghost" onClick={() => onCleared()} aria-label={`Remove ${value.fileName}`}>
              <IconClose />
            </button>
          )}
        </div>
      ) : (
        <>
          <button type="button" className="adm-drop" onClick={() => input.current?.click()} disabled={busy}>
            <IconUpload />
            <span>{busy ? 'Uploading…' : 'Choose a file'}</span>
            <small>PDF, JPG, PNG or WebP up to 5 MB</small>
          </button>
          <input ref={input} type="file" hidden onChange={pick}
            accept="application/pdf,image/jpeg,image/png,image/webp" />
        </>
      )}
      {err && <em className="err"><IconAlert style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> {err}</em>}
      {!err && hint && <em className="err" style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{hint}</em>}
    </div>
  );
}
