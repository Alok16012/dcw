'use client';
import { useEffect, useState, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { PageTop, useToast, useRefreshCounts } from '../../AdminShell.jsx';
import { api, ApiError, fmtDate, fmtWhen, pillClass } from '@/lib/admin-client.js';
import { IconAlert, IconCheck, IconEye, IconSend, IconCap } from '../../icons.jsx';

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

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

/** A select over an editable list that still offers whatever the record holds,
 *  so opening the form cannot rewrite a value nobody touched. */
function OptionSelect({ value, options, blank = 'Not stated', ...rest }) {
  const list = options ?? [];
  const extra = value && !list.some(o => String(o).toLowerCase() === String(value).toLowerCase()) ? value : null;
  return (
    <select value={value ?? ''} {...rest}>
      <option value="">{blank}</option>
      {extra && <option>{extra}</option>}
      {list.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

const draftFrom = a => ({
  name: a.name ?? '', email: a.email ?? '', city: a.city ?? '',
  qualification: a.qualification ?? '', branch: a.branch ?? '',
  institutionId: a.institutionId ?? '', course: a.course ?? '',
  courseFee: a.courseFee ?? 0, counsellor: a.counsellor ?? '',
  documentUrl: a.documentUrl ?? '', vertical: a.vertical ?? 'distance'
});

/**
 * One student file, whole.
 *
 * The only editable surface for an admission used to be the stage drop-down and
 * a note — so a misspelt name, a wrong email or a branch recorded against the
 * wrong course could not be corrected at all, and staff worked around it by
 * filing the student a second time. Everything the record holds is on this page
 * now; what is deliberately not editable says so and says why.
 */
export default function StudentPage({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const refreshCounts = useRefreshCounts();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState(null);

  const [move, setMove] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api(`/admin/admissions/${id}`);
      setData(d);
      setDraft(draftFrom(d.application));
      setMove('');
      setErr(null);
    } catch (e) {
      setErr(e.status === 404 ? 'That student file no longer exists.'
        : e.status === 403 ? 'Student files are visible to DCW admins only.' : e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const a = data?.application;
  const institutions = data?.institutions ?? [];
  const chosen = useMemo(
    () => institutions.find(i => i.id === draft?.institutionId) ?? null,
    [institutions, draft?.institutionId]);

  const set = (k, v) => {
    setDraft(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  /* Picking a different course pulls its fee and its stream across, because a
     file moved onto another course and left on the old fee is the single most
     expensive kind of stale data here — the instalment plan is cut from it. */
  function pickCourse(name) {
    const row = chosen?.courses.find(c => c.name === name);
    setDraft(p => ({ ...p, course: name,
      courseFee: row?.totalFee ?? p.courseFee,
      branch: row?.stream ?? p.branch }));
  }

  function pickInstitution(instId) {
    const inst = institutions.find(i => i.id === instId);
    setDraft(p => ({ ...p, institutionId: instId, institutionName: inst?.name ?? null,
      course: '', vertical: inst?.vertical ?? p.vertical }));
  }

  function handle(e) {
    if (e instanceof ApiError && e.errors) { setErrors(e.errors); toast('Check the highlighted fields.', 'bad'); }
    else if (e.status === 409) toast(e.message, 'bad');
    else toast(e.message, 'bad');
  }

  async function saveFields() {
    setBusy(true); setErrors({});
    try {
      const inst = institutions.find(i => i.id === draft.institutionId);
      const d = await api(`/admin/admissions/${id}`, {
        method: 'PATCH',
        body: {
          fields: {
            ...draft,
            institutionId: draft.institutionId || null,
            institutionName: inst?.name ?? a.institutionName ?? null,
            courseFee: Number(draft.courseFee) || 0
          }
        }
      });
      setData(d);
      setDraft(draftFrom(d.application));
      toast(d.edited?.length ? `Saved — ${d.edited.join(', ')}.` : 'Nothing had changed.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  /** Stage move, note and WhatsApp in one request, because that is how the work
   *  actually happens: a file moves and the reason moves with it. */
  async function applyMove() {
    if (!move && !note.trim()) return;
    setBusy(true);
    try {
      const d = await api(`/admin/admissions/${id}`, {
        method: 'PATCH',
        body: { status: move || undefined, note: note.trim() || undefined, notify: notify && !!move }
      });
      setData(d);
      setDraft(draftFrom(d.application));
      setMove(''); setNote(''); setNotify(false);
      refreshCounts();
      toast(d.moved
        ? `Moved to ${d.moved.to}${d.notified ? ' · WhatsApp sent' : ''}.`
        : 'Note added.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function assign(counsellor) {
    setBusy(true);
    try {
      const d = await api(`/admin/admissions/${id}`, { method: 'PATCH', body: { counsellor } });
      setData(d);
      setDraft(draftFrom(d.application));
      toast(`Assigned to ${counsellor}.`);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  if (err) {
    return (
      <>
        <PageTop title="Student" sub="" />
        <div className="adm-body">
          <div className="adm-note bad"><IconAlert />{err}</div>
          <Link className="adm-btn" href="/admin/students">Back to students</Link>
        </div>
      </>
    );
  }

  if (!data || !draft) {
    return (
      <>
        <PageTop title="Loading…" sub="" />
        <div className="adm-body"><div className="adm-panel" style={{ padding: 18 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
        </div></div>
      </>
    );
  }

  const fee = data.fee;
  const allowed = data.allowed ?? [];

  return (
    <>
      <PageTop title={a.name}
        sub={`${a.id} · applied ${fmtWhen(a.appliedAt)} · ${a.vertical === 'colleges' ? 'Colleges Wala' : 'Distance Courses Wala'}`}>
        <Link className="adm-btn" href="/admin/students">All students</Link>
        <a className="adm-btn" href={`tel:${a.phone}`}>Call {a.phone}</a>
      </PageTop>

      <div className="adm-body">
        <div className="adm-split2">
          <div className="adm-panel" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Student details</h2>
            <p className="adm-more-note">
              Everything on the record, editable. The mobile number and the stage are the two
              exceptions: the number is the identity the fee plan and the applicant’s own login are
              keyed to, and the stage moves through the transitions on the right so a file cannot
              reach Enrolled without passing verification.
            </p>

            <div className="adm-row">
              <Field error={errors.name} label="Full name">
                <input value={draft.name} onChange={e => set('name', e.target.value)} />
              </Field>
              <Field label="Mobile" hint="Fixed. Identifies the student across fees, documents and login.">
                <input value={a.phone} readOnly disabled />
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.email} label="Email">
                <input type="email" value={draft.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field error={errors.city} label="City">
                <input value={draft.city} onChange={e => set('city', e.target.value)} />
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.qualification} label="Qualification">
                <OptionSelect value={draft.qualification} options={data.qualifications}
                  onChange={e => set('qualification', e.target.value)} />
              </Field>
              <Field error={errors.branch} label="Branch"
                hint="The stream the course sits in. Set from the course, correctable here.">
                <OptionSelect value={draft.branch} options={data.branches}
                  onChange={e => set('branch', e.target.value)} />
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.institutionId} label="Institution">
                <select value={draft.institutionId} onChange={e => pickInstitution(e.target.value)}>
                  <option value="">Not decided yet</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </Field>
              <Field error={errors.course} label="Course">
                {chosen
                  ? <OptionSelect value={draft.course} options={chosen.courses.map(c => c.name)}
                      blank="Not stated" onChange={e => pickCourse(e.target.value)} />
                  : <input value={draft.course} onChange={e => set('course', e.target.value)}
                      placeholder="Course name" />}
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.courseFee} label="Course fee (₹)"
                hint={fee ? 'A schedule already exists; changing this does not rewrite its instalments.' : 'Used when a fee schedule is cut.'}>
                <input type="number" min="0" step="500" value={draft.courseFee}
                  onChange={e => set('courseFee', e.target.value)} />
              </Field>
              <Field error={errors.vertical} label="Which site">
                <select value={draft.vertical} onChange={e => set('vertical', e.target.value)}>
                  <option value="distance">Distance Courses Wala</option>
                  <option value="colleges">Colleges Wala</option>
                </select>
              </Field>
            </div>
            <div className="adm-row">
              <Field label="Counsellor">
                <OptionSelect value={draft.counsellor} options={data.counsellors} blank="Unassigned"
                  onChange={e => set('counsellor', e.target.value)} />
              </Field>
              <Field label="Document on file" hint="The file the student attached when applying.">
                <input value={draft.documentUrl} onChange={e => set('documentUrl', e.target.value)}
                  placeholder="No document" />
              </Field>
            </div>

            <div className="adm-course-actions">
              <button className="adm-btn pri" onClick={saveFields} disabled={busy || !draft.name.trim()}>
                {busy ? 'Saving…' : <><IconCheck />Save changes</>}
              </button>
              <button className="adm-btn" onClick={() => { setDraft(draftFrom(a)); setErrors({}); }}
                disabled={busy}>Reset</button>
              {draft.documentUrl && (
                <a className="adm-btn" href={draft.documentUrl} target="_blank" rel="noreferrer"><IconEye />Open document</a>
              )}
            </div>

            <h2 style={{ fontSize: 15, margin: '26px 0 4px' }}>History</h2>
            <p className="adm-more-note">Every stage move, note and edit on this file, most recent last.</p>
            <div className="adm-minilist">
              {(data.activity ?? []).map((ev, i) => (
                <div key={`${ev.at}-${i}`} className="adm-minirow">
                  <div>
                    <b>{ev.note}</b>
                    <small>{ev.type} · {ev.actor} · {fmtWhen(ev.at)}</small>
                  </div>
                </div>
              ))}
            </div>
            {(data.activity ?? []).length === 0 && (
              <div className="adm-empty" style={{ padding: 28 }}><IconCap /><h3>Nothing logged yet</h3></div>
            )}
          </div>

          <aside className="adm-panel adm-side" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Stage</h3>
            <span className={pillClass(a.status)} style={{ marginBottom: 12 }}>{a.status}</span>

            {allowed.length === 0
              ? <p className="adm-more-note">This file is closed. Nothing follows {a.status}.</p>
              : (
                <>
                  <Field label="Move to">
                    <select value={move} onChange={e => setMove(e.target.value)}>
                      <option value="">Stay at {a.status}</option>
                      {allowed.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Note" hint="Kept on the file. Written for whoever picks it up next.">
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="e.g. Marksheet received, ID still pending." />
                  </Field>
                  <label className="adm-check" style={{ marginBottom: 12 }}>
                    <input type="checkbox" checked={notify} disabled={!move}
                      onChange={e => setNotify(e.target.checked)} />
                    <span>Tell the student on WhatsApp{!move ? ' (needs a stage move)' : ''}</span>
                  </label>
                  <button className="adm-btn pri" style={{ width: '100%' }} onClick={applyMove}
                    disabled={busy || (!move && !note.trim())}>
                    <IconSend />{move ? `Move to ${move}` : 'Add note'}
                  </button>
                </>
              )}

            <h3 style={{ fontSize: 13, margin: '22px 0 8px' }}>Fees</h3>
            {fee ? (
              <dl className="adm-dl">
                <div><dt>Total</dt><dd>{money(fee.totalFee)}</dd></div>
                <div><dt>Paid</dt><dd>{money(fee.paid)}</dd></div>
                <div><dt>Outstanding</dt><dd>{money(fee.outstanding)}</dd></div>
                <div><dt>Next due</dt><dd>{fee.next ? `${money(fee.next.amount)} · ${fmtDate(fee.next.dueOn)}` : '—'}</dd></div>
              </dl>
            ) : (
              <p className="adm-more-note" style={{ marginBottom: 0 }}>
                No schedule cut for this file — the course carries no fee, or the file was created
                before one was set.
              </p>
            )}

            <h3 style={{ fontSize: 13, margin: '22px 0 8px' }}>Assign</h3>
            <div className="adm-chips">
              {(data.counsellors ?? []).map(c => (
                <button key={c} className={`adm-chip${a.counsellor === c ? ' on' : ''}`}
                  onClick={() => assign(c)} disabled={busy || a.counsellor === c}>{c}</button>
              ))}
            </div>

            <h3 style={{ fontSize: 13, margin: '22px 0 8px' }}>Where it came from</h3>
            <dl className="adm-dl">
              <div><dt>Lead</dt><dd>{a.leadId || '—'}</dd></div>
              <div><dt>Source</dt><dd>{a.source?.url || a.source?.enteredBy || 'Public site'}</dd></div>
              <div><dt>Submits</dt><dd>{a.attempts ?? 1}</dd></div>
              <div><dt>Last touched</dt><dd>{fmtWhen(a.touchedAt)}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}
