'use client';
import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTop, useToast, useRefreshCounts } from '../AdminShell.jsx';
import { api, ApiError, fmtWhen, pillClass } from '@/lib/admin-client.js';
import { IconSearch, IconEmpty, IconAlert, IconPlus, IconCheck, IconClose } from '../icons.jsx';

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

const blankStudent = {
  name: '', phone: '', email: '', city: '', qualification: '',
  vertical: 'distance', institutionId: '', courses: [], branch: '',
  counsellor: '', status: 'Applied'
};

/** Hoisted: a component declared inside the render body remounts its inputs on
 *  every keystroke, which costs the field its focus. */
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

/**
 * Courses, more than one at a time.
 *
 * A native `<select multiple>` is the obvious answer and the wrong one: on a
 * phone it collapses to a picker that gives no indication more than one choice
 * is allowed, and on a desktop it needs a held modifier key nobody discovers.
 * Checkboxes say what they do, and "Select all" is one tap rather than five.
 *
 * Each ticked course becomes its own file in the pipeline — see the note on
 * POST /api/admin/admissions — so the count is shown, not hidden.
 */
function CoursePicker({ courses, value, onChange, disabled, error }) {
  const all = courses.map(c => c.name);
  const everySelected = all.length > 0 && all.every(n => value.includes(n));
  const toggle = name => onChange(value.includes(name) ? value.filter(v => v !== name) : [...value, name]);

  return (
    <div className={`adm-multi${error ? ' bad' : ''}`}>
      <div className="adm-multi-head">
        <span>{value.length ? `${value.length} selected` : 'No course selected'}</span>
        <button type="button" className="adm-btn sm ghost" disabled={disabled || !all.length}
          onClick={() => onChange(everySelected ? [] : all)}>
          {everySelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      {all.length === 0
        ? <p className="adm-multi-empty">Choose an institution first — its live courses appear here.</p>
        : (
          <div className="adm-multi-list">
            {courses.map(c => (
              <label key={c.id} className={`adm-multi-opt${value.includes(c.name) ? ' on' : ''}`}>
                <input type="checkbox" checked={value.includes(c.name)} disabled={disabled}
                  onChange={() => toggle(c.name)} />
                <span>
                  <b>{c.name}</b>
                  <small>{[c.level, c.stream, c.totalFee ? money(c.totalFee) : null].filter(Boolean).join(' · ')}</small>
                </span>
              </label>
            ))}
          </div>
        )}
      {error && <em className="err">{error}</em>}
    </div>
  );
}

/**
 * The counselling pipeline, by student.
 *
 * Its recruiting counterpart is Candidates. This screen exists because the only
 * view of an admission used to be the per-listing tab inside the catalogue
 * editor, so answering "where is this student up to" meant knowing which
 * university they had applied to first.
 */
function StudentsInner() {
  const toast = useToast();
  const refreshCounts = useRefreshCounts();
  const params = useSearchParams();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [branch, setBranch] = useState('');
  const [institutionId, setInstitutionId] = useState(params.get('institutionId') || '');
  const [vertical, setVertical] = useState('');

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blankStudent);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const s = new URLSearchParams();
    if (q) s.set('q', q);
    if (status) s.set('status', status);
    if (branch) s.set('branch', branch);
    if (institutionId) s.set('institutionId', institutionId);
    if (vertical) s.set('vertical', vertical);
    try { setData(await api(`/admin/admissions?${s}`)); setErr(null); }
    catch (e) {
      setErr(e.status === 403 ? 'Student files are visible to DCW admins only.' : e.message);
    }
  }, [q, status, branch, institutionId, vertical]);

  useEffect(() => { const t = setTimeout(load, q ? 220 : 0); return () => clearTimeout(t); }, [load, q]);

  const rows = data?.rows ?? [];
  const institutions = data?.institutions ?? [];
  const chosen = useMemo(
    () => institutions.find(i => i.id === form.institutionId) ?? null,
    [institutions, form.institutionId]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  /* Changing institution clears the courses: the names belong to the old one and
     would file against a university the student never picked. The vertical
     follows the listing, because that is where the fee book and the CRM split. */
  function pickInstitution(id) {
    const inst = institutions.find(i => i.id === id);
    setForm(p => ({ ...p, institutionId: id, courses: [], vertical: inst?.vertical ?? p.vertical }));
  }

  /* The branch is the stream of the first course chosen, unless somebody has
     typed over it. Shown rather than inferred silently, so the value that ends
     up on the record is the value on screen. */
  const suggestedBranch = chosen && form.courses.length
    ? chosen.courses.find(c => c.name === form.courses[0])?.stream ?? ''
    : '';
  const branchValue = form.branch || suggestedBranch;

  async function submit() {
    setBusy(true); setErrors({});
    try {
      const d = await api('/admin/admissions', {
        method: 'POST',
        body: { ...form, branch: branchValue || null, counsellor: form.counsellor || null }
      });
      const skipped = (d.skipped ?? []).filter(s => s.duplicate).length;
      toast(`${d.created.length} file${d.created.length === 1 ? '' : 's'} created`
        + (skipped ? ` · ${skipped} already on record` : '') + '.');
      setForm(blankStudent);
      setAdding(false);
      await load();
      refreshCounts();
    } catch (e) {
      if (e instanceof ApiError && e.errors) { setErrors(e.errors); toast('Check the highlighted fields.', 'bad'); }
      else if (e.status === 409) toast('This student is already on file for every course selected.', 'bad');
      else toast(e.message, 'bad');
    }
    setBusy(false);
  }

  const stats = data?.pipeline;
  const chip = (label, value, n) => (
    <button key={label} className={`adm-chip${status === value ? ' on' : ''}`}
      onClick={() => setStatus(status === value ? '' : value)} aria-pressed={status === value}>
      {label}<span>{n}</span>
    </button>
  );
  const filtering = !!(q || status || branch || institutionId || vertical);

  return (
    <>
      <PageTop title="Students" sub="Everyone in the counselling pipeline, the branch they are on, and where their file stands.">
        <button className="adm-btn pri" onClick={() => setAdding(a => !a)} aria-expanded={adding}>
          {adding ? <><IconClose />Close</> : <><IconPlus />Add student</>}
        </button>
      </PageTop>

      <div className="adm-body">
        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {adding && (
          <div className="adm-panel" style={{ padding: 20, marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Add a student</h2>
            <p className="adm-more-note">
              One file per course. Tick several and the student enters the pipeline once for each,
              with its own stage and its own fee schedule — the same as applying on the public site.
            </p>
            <div className="adm-row">
              <Field error={errors.name} label="Full name *">
                <input value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
              </Field>
              <Field error={errors.phone} label="Mobile *" hint="Ten digits. This is what identifies the student.">
                <input value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.email} label="Email">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field error={errors.city} label="City">
                <input value={form.city} onChange={e => set('city', e.target.value)} />
              </Field>
            </div>
            <div className="adm-row">
              <Field error={errors.qualification} label="Qualification">
                <select value={form.qualification} onChange={e => set('qualification', e.target.value)}>
                  <option value="">Not stated</option>
                  {(data?.qualifications ?? []).map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Counsellor">
                <select value={form.counsellor} onChange={e => set('counsellor', e.target.value)}>
                  <option value="">Unassigned</option>
                  {(data?.counsellors ?? []).map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field error={errors.institutionId} label="Institution">
              <select value={form.institutionId} onChange={e => pickInstitution(e.target.value)}>
                <option value="">Not decided yet</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Field>
            <Field error={errors.course} label="Courses applied to">
              <CoursePicker courses={chosen?.courses ?? []} value={form.courses} disabled={busy}
                onChange={v => set('courses', v)} />
            </Field>
            <div className="adm-row">
              <Field label="Branch" hint={suggestedBranch ? `Taken from the course: ${suggestedBranch}.` : 'From the course, or set it by hand.'}>
                <select value={branchValue} onChange={e => set('branch', e.target.value)}>
                  <option value="">Not stated</option>
                  {(data?.branches ?? []).map(b => <option key={b}>{b}</option>)}
                  {branchValue && !(data?.branches ?? []).includes(branchValue) && <option>{branchValue}</option>}
                </select>
              </Field>
              <Field label="Starting stage" hint="Anything past Applied is logged as history on the file.">
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {(data?.stages ?? ['Applied']).map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="adm-course-actions">
              <button className="adm-btn pri" onClick={submit}
                disabled={busy || !form.name.trim() || !form.phone.trim()}>
                {busy ? 'Filing…' : <><IconCheck />Add student</>}
              </button>
              <button className="adm-btn" onClick={() => { setAdding(false); setErrors({}); }} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}

        {stats && (
          <div className="adm-stats">
            <div className="adm-stat lead"><small>In pipeline</small><b>{stats.inPipeline}</b><i>files still moving</i></div>
            <div className="adm-stat"><small>Enrolled</small><b>{stats.enrolled}</b><i>admission confirmed</i></div>
            <div className="adm-stat"><small>Total students</small><b>{stats.total}</b><i>every file on record</i></div>
            <div className="adm-stat"><small>Conversion</small><b>{stats.conversion}%</b><i>applied to enrolled</i></div>
          </div>
        )}

        {stats && (
          <div className="adm-chips" role="group" aria-label="Filter by stage">
            {chip('All', '', stats.total)}
            {(data?.statuses ?? []).map(s => chip(s, s, stats.byStatus[s] || 0))}
          </div>
        )}

        <div className="adm-filters">
          <span className="adm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
            <IconSearch style={{ width: 16, height: 16, color: 'var(--ink-3)', flex: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="Search students"
              placeholder="Search name, phone, email, course or branch"
              style={{ border: 0, outline: 0, background: 'none', padding: 0, minHeight: 36, flex: 1, width: '100%' }} />
          </span>
          <select value={branch} onChange={e => setBranch(e.target.value)} aria-label="Filter by branch">
            <option value="">All branches</option>
            {(data?.branches ?? []).map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={institutionId} onChange={e => setInstitutionId(e.target.value)} aria-label="Filter by institution">
            <option value="">All institutions</option>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <select value={vertical} onChange={e => setVertical(e.target.value)} aria-label="Filter by vertical">
            <option value="">Both sites</option>
            <option value="distance">Distance Courses Wala</option>
            <option value="colleges">Colleges Wala</option>
          </select>
        </div>

        {!data && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {data && rows.length === 0 && (
          <div className="adm-panel">
            <div className="adm-empty">
              <IconEmpty />
              <h3>{filtering ? 'No students match' : 'No students yet'}</h3>
              <p>{filtering
                ? 'Try a different stage or branch, or clear the filters.'
                : 'Anyone who applies for a course on the public site lands here within the same second.'}</p>
              {filtering && (
                <button className="adm-btn" onClick={() => {
                  setQ(''); setStatus(''); setBranch(''); setInstitutionId(''); setVertical('');
                }}>Clear filters</button>
              )}
            </div>
          </div>
        )}

        {data && rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Student</th><th>Branch</th><th>Course</th><th>Contact</th>
                  <th>Stage</th><th className="adm-num">Fee due</th><th>Counsellor</th><th>Applied</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.name}</b>
                      <span className="adm-sub">{a.city || '—'} · {a.qualification || 'Not stated'}</span>
                    </td>
                    {/* The branch, which is the whole reason this column exists: a
                        counsellor sorting by subject should not have to open each
                        file to find out what subject it is. */}
                    <td>{a.branch
                      ? <span className="adm-pill s-new">{a.branch}</span>
                      : <span style={{ color: 'var(--ink-3)' }}>—</span>}</td>
                    <td>
                      {a.course || '—'}
                      <span className="adm-sub">{a.institutionName || '—'}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <a href={`tel:${a.phone}`}>{a.phone}</a>
                      {a.email && <span className="adm-sub">{a.email}</span>}
                    </td>
                    <td><span className={pillClass(a.status)}>{a.status}</span></td>
                    <td className="adm-num">
                      {a.fee ? money(a.fee.outstanding) : '—'}
                      {a.fee && <span className="adm-sub">of {money(a.fee.totalFee)}</span>}
                    </td>
                    <td>{a.counsellor || '—'}</td>
                    <td style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{fmtWhen(a.appliedAt)}</td>
                    <td>
                      <div className="adm-actions">
                        <Link className="adm-btn sm pri" href={`/admin/students/${a.id}`}>Open</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function StudentsPage() {
  return <Suspense fallback={null}><StudentsInner /></Suspense>;
}
