'use client';
import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { PageTop, useToast, useRefreshCounts } from '../../AdminShell.jsx';
import FileField from '../../FileField.jsx';
import { api, ApiError, fmtDate, fmtWhen } from '@/lib/admin-client.js';
import { IconAlert, IconCheck, IconTrash, IconPlus, IconShield, IconPin, IconImage, IconStar, IconEye, IconEdit } from '../../icons.jsx';

/** Hoisted for the same reason it is hoisted in JobForm: a component defined in
 *  the render body remounts its inputs on every keystroke. */
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

const TABS = [
  { key: 'basics', label: 'Basics' },
  { key: 'courses', label: 'Courses & fees' },
  { key: 'approvals', label: 'Recognition' },
  { key: 'proof', label: 'Proof of work' },
  { key: 'location', label: 'Location & files' },
  { key: 'reviews', label: 'Reviews' }
];

const blankCourse = {
  name: '', level: 'UG', stream: 'General', mode: 'Online',
  durationMonths: 36, totalFee: '', mrpFee: '', seats: '',
  eligibility: '10+2 from a recognised board', deadline: 'Rolling',
  examAccepted: '', note: ''
};

/** The course as the form holds it: every value a string or number an input can
 *  own, arrays flattened to the comma list the field shows. */
const draftFromCourse = c => ({
  name: c.name ?? '', level: c.level ?? 'UG', stream: c.stream ?? 'General',
  mode: c.mode ?? 'Online', durationMonths: c.durationMonths ?? 12,
  totalFee: c.totalFee ?? '', mrpFee: c.mrpFee ?? '', seats: c.seats ?? '',
  eligibility: c.eligibility ?? '', deadline: c.deadline ?? 'Rolling',
  examAccepted: (c.examAccepted ?? []).join(', '), note: c.note ?? ''
});

/** …and back, in the shape validateCourse() expects. Blank optional numbers go
 *  as null rather than 0, because "no seat cap" and "nought seats" are different
 *  answers and only one of them is true. */
const coursePayload = d => ({
  name: String(d.name).trim(), level: d.level, stream: String(d.stream).trim(),
  mode: d.mode, durationMonths: Number(d.durationMonths) || 12,
  totalFee: Number(d.totalFee) || 0,
  mrpFee: d.mrpFee === '' || d.mrpFee == null ? null : Number(d.mrpFee),
  seats: d.seats === '' || d.seats == null ? null : Number(d.seats),
  eligibility: String(d.eligibility).trim(),
  deadline: String(d.deadline).trim() || 'Rolling',
  examAccepted: String(d.examAccepted).split(',').map(s => s.trim()).filter(Boolean),
  note: String(d.note).trim() || null
});

/**
 * A select drawn from an editable list.
 *
 * If the record holds a value the list no longer carries — renamed under
 * Dropdowns & lists, or seeded before the list existed — that value is offered
 * too. Otherwise the select renders with nothing selected and the first save
 * silently rewrites a field nobody touched.
 */
function OptionSelect({ value, options, ...rest }) {
  const list = options ?? [];
  const all = value && !list.some(o => String(o).toLowerCase() === String(value).toLowerCase())
    ? [value, ...list] : list;
  return <select value={value ?? ''} {...rest}>{all.map(o => <option key={o}>{o}</option>)}</select>;
}

/**
 * One course, whole.
 *
 * This tab used to offer the fee and nothing else, so fixing a typo in a course
 * name meant retiring the course and adding it again — which loses its id, and
 * with it every application already filed against it. The same form now backs
 * both the edit and the add, so a course created here and one edited here
 * cannot end up in different shapes.
 */
