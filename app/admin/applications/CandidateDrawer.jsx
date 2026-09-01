'use client';
import { useEffect, useState } from 'react';
import { api, fmtWhen, fmtDate, pillClass } from '@/lib/admin-client.js';
import { IconClose, IconAlert, IconStar } from '../icons.jsx';

/** One candidate, everything a recruiter needs in a single pane: who they are,
 *  where they stand, the only moves the pipeline allows from here, and the
 *  full trail of what everyone did before. */
export default function CandidateDrawer({ id, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [blocked, setBlocked] = useState(null);

  const load = () => api(`/admin/applications/${id}`).then(setD).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(body, message) {
    setBusy(true); setBlocked(null);
    try {
      await api(`/admin/applications/${id}`, { method: 'PATCH', body });
      await load();
      onChanged(message);
    } catch (e) {
      // A refused stage move is guidance, not a failure — show what is allowed.
      if (e.status === 409) setBlocked(e.message || 'That move is not allowed from this stage.');
      else setErr(e.message);
    }
    setBusy(false);
  }

  const a = d?.application;

  return (
    <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-drawer" role="dialog" aria-modal="true" aria-label="Candidate">
        <div className="adm-drawer-head">
          <h2>{a ? a.name : 'Candidate'}</h2>
          <button className="adm-btn ghost sm" onClick={onClose} aria-label="Close"><IconClose /></button>
        </div>

        <div className="adm-drawer-body">
          {err && <div className="adm-note bad"><IconAlert />{err}</div>}
          {!d && !err && [0, 1, 2].map(i => <div key={i} className="adm-skel" style={{ height: 17, marginBottom: 13 }} />)}

          {d && (
            <>
              <div className="adm-panel" style={{ padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span className={pillClass(a.status)}>{a.status}</span>
                  <span style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>
                    applied {fmtWhen(a.appliedAt)} · updated {fmtWhen(a.touchedAt)}
                  </span>
                </div>
                <dl className="adm-dl">
                  <div><dt>Applied for</dt><dd>{a.jobTitle}</dd></div>
                  <div><dt>Phone</dt><dd><a href={`tel:${a.phone}`}>{a.phone}</a></dd></div>
                  <div><dt>Email</dt><dd>{a.email ? <a href={`mailto:${a.email}`}>{a.email}</a> : '—'}</dd></div>
                  <div><dt>City</dt><dd>{a.city || '—'}</dd></div>
                  <div><dt>Qualification</dt><dd>{a.qualification || '—'}</dd></div>
                  <div><dt>Experience</dt><dd>{a.experienceYears ? `${a.experienceYears} yr` : 'Fresher'}</dd></div>
                  <div><dt>CRM lead</dt><dd>{a.leadId || '—'}</dd></div>
                  <div><dt>Applications</dt><dd>{a.attempts}</dd></div>
                </dl>
              </div>

              <h3 style={{ marginBottom: 8 }}>Rating</h3>
              <div style={{ display: 'flex', gap: 4, marginBottom: 18 }} role="group" aria-label="Rate this candidate">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} className="adm-btn ghost sm" disabled={busy}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`} aria-pressed={a.rating === n}
                    onClick={() => patch({ rating: n }, `Rated ${a.name} ${n}/5.`)}
                    style={{ padding: 4, color: n <= (a.rating || 0) ? '#B77900' : 'var(--ink-3)' }}>
                    <IconStar filled={n <= (a.rating || 0)} style={{ width: 19, height: 19 }} />
                  </button>
                ))}
                <span style={{ alignSelf: 'center', marginLeft: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  {a.rating ? `${a.rating}/5` : 'Not rated'}
                </span>
              </div>

              <h3 style={{ marginBottom: 8 }}>Move to</h3>
              {blocked && <div className="adm-note warn" style={{ marginBottom: 10 }}><IconAlert />{blocked}</div>}
              {d.allowed?.length ? (
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
                  {d.allowed.map(s => (
                    <button key={s} disabled={busy}
                      className={`adm-btn sm${['Rejected', 'On hold'].includes(s) ? ' danger' : ' pri'}`}
                      onClick={() => patch({ status: s }, `${a.name} moved to ${s}.`)}>{s}</button>
                  ))}
                </div>
              ) : (
                <div className="adm-note ok" style={{ marginBottom: 20 }}>
                  <IconAlert />This candidate is at a final stage — there are no further moves.
                </div>
              )}

              <h3 style={{ marginBottom: 8 }}>Add a note</h3>
              <form style={{ marginBottom: 22 }} onSubmit={e => {
                e.preventDefault();
                if (!note.trim()) return;
                patch({ note: note.trim() }, 'Note added.').then(() => setNote(''));
              }}>
                <div className="adm-field" style={{ marginBottom: 8 }}>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="What came out of the call?" aria-label="Note" style={{ minHeight: 68 }} />
                </div>
                <button className="adm-btn" type="submit" disabled={busy || !note.trim()}>Save note</button>
              </form>

              <h3 style={{ marginBottom: 10 }}>Activity</h3>
              <ul className="adm-trail">
                {[...(d.activity || [])].reverse().map((x, i) => (
                  <li key={i}>
                    <b>{x.note || x.type}</b>
                    <small>{x.by ? `${x.by} · ` : ''}{fmtDate(x.at)} · {fmtWhen(x.at)}</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
