'use client';
import { useEffect, useState, useCallback } from 'react';
import FileField from '../FileField.jsx';
import { api, fmtWhen } from '@/lib/admin-client.js';
import { IconAlert, IconPlus, IconTrash, IconImage, IconEye } from '../icons.jsx';

/**
 * Proof of Work for one employer (requirement 8, Berojgar Bharat side).
 *
 * The catalogue has the same panel for institutions, inside its detail page.
 * Jobs has no per-employer page — the console is a list of postings — so this
 * is a drawer opened from the company a posting belongs to. Whatever is added
 * here appears in the Proof of Work section of every job that employer posts,
 * because the evidence belongs to the company rather than to one vacancy.
 */
const blank = { kind: 'Placement', title: '', summary: '', year: '', documentId: null, documentName: null, mimeType: null };

export default function EmployerProof({ company, onClose, onChanged }) {
  const [rows, setRows] = useState(null);
  const [kinds, setKinds] = useState([]);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/admin/companies/${company.id}/proof`);
      setRows(d.rows); setKinds(d.kinds); setErr(null);
    } catch (e) { setErr(e.message); }
  }, [company.id]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    setBusy(true); setErrors({}); setErr(null);
    try {
      const d = await api(`/admin/companies/${company.id}/proof`, {
        method: 'POST',
        body: { ...form, year: form.year === '' ? null : Number(form.year) }
      });
      setRows(d.rows);
      setForm(blank);
      onChanged?.();
    } catch (e) {
      if (e.errors) setErrors(e.errors); else setErr(e.message);
    }
    setBusy(false);
  }

  async function drop(p) {
    setBusy(true); setErr(null);
    try {
      const d = await api(`/admin/companies/${company.id}/proof?proofId=${p.id}`, { method: 'DELETE' });
      setRows(d.rows);
      onChanged?.();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-drawer" style={{ width: 'min(620px,100%)' }} role="dialog" aria-modal="true"
        aria-label={`Proof of work for ${company.name}`}>
        <div className="adm-drawer-head">
          <h2>Proof of work — {company.name}</h2>
        </div>
        <div className="adm-drawer-body">
          <p className="adm-more-note" style={{ marginTop: 0 }}>
            Offer letters, photographs from a hiring drive, a registration certificate — the evidence
            that this employer is real. It shows on every posting from this company, so a candidate
            can check before they travel for an interview.
          </p>

          {err && <div className="adm-note bad"><IconAlert />{err}</div>}

          {!rows && !err && [0, 1].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}

          {rows?.length === 0 && (
            <p className="adm-more-note">Nothing on file yet. The job pages show no Proof of Work section until something is added.</p>
          )}

          {rows?.length > 0 && (
            <div className="adm-minilist">
              {rows.map(p => (
                <div key={p.id} className="adm-minirow">
                  <div>
                    <b><IconImage style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> {p.title}</b>
                    <small>{p.kind}{p.year ? ` · ${p.year}` : ''} · added {fmtWhen(p.addedAt)}</small>
                  </div>
                  {p.url && <a className="adm-btn sm" href={p.url} target="_blank" rel="noreferrer"
                    aria-label={`Open ${p.title}`}><IconEye /></a>}
                  <button type="button" className="adm-btn sm ghost" onClick={() => drop(p)}
                    disabled={busy} aria-label={`Remove ${p.title}`}><IconTrash /></button>
                </div>
              ))}
            </div>
          )}

          <details className="adm-more" style={{ marginTop: 16 }} open={rows?.length === 0}>
            <summary>Add evidence</summary>
            <div className="adm-row">
              <label className={`adm-field${errors.kind ? ' bad' : ''}`}>
                <span>What is it</span>
                <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}>
                  {(kinds.length ? kinds : ['Placement', 'Certificate', 'Event', 'Press', 'Other'])
                    .map(k => <option key={k}>{k}</option>)}
                </select>
                {errors.kind && <em className="err">{errors.kind}</em>}
              </label>
              <label className="adm-field">
                <span>Year</span>
                <input type="number" min="1900" max="2100" value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </label>
            </div>
            <label className={`adm-field${errors.title ? ' bad' : ''}`}>
              <span>Title</span>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 12 candidates placed — March 2026 drive" />
              {errors.title && <em className="err">{errors.title}</em>}
            </label>
            <label className="adm-field">
              <span>One line about it</span>
              <input value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
            </label>
            <FileField label="The file" purpose="proof" vertical="jobs" title={form.title || 'Proof of work'}
              value={form.documentId ? { url: `/api/documents/${form.documentId}`, title: form.documentName, kind: 'image' } : null}
              onUploaded={d => setForm(f => ({ ...f, documentId: d.id, documentName: d.fileName, mimeType: d.mimeType }))}
              onCleared={() => setForm(f => ({ ...f, documentId: null, documentName: null, mimeType: null }))} />
            {errors.file && <div className="adm-note bad" style={{ marginBottom: 14 }}><IconAlert />{errors.file}</div>}
            <button className="adm-btn" onClick={add} disabled={busy || !form.title.trim() || !form.documentId}>
              <IconPlus />Add evidence
            </button>
          </details>
        </div>
        <div className="adm-drawer-foot">
          <button className="adm-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