function CourseForm({ draft, set, enums, errors, children }) {
  return (
    <>
      <Field error={errors.name} label="Course name">
        <input value={draft.name} onChange={e => set('name', e.target.value)} placeholder="e.g. BBA" />
      </Field>
      <div className="adm-row">
        <Field error={errors.level} label="Level">
          <OptionSelect value={draft.level} options={enums.levels} onChange={e => set('level', e.target.value)} />
        </Field>
        <Field error={errors.stream} label="Stream / branch" hint="Shown as the branch against every student on this course.">
          <OptionSelect value={draft.stream} options={enums.streams} onChange={e => set('stream', e.target.value)} />
        </Field>
      </div>
      <div className="adm-row">
        <Field error={errors.mode} label="Mode">
          <OptionSelect value={draft.mode} options={enums.modes} onChange={e => set('mode', e.target.value)} />
        </Field>
        <Field error={errors.durationMonths} label="Duration (months)">
          <input type="number" min="1" value={draft.durationMonths}
            onChange={e => set('durationMonths', e.target.value)} />
        </Field>
      </div>
      <div className="adm-row">
        <Field error={errors.totalFee} label="Total fee (₹)">
          <input type="number" min="0" step="500" value={draft.totalFee}
            onChange={e => set('totalFee', e.target.value)} />
        </Field>
        <Field error={errors.mrpFee} label="List fee (₹)"
          hint="Optional. Struck through on the card; cannot be below the payable fee.">
          <input type="number" min="0" step="500" value={draft.mrpFee}
            onChange={e => set('mrpFee', e.target.value)} />
        </Field>
      </div>
      <div className="adm-row">
        <Field error={errors.seats} label="Seats" hint="Leave blank if there is no cap.">
          <input type="number" min="0" value={draft.seats} onChange={e => set('seats', e.target.value)} />
        </Field>
        <Field label="Applications close">
          <input value={draft.deadline} onChange={e => set('deadline', e.target.value)} placeholder="Rolling" />
        </Field>
      </div>
      <Field error={errors.eligibility} label="Who can apply">
        <input value={draft.eligibility} onChange={e => set('eligibility', e.target.value)} />
      </Field>
      <Field label="Entrance exams accepted" hint="Comma separated. Blank if there is no entrance test.">
        <input value={draft.examAccepted} onChange={e => set('examAccepted', e.target.value)}
          placeholder="CUET, CAT" />
      </Field>
      <Field label="Note" hint="Optional. One line, shown under the course on the listing.">
        <input value={draft.note} onChange={e => set('note', e.target.value)} />
      </Field>
      {children}
    </>
  );
}
const blankApproval = { body: '', grade: '', scope: '', validTill: '', documentId: null, documentName: null };
const blankProof = { kind: 'Result', title: '', summary: '', year: '', courseName: '', documentId: null, documentName: null };

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

/**
 * One listing, editable in place.
 *
 * Everything the public detail page shows is on one of these tabs, and each tab
 * writes through the same routes the wizard uses — so a listing created by the
 * guided flow and one edited here cannot end up in different shapes.
 */
