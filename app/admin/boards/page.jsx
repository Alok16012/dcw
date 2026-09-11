'use client';
import { useEffect, useState, useCallback } from 'react';
import { PageTop, useToast } from '../AdminShell.jsx';
import { api, ApiError, fmtWhen } from '@/lib/admin-client.js';
import { IconPlus, IconEmpty, IconAlert, IconEdit, IconTrash, IconClose } from '../icons.jsx';

/** Hoisted — see JobForm for why a Field defined in the render body eats the caret. */
function Field({ error, label, children, hint }) {
  return (
    <label className={`adm-field${error ? ' bad' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <em className="err">{error}</em>}
      {!error && hint && <em className="err" style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{hint}</em>}
    </label>
  );
}

const blank = {
  name: '', full: '', kicker: 'OPEN SCHOOL', recognition: '',
  examFrequency: 'On-demand', examLabel: '', resultDays: 60, resultLabel: '',
  fee: '', feeLabel: '', acceptance: 70, flexibility: 'High',
  bestFor: '', plain: '', tcRequired: false, order: 0
};

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

/**
 * Open-school boards (client requirement 4).
 *
 * The three boards used to be a constant in three files — a seed table, an array
 * inside the public component, and a comparison grid written out by hand — so
 * correcting NIOS's fee meant a code change and a deploy. They are one record
 * now, and this page is where it is corrected.
 *
 * The display strings are editable alongside the numbers because they are not
 * derivable: "45–60 days" is a range a board publishes, not a rounding of 52.
 * Leave one blank and the repository fills it from the number.
 */
export default function BoardsPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);   // board object, or 'new'
  const [v, setV] = useState(blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    try { setData(await api('/admin/boards')); setErr(null); }
    catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function open(board) {
    setEditing(board ?? 'new');
    setErrors({});
    setV(board ? { ...blank, ...board } : blank);
  }

  const set = (k, val) => {
    setV(p => ({ ...p, [k]: val }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErrors({});
    const body = {
      ...v,
      fee: v.fee === '' ? 0 : Number(v.fee),
      resultDays: Number(v.resultDays), acceptance: Number(v.acceptance), order: Number(v.order)
    };
    try {
      if (editing === 'new') await api('/admin/boards', { method: 'POST', body });
      else await api(`/admin/boards/${editing.id}`, { method: 'PATCH', body });
      toast(editing === 'new' ? `${v.name} added.` : `${v.name} updated — the public comparison uses it straight away.`);
      setEditing(null);
      await load();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.errors) { setErrors(e2.errors); toast('Check the highlighted fields.', 'bad'); }
      else toast(e2.message, 'bad');
    }
    setBusy(false);
  }

  async function remove(board, hard) {
    setBusy(true);
    try {
      await api(`/admin/boards/${board.id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
      toast(hard ? `${board.name} deleted.` : `${board.name} is no longer listed.`);
      setConfirming(null);
      await load();
    } catch (e) { toast(e.message, 'bad'); }
    setBusy(false);
  }

  const rows = data?.rows ?? [];

  return (
    <>
      <PageTop title="Open school boards"
        sub="NIOS, BOSSE, BBOSE and anything you add. These feed the board cards, the comparison table and the fee figures on Distance Courses Wala.">
        <button className="adm-btn pri" onClick={() => open(null)}><IconPlus />Add a board</button>
      </PageTop>

      <div className="adm-body">
        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {!data && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {data && rows.length === 0 && (
          <div className="adm-panel">
            <div className="adm-empty">
              <IconEmpty /><h3>No boards listed</h3>
              <p>Add a board and it appears on the open-schooling pages with its fee, result time and comparison row.</p>
              <button className="adm-btn pri" onClick={() => open(null)}><IconPlus />Add a board</button>
            </div>
          </div>
        )}

        {data && rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Board</th><th>Recognition</th><th>Exams</th>
                  <th>Result</th><th className="adm-num">Fee</th><th className="adm-num">Acceptance</th>
                  <th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map(b => (
                  <tr key={b.id}>
                    <td>
                      <b>{b.name}</b>
                      <span className="adm-sub">{b.full}</span>
                    </td>
                    <td>{b.recognition}</td>
                    <td>{b.examLabel}</td>
                    <td>{b.resultLabel}</td>
                    <td className="adm-num">{b.feeLabel || money(b.fee)}</td>
                    <td className="adm-num">{b.acceptance}</td>
                    <td>
                      <span className={`adm-pill s-${b.isActive ? 'active' : 'inactive'}`}>{b.isActive ? 'Listed' : 'Hidden'}</span>
                      {b.updatedBy && <span className="adm-sub">{fmtWhen(b.updatedAt)}</span>}
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-btn sm" onClick={() => open(b)} aria-label={`Edit ${b.name}`}><IconEdit /></button>
                        <button className="adm-btn sm danger" onClick={() => setConfirming(b)} aria-label={`Remove ${b.name}`}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="adm-drawer" role="dialog" aria-modal="true" aria-label={editing === 'new' ? 'Add a board' : 'Edit board'}>
            <form onSubmit={save}>
              <div className="adm-drawer-head">
                <h2>{editing === 'new' ? 'Add a board' : `Edit ${editing.name}`}</h2>
                <button type="button" className="adm-btn ghost sm" onClick={() => setEditing(null)} aria-label="Close"><IconClose /></button>
              </div>

              <div className="adm-drawer-body">
                <div className="adm-row">
                  <Field error={errors.name} label="Short name *" hint="What the cards say.">
                    <input value={v.name} onChange={e => set('name', e.target.value)} placeholder="e.g. NIOS" required />
                  </Field>
                  <Field label="Label above the name">
                    <input value={v.kicker} onChange={e => set('kicker', e.target.value)} placeholder="CENTRAL BOARD" />
                  </Field>
                </div>
                <Field label="Full name">
                  <input value={v.full} onChange={e => set('full', e.target.value)}
                    placeholder="National Institute of Open Schooling" />
                </Field>
                <Field error={errors.recognition} label="Recognised by *"
                  hint="Students choose on exactly this line, so say who accepts it.">
                  <input value={v.recognition} onChange={e => set('recognition', e.target.value)}
                    placeholder="e.g. MHRD, Govt. of India" required />
                </Field>

                <Field label="One line, in plain words"
                  hint="For someone who has just failed a board exam and does not know what any of the other fields mean.">
                  <textarea value={v.plain} onChange={e => set('plain', e.target.value)}
                    placeholder="The safest choice. Almost every college and government job accepts it." />
                </Field>
                <Field label="Best for">
                  <input value={v.bestFor} onChange={e => set('bestFor', e.target.value)}
                    placeholder="Widest acceptance — college admission and government jobs." />
                </Field>

                <div className="adm-row">
                  <Field error={errors.fee} label="Indicative fee (₹) *">
                    <input type="number" min="0" step="100" value={v.fee}
                      onChange={e => set('fee', e.target.value)} placeholder="18500" required />
                  </Field>
                  <Field label="Fee, as displayed" hint="Leave blank to show the number above.">
                    <input value={v.feeLabel} onChange={e => set('feeLabel', e.target.value)} placeholder="₹18,500" />
                  </Field>
                </div>
                <div className="adm-row">
                  <Field error={errors.resultDays} label="Result time (days)">
                    <input type="number" min="1" value={v.resultDays} onChange={e => set('resultDays', e.target.value)} />
                  </Field>
                  <Field label="Result, as displayed" hint="A published range, e.g. “45–60 days”.">
                    <input value={v.resultLabel} onChange={e => set('resultLabel', e.target.value)} />
                  </Field>
                </div>
                <div className="adm-row">
                  <Field label="Exam frequency">
                    <input value={v.examFrequency} onChange={e => set('examFrequency', e.target.value)} placeholder="On-demand" />
                  </Field>
                  <Field label="Exams, as displayed">
                    <input value={v.examLabel} onChange={e => set('examLabel', e.target.value)} placeholder="2×/yr + on-demand" />
                  </Field>
                </div>
                <div className="adm-row">
                  <Field error={errors.acceptance} label="Acceptance score (0–100)"
                    hint="How widely the certificate is accepted. Drives the comparison row.">
                    <input type="number" min="0" max="100" value={v.acceptance} onChange={e => set('acceptance', e.target.value)} />
                  </Field>
                  <Field label="Subject flexibility">
                    <select value={v.flexibility} onChange={e => set('flexibility', e.target.value)}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </Field>
                </div>
                <div className="adm-row">
                  <Field label="Order on the page">
                    <input type="number" min="0" value={v.order} onChange={e => set('order', e.target.value)} />
                  </Field>
                  <div />
                </div>
                <div className="adm-check">
                  <input type="checkbox" id="tc" checked={!!v.tcRequired} onChange={e => set('tcRequired', e.target.checked)} />
                  <label htmlFor="tc">A transfer certificate is required to enrol</label>
                </div>
                {editing !== 'new' && (
                  <div className="adm-check">
                    <input type="checkbox" id="listed" checked={v.isActive !== false}
                      onChange={e => set('isActive', e.target.checked)} />
                    <label htmlFor="listed">List this board on the public site</label>
                  </div>
                )}
              </div>

              <div className="adm-drawer-foot">
                <button type="button" className="adm-btn" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="adm-btn pri" disabled={busy}>
                  {busy ? 'Saving…' : editing === 'new' ? 'Add board' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirming && (
        <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && setConfirming(null)}>
          <div className="adm-drawer" style={{ width: 'min(460px,100%)' }} role="dialog" aria-modal="true">
            <div className="adm-drawer-head"><h2>Remove {confirming.name}?</h2></div>
            <div className="adm-drawer-body">
              <div className="adm-note warn" style={{ marginBottom: 16 }}>
                <IconAlert />Students who enquired through this board still have it on their record.
                Hiding it takes it off the public pages and can be undone; deletion cannot.
              </div>
              <button className="adm-btn full" style={{ width: '100%', marginBottom: 9 }}
                onClick={() => remove(confirming, false)} disabled={busy}>
                Hide it — keep the record
              </button>
              <button className="adm-btn danger" style={{ width: '100%' }}
                onClick={() => remove(confirming, true)} disabled={busy}>
                Delete permanently
              </button>
            </div>
            <div className="adm-drawer-foot">
              <button className="adm-btn" onClick={() => setConfirming(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