export default function InstitutionEditor({ params }) {
  const { id } = use(params);
  const toast = useToast();
  const refreshCounts = useRefreshCounts();

  const [tab, setTab] = useState('basics');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(null);
  const [course, setCourse] = useState(blankCourse);
  /* Which course row is open for editing, and the draft it is holding. One at a
     time on purpose: two half-finished course edits on screen is how the wrong
     one gets saved. */
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [approval, setApproval] = useState(blankApproval);
  const [proof, setProof] = useState(blankProof);
  const [google, setGoogle] = useState({ placeId: '', mapsUrl: '', address: '', lat: '', lng: '' });
  /* The description of the campus photograph. Separate from `form` because it
     is saved beside the file it describes, on the documents tab, rather than
     with the name and the city. */
  const [photoAlt, setPhotoAlt] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await api(`/admin/institutions/${id}`);
      setData(d);
      setForm({
        name: d.institution.name ?? '', type: d.institution.type ?? '',
        city: d.institution.city ?? '', state: d.institution.state ?? '',
        established: d.institution.established ?? '',
        plainSummary: d.institution.plainSummary ?? '',
        description: d.institution.description ?? '',
        highlights: (d.institution.highlights ?? []).join('\n')
      });
      setGoogle({
        placeId: d.institution.google?.placeId ?? '', mapsUrl: d.institution.google?.mapsUrl ?? '',
        address: d.institution.google?.address ?? '',
        lat: d.institution.google?.lat ?? '', lng: d.institution.google?.lng ?? ''
      });
      setPhotoAlt(d.institution.imageAlt ?? '');
      setErr(null);
    } catch (e) { setErr(e.message); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handle(e) {
    if (e instanceof ApiError && e.errors) { setErrors(e.errors); toast('Check the highlighted fields.', 'bad'); }
    else toast(e.message, 'bad');
  }

  async function patch(body, message) {
    setBusy(true); setErrors({});
    try {
      await api(`/admin/institutions/${id}`, { method: 'PATCH', body });
      await load();
      if (message) toast(message);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function saveBasics() {
    await patch({
      ...form,
      established: form.established === '' ? null : Number(form.established),
      highlights: form.highlights.split('\n').map(h => h.trim()).filter(Boolean)
    }, 'Saved.');
  }

  async function addCourse() {
    setBusy(true); setErrors({});
    try {
      await api(`/admin/institutions/${id}`, { method: 'POST', body: coursePayload(course) });
      setCourse(blankCourse);
      await load();
      toast('Course added.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function patchCourse(c, body, message) {
    setBusy(true);
    try {
      await api(`/admin/institutions/${id}/courses/${c.id}`, { method: 'PATCH', body });
      await load();
      if (message) toast(message);
      return true;
    } catch (e) { handle(e); return false; }
    finally { setBusy(false); }
  }

  function startEdit(c) {
    setErrors({});
    setEditingId(c.id);
    setDraft(draftFromCourse(c));
  }

  async function saveEdit(c) {
    setErrors({});
    if (await patchCourse(c, coursePayload(draft), `“${draft.name.trim() || c.name}” saved.`)) {
      setEditingId(null); setDraft(null);
    }
  }

  /**
   * Retiring a course, or removing one that never ran.
   *
   * `hard` is offered only where the row shows no applications against it — a
   * soft retire keeps the id, and the pipeline needs the id to stay readable.
   */
  async function dropCourse(c, hard = false) {
    setBusy(true);
    try {
      await api(`/admin/institutions/${id}/courses/${c.id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
      if (editingId === c.id) { setEditingId(null); setDraft(null); }
      await load();
      toast(hard ? `“${c.name}” deleted.` : `“${c.name}” is no longer offered.`);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function addApproval() {
    if (!approval.body.trim()) { setErrors({ body: 'Name the body that recognises them.' }); return; }
    await patch({ approvals: [...(data.institution.approvals ?? []), approval] }, 'Recognition added.');
    setApproval(blankApproval);
  }

  async function addProof() {
    setBusy(true); setErrors({});
    try {
      await api(`/admin/institutions/${id}/proof`, {
        method: 'POST',
        body: { ...proof, year: proof.year === '' ? null : Number(proof.year) }
      });
      setProof(blankProof);
      await load();
      toast('Proof added — students can open it from the listing.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function dropProof(p) {
    setBusy(true);
    try {
      await api(`/admin/institutions/${id}/proof?proofId=${p.id}`, { method: 'DELETE' });
      await load();
      toast('Removed.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function moderate(review, status) {
    setBusy(true);
    try {
      await api('/admin/reviews', { method: 'PATCH', body: { id: review.id, status } });
      await load();
      refreshCounts();
      toast(status === 'published' ? 'Review published.' : 'Review hidden.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function publish(force = false) {
    setBusy(true);
    try {
      await api(`/admin/institutions/${id}/publish${force ? '?force=true' : ''}`, { method: 'POST' });
      await load();
      refreshCounts();
      toast('Live on the public site.');
    } catch (e) {
      if (e.status === 409) toast('Not ready yet — see what is still missing on the right.', 'bad');
      else handle(e);
    }
    setBusy(false);
  }

  async function unpublish() {
    setBusy(true);
    try {
      await api(`/admin/institutions/${id}/publish`, { method: 'DELETE' });
      await load();
      refreshCounts();
      toast('Back to draft and off the public site.');
    } catch (e) { handle(e); }
    setBusy(false);
  }

  if (err) {
    return (
      <>
        <PageTop title="Listing" sub="" />
        <div className="adm-body"><div className="adm-note bad"><IconAlert />{err}</div>
          <Link className="adm-btn" href="/admin/catalogue">Back to the catalogue</Link>
        </div>
      </>
    );
  }

  if (!data || !form) {
    return (
      <>
        <PageTop title="Loading…" sub="" />
        <div className="adm-body"><div className="adm-panel" style={{ padding: 18 }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
        </div></div>
      </>
    );
  }

  const inst = data.institution;
  const live = (inst.status ?? 'published') === 'published' && inst.isActive !== false;
  const courses = inst.courses.filter(c => c.isActive !== false);
  const retired = inst.courses.filter(c => c.isActive === false);
  const publicPath = `/${inst.vertical === 'distance' ? 'distance' : 'colleges'}/${inst.slug}`;
  // The lists the course selects are drawn from, with the old literals as the
  // fallback for an older response that predates `enums`.
  const enums = data.enums ?? { levels: ['10th', '12th', 'Diploma', 'UG', 'PG'], streams: ['General'],
    modes: ['Online', '100% online', 'Distance', 'Open school', 'Regular'],
    types: [], proofKinds: ['Other'] };
  // How many students are on each course, so "delete permanently" is only
  // offered where there is genuinely nothing to lose.
  const filedAgainst = name => (data.admissions ?? []).filter(a => a.course === name).length;

  return (
    <>
      <PageTop title={inst.name}
        sub={`${[inst.city, inst.state].filter(Boolean).join(', ')} · ${inst.type} · last edited ${fmtWhen(inst.updatedAt)}`}>
        <Link className="adm-btn" href="/admin/catalogue">All listings</Link>
        {live
          ? <>
              <a className="adm-btn" href={publicPath} target="_blank" rel="noreferrer"><IconEye />View live</a>
              <button className="adm-btn" onClick={unpublish} disabled={busy}>Unpublish</button>
            </>
          : <button className="adm-btn pri" onClick={() => publish(false)} disabled={busy}>Publish</button>}
      </PageTop>

      <div className="adm-body">
        <div className="adm-tabs" role="tablist" aria-label="Listing sections">
          {TABS.map(t => (
            <button key={t.key} role="tab" aria-selected={tab === t.key}
              className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
              {t.label}
              {t.key === 'courses' && <span>{courses.length}</span>}
              {t.key === 'approvals' && <span>{inst.approvals.length}</span>}
              {t.key === 'proof' && <span>{inst.proofOfWork.length}</span>}
              {t.key === 'reviews' && <span>{data.reviews.length}</span>}
            </button>
          ))}
        </div>

        <div className="adm-split2">
          <div className="adm-panel" style={{ padding: 20 }}>
            {tab === 'basics' && (
              <>
                <Field error={errors.name} label="Name">
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </Field>
                <div className="adm-row">
                  <Field error={errors.type} label="Type" hint="Add a missing type under Dropdowns & lists.">
                    <OptionSelect value={form.type} options={enums.types}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
                  </Field>
                  <Field error={errors.established} label="Established">
                    <input type="number" min="1800" max="2100" value={form.established}
                      onChange={e => setForm(p => ({ ...p, established: e.target.value }))} />
                  </Field>
                </div>
                <div className="adm-row">
                  <Field error={errors.city} label="City">
                    <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </Field>
                  <Field error={errors.state} label="State">
                    <input value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
                  </Field>
                </div>
                <Field error={errors.plainSummary} label="One line, in plain words"
                  hint="Read first by someone who is not sure they are even eligible.">
                  <textarea value={form.plainSummary} onChange={e => setForm(p => ({ ...p, plainSummary: e.target.value }))} />
                </Field>
                <Field error={errors.description} label="Description">
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </Field>
                <Field label="Highlights" hint="One per line, up to six. Shown as bullets on the detail page.">
                  <textarea value={form.highlights} onChange={e => setForm(p => ({ ...p, highlights: e.target.value }))}
                    placeholder={'Study fully online\nExams from home\nEMI from ₹4,500/month'} />
                </Field>
                <button className="adm-btn pri" onClick={saveBasics} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
              </>
            )}

            {tab === 'courses' && (
              <>
                {courses.length === 0 && (
                  <div className="adm-note warn" style={{ marginBottom: 16 }}>
                    <IconAlert />No live courses. A listing with nothing to apply to cannot be published.
                  </div>
                )}
                <div className="adm-minilist">
                  {courses.map(c => (
                    <div key={c.id}>
                      <div className="adm-minirow">
                        <div>
                          <b>{c.name}</b>
                          <small>
                            {[c.level, c.stream, c.mode, `${c.durationMonths} months`, money(c.totalFee)]
                              .filter(Boolean).join(' · ')}
                            {filedAgainst(c.name) > 0 && ` · ${filedAgainst(c.name)} student${filedAgainst(c.name) === 1 ? '' : 's'}`}
                          </small>
                        </div>
                        <button type="button" className="adm-btn sm"
                          onClick={() => (editingId === c.id ? (setEditingId(null), setDraft(null)) : startEdit(c))}
                          disabled={busy} aria-expanded={editingId === c.id}>
                          <IconEdit />{editingId === c.id ? 'Close' : 'Edit'}
                        </button>
                        <button type="button" className="adm-btn sm ghost" onClick={() => dropCourse(c)}
                          disabled={busy} aria-label={`Stop offering ${c.name}`} title="Stop offering this course">
                          <IconTrash />
                        </button>
                      </div>
                      {editingId === c.id && draft && (
                        <div className="adm-course-edit">
                          <CourseForm draft={draft} enums={enums} errors={errors}
                            set={(k, v) => setDraft(p => ({ ...p, [k]: v }))}>
                            <div className="adm-course-actions">
                              <button className="adm-btn pri" onClick={() => saveEdit(c)}
                                disabled={busy || !draft.name.trim()}>{busy ? 'Saving…' : 'Save course'}</button>
                              <button className="adm-btn" onClick={() => { setEditingId(null); setDraft(null); setErrors({}); }}
                                disabled={busy}>Cancel</button>
                              <span className="adm-course-hint">
                                Fee schedules already issued keep the figures the student agreed to.
                              </span>
                            </div>
                          </CourseForm>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {retired.length > 0 && (
                  <details className="adm-more" style={{ marginTop: 16 }}>
                    <summary>Retired courses ({retired.length})</summary>
                    <p className="adm-more-note" style={{ marginTop: 0 }}>
                      Off the public site, but still readable by every application filed against them.
                      Deleting one permanently is offered only where no student is on it.
                    </p>
                    <div className="adm-minilist">
                      {retired.map(c => (
                        <div key={c.id} className="adm-minirow">
                          <div>
                            <b>{c.name}</b>
                            <small>{[c.level, c.stream, c.mode].filter(Boolean).join(' · ')} · {filedAgainst(c.name)} student(s)</small>
                          </div>
                          <button type="button" className="adm-btn sm" disabled={busy}
                            onClick={() => patchCourse(c, { isActive: true }, `“${c.name}” is being offered again.`)}>
                            Restore
                          </button>
                          {filedAgainst(c.name) === 0 && (
                            <button type="button" className="adm-btn sm danger" disabled={busy}
                              onClick={() => dropCourse(c, true)} aria-label={`Delete ${c.name} permanently`}>
                              <IconTrash />Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <details className="adm-more" style={{ marginTop: 16 }} open={courses.length === 0}>
                  <summary>Add another course</summary>
                  <CourseForm draft={course} enums={enums} errors={editingId ? {} : errors}
                    set={(k, v) => setCourse(p => ({ ...p, [k]: v }))}>
                    <button className="adm-btn" onClick={addCourse} disabled={busy || !course.name.trim()}>
                      <IconPlus />Add course
                    </button>
                  </CourseForm>
                </details>
              </>
            )}

            {tab === 'approvals' && (
              <>
                <div className="adm-minilist">
                  {inst.approvals.map((a, i) => (
                    <div key={`${a.body}-${i}`} className="adm-minirow">
                      <div>
                        <b><IconShield style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> {a.body}{a.grade ? ` — ${a.grade}` : ''}</b>
                        <small>
                          {a.scope ? `${a.scope} · ` : ''}
                          {a.documentId || a.certificateUrl ? 'Certificate attached' : 'No certificate'}
                          {a.validTill ? ` · valid to ${fmtDate(a.validTill)}` : ''}
                        </small>
                      </div>
                      {(a.documentId || a.certificateUrl) && (
                        <a className="adm-btn sm" href={a.certificateUrl || `/api/documents/${a.documentId}`}
                          target="_blank" rel="noreferrer"><IconEye /></a>
                      )}
                      <button type="button" className="adm-btn sm ghost" disabled={busy}
                        onClick={() => patch({ approvals: inst.approvals.filter((_, j) => j !== i) }, 'Removed.')}
                        aria-label={`Remove ${a.body}`}><IconTrash /></button>
                    </div>
                  ))}
                </div>
                {inst.approvals.length === 0 && (
                  <div className="adm-note warn" style={{ marginBottom: 16 }}>
                    <IconAlert />No recognition recorded. This is the claim the listing rests on, so it is required before publishing.
                  </div>
                )}

                <details className="adm-more" style={{ marginTop: 16 }}>
                  <summary>Add a recognition or approval</summary>
                  <div className="adm-row">
                    <Field error={errors.body} label="Approving body">
                      <input value={approval.body} onChange={e => setApproval(p => ({ ...p, body: e.target.value }))}
                        placeholder="e.g. UGC-DEB" />
                    </Field>
                    <Field label="Grade or entitlement">
                      <input value={approval.grade} onChange={e => setApproval(p => ({ ...p, grade: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="adm-row">
                    <Field label="What it covers">
                      <input value={approval.scope} onChange={e => setApproval(p => ({ ...p, scope: e.target.value }))}
                        placeholder="e.g. Online MBA only" />
                    </Field>
                    <Field label="Valid until">
                      <input type="date" value={approval.validTill}
                        onChange={e => setApproval(p => ({ ...p, validTill: e.target.value }))} />
                    </Field>
                  </div>
                  <FileField label="Approval letter or certificate" purpose="approval" institutionId={inst.id}
                    title={approval.body || 'Approval certificate'}
                    value={approval.documentId ? { url: `/api/documents/${approval.documentId}`, title: approval.documentName, kind: 'pdf' } : null}
                    onUploaded={d => setApproval(p => ({ ...p, documentId: d.id, documentName: d.fileName, certificateUrl: d.url }))}
                    onCleared={() => setApproval(p => ({ ...p, documentId: null, documentName: null, certificateUrl: null }))} />
                  <button className="adm-btn" onClick={addApproval} disabled={busy || !approval.body.trim()}><IconPlus />Add</button>
                </details>
              </>
            )}

            {tab === 'proof' && (
              <>
                <p className="adm-more-note" style={{ marginTop: 0 }}>
                  Result sheets, placement letters, admission letters, photographs from a convocation —
                  the evidence behind what the listing claims. Everything added here appears in the
                  Proof of Work section of the public page.
                </p>
                <div className="adm-minilist">
                  {inst.proofOfWork.map(p => (
                    <div key={p.id} className="adm-minirow">
                      <div>
                        <b><IconImage style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> {p.title}</b>
                        <small>{p.kind}{p.year ? ` · ${p.year}` : ''}{p.courseName ? ` · ${p.courseName}` : ''} · added {fmtWhen(p.addedAt)}</small>
                      </div>
                      {p.url && <a className="adm-btn sm" href={p.url} target="_blank" rel="noreferrer"><IconEye /></a>}
                      <button type="button" className="adm-btn sm ghost" onClick={() => dropProof(p)}
                        disabled={busy} aria-label={`Remove ${p.title}`}><IconTrash /></button>
                    </div>
                  ))}
                </div>

                <details className="adm-more" style={{ marginTop: 16 }} open={inst.proofOfWork.length === 0}>
                  <summary>Add evidence</summary>
                  <div className="adm-row">
                    <Field error={errors.kind} label="What is it">
                      <OptionSelect value={proof.kind} options={enums.proofKinds}
                        onChange={e => setProof(p => ({ ...p, kind: e.target.value }))} />
                    </Field>
                    <Field label="Year">
                      <input type="number" min="1900" max="2100" value={proof.year}
                        onChange={e => setProof(p => ({ ...p, year: e.target.value }))} />
                    </Field>
                  </div>
                  <Field error={errors.title} label="Title" hint="What a student would call it.">
                    <input value={proof.title} onChange={e => setProof(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. 2025 batch result sheet — BBA" />
                  </Field>
                  <Field label="Course it relates to" hint="Optional. Links the evidence to one programme.">
                    <select value={proof.courseName} onChange={e => setProof(p => ({ ...p, courseName: e.target.value }))}>
                      <option value="">Whole institution</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="One line about it">
                    <input value={proof.summary} onChange={e => setProof(p => ({ ...p, summary: e.target.value }))} />
                  </Field>
                  <FileField label="The file" purpose="proof" institutionId={inst.id}
                    courseName={proof.courseName || null} title={proof.title || 'Proof of work'}
                    value={proof.documentId ? { url: `/api/documents/${proof.documentId}`, title: proof.documentName, kind: 'image' } : null}
                    onUploaded={d => setProof(p => ({ ...p, documentId: d.id, documentName: d.fileName, mimeType: d.mimeType }))}
                    onCleared={() => setProof(p => ({ ...p, documentId: null, documentName: null }))} />
                  {errors.file && <div className="adm-note bad" style={{ marginBottom: 14 }}><IconAlert />{errors.file}</div>}
                  <button className="adm-btn" onClick={addProof} disabled={busy || !proof.title.trim() || !proof.documentId}>
                    <IconPlus />Add evidence
                  </button>
                </details>
              </>
            )}

            {tab === 'location' && (
              <>
                <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>
                  <IconPin style={{ width: 16, height: 16, verticalAlign: '-3px' }} /> Google location
                </h3>
                <p className="adm-more-note">
                  Drives the map on the detail page, and the Google rating when a Maps API key is
                  configured. Google’s rating is shown beside DCW’s own reviews, never merged into them.
                </p>
                <Field label="Google Place ID">
                  <input value={google.placeId} onChange={e => setGoogle(p => ({ ...p, placeId: e.target.value }))} placeholder="ChIJ…" />
                </Field>
                <Field label="Google Maps link">
                  <input value={google.mapsUrl} onChange={e => setGoogle(p => ({ ...p, mapsUrl: e.target.value }))} />
                </Field>
                <Field label="Address">
                  <input value={google.address} onChange={e => setGoogle(p => ({ ...p, address: e.target.value }))} />
                </Field>
                <div className="adm-row">
                  <Field label="Latitude">
                    <input type="number" step="any" value={google.lat} onChange={e => setGoogle(p => ({ ...p, lat: e.target.value }))} />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="any" value={google.lng} onChange={e => setGoogle(p => ({ ...p, lng: e.target.value }))} />
                  </Field>
                </div>
                <button className="adm-btn pri" onClick={() => patch({ google }, 'Location saved.')} disabled={busy}>
                  Save location
                </button>

                <h3 style={{ margin: '24px 0 10px', fontSize: 14 }}>Campus photograph</h3>
                <FileField label="The picture the public card leads with" purpose="photo" institutionId={inst.id}
                  title={`${inst.name} campus photograph`}
                  hint="Until a real one is uploaded, every card for this listing shows a library scene marked “Illustrative”."
                  value={inst.image ? { url: inst.image, title: 'Current campus photograph', kind: 'image' } : null}
                  onUploaded={d => patch({ image: d.url, imageAlt: '' }, 'Campus photograph uploaded.')}
                  onCleared={() => patch({ image: null, imageAlt: null }, 'Campus photograph removed. Cards go back to the illustrative scene.')} />
                {inst.image && (
                  <>
                    <Field label="What the photograph shows"
                      hint="Read aloud to anyone using a screen reader, and shown if the image fails to load.">
                      <input value={photoAlt} onChange={e => setPhotoAlt(e.target.value)}
                        placeholder={`The ${inst.name} campus`} />
                    </Field>
                    <button className="adm-btn" onClick={() => patch({ imageAlt: photoAlt }, 'Description saved.')} disabled={busy}>
                      Save description
                    </button>
                  </>
                )}

                <h3 style={{ margin: '24px 0 10px', fontSize: 14 }}>Prospectus</h3>
                <FileField label="Prospectus PDF" purpose="prospectus" institutionId={inst.id}
                  title={`${inst.name} prospectus`}
                  value={inst.prospectusUrl ? { url: inst.prospectusUrl, title: 'Current prospectus', kind: 'pdf' } : null}
                  onUploaded={d => patch({ prospectusUrl: d.url }, 'Prospectus uploaded.')}
                  onCleared={() => patch({ prospectusUrl: null }, 'Prospectus removed.')} />

                {data.documents.length > 0 && (
                  <>
                    <h3 style={{ margin: '24px 0 10px', fontSize: 14 }}>Everything filed against this listing</h3>
                    <div className="adm-minilist">
                      {data.documents.map(d => (
                        <div key={d.id} className="adm-minirow">
                          <div><b>{d.title}</b><small>{d.purpose} · {d.fileName} · uploaded by {d.uploadedBy}</small></div>
                          <a className="adm-btn sm" href={d.url} target="_blank" rel="noreferrer"><IconEye /></a>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'reviews' && (
              <>
                <p className="adm-more-note" style={{ marginTop: 0 }}>
                  Reviews written about this listing. Publishing one shows it here, on the listing
                  card’s rating, and on the main reviews page — the same record in all three places.
                </p>
                {data.reviews.length === 0 && <div className="adm-empty" style={{ padding: 32 }}><IconStar /><h3>No reviews yet</h3></div>}
                <div className="adm-minilist">
                  {data.reviews.map(r => (
                    <div key={r.id} className="adm-minirow">
                      <div>
                        <b>{r.name} — {r.rating}/5{r.courseName ? ` · ${r.courseName}` : ''}</b>
                        <small>{r.text.slice(0, 140)}{r.text.length > 140 ? '…' : ''}</small>
                      </div>
                      <span className={`adm-pill s-${r.status === 'published' ? 'active' : r.status === 'pending' ? 'new' : 'inactive'}`}>{r.status}</span>
                      {r.status !== 'published'
                        ? <button className="adm-btn sm" onClick={() => moderate(r, 'published')} disabled={busy}>Publish</button>
                        : <button className="adm-btn sm ghost" onClick={() => moderate(r, 'rejected')} disabled={busy}>Hide</button>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="adm-panel adm-side" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Publishing</h3>
            <span className={`adm-pill s-${live ? 'active' : 'inactive'}`} style={{ marginBottom: 12 }}>
              {inst.isActive === false ? 'Retired' : live ? 'Published' : 'Draft'}
            </span>
            <ul className="adm-checklist">
              {data.checklist.ready && !data.checklist.warnings.length && (
                <li className="ok"><IconCheck />Nothing missing.</li>
              )}
              {data.checklist.blocking.map(b => <li key={b} className="bad"><IconAlert />{b}</li>)}
              {data.checklist.warnings.map(w => <li key={w}><IconAlert />{w}</li>)}
            </ul>
            {!live && (
              <button className="adm-btn pri" style={{ width: '100%', marginTop: 14 }}
                onClick={() => publish(false)} disabled={busy}>Publish listing</button>
            )}
            {!live && data.checklist.blocking.length > 0 && (
              <button className="adm-btn" style={{ width: '100%', marginTop: 8 }}
                onClick={() => publish(true)} disabled={busy}>Publish anyway</button>
            )}

            <h3 style={{ fontSize: 13, margin: '22px 0 8px' }}>Applications</h3>
            <dl className="adm-dl">
              <div><dt>In pipeline</dt><dd>{data.pipeline?.inPipeline ?? 0}</dd></div>
              <div><dt>Total</dt><dd>{data.admissions?.length ?? 0}</dd></div>
              <div><dt>DCW reviews</dt><dd>{data.reviewSummary?.count ?? 0}</dd></div>
              <div><dt>Average</dt><dd>{data.reviewSummary?.average ?? '—'}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}
