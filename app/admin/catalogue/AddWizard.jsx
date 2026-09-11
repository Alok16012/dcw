'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/admin-client.js';
import FileField from '../FileField.jsx';
import { IconClose, IconAlert, IconCheck, IconTrash, IconPlus, IconShield, IconPin } from '../icons.jsx';

/** Label + control + error. Hoisted to module scope on purpose: a component
 *  declared inside the render body is a fresh type each pass, which remounts
 *  every input it wraps and drops the caret after a single keystroke. */
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

const STEPS = [
  { key: 'basics', label: 'Basics', blurb: 'Who they are and where.' },
  { key: 'courses', label: 'Courses & fees', blurb: 'What a student can apply for, and what it costs.' },
  { key: 'approvals', label: 'Recognition', blurb: 'The approval the listing rests on.' },
  { key: 'evidence', label: 'Prospectus & map', blurb: 'The official PDF and the Google location.' },
  { key: 'review', label: 'Review', blurb: 'Read it back, then publish.' }
];

const blankInst = {
  name: '', vertical: 'distance', type: 'Private University', city: '', state: '',
  established: '', plainSummary: '', description: ''
};

const blankCourse = {
  name: '', level: 'UG', stream: 'General', mode: 'Online',
  durationMonths: 36, totalFee: '', eligibility: '10+2 from a recognised board'
};

const blankApproval = { body: '', grade: '', scope: '', validTill: '', documentId: null, documentName: null };

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');

/**
 * The guided "add a college" flow (client requirements 5 and 6).
 *
 * The record is created as a DRAFT at the end of step one rather than at the
 * end of the wizard. Two reasons, both practical: courses, certificates and the
 * prospectus all have to be filed against an institution id, so batching them
 * would mean holding uploads in the browser and replaying them; and a wizard
 * abandoned halfway leaves a resumable draft in the list instead of losing
 * twenty minutes of typing. A draft is invisible to the public site — the
 * listing only goes live from the final step, after the checklist is read.
 */
export default function AddWizard({ enums, onClose, onPublished }) {
  const [step, setStep] = useState(0);
  const [inst, setInst] = useState(null);          // the draft, once created
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);

  const [basics, setBasics] = useState(blankInst);
  const [course, setCourse] = useState(blankCourse);
  const [courses, setCourses] = useState([]);
  const [approval, setApproval] = useState(blankApproval);
  const [approvals, setApprovals] = useState([]);
  const [prospectus, setProspectus] = useState(null);
  const [google, setGoogle] = useState({ placeId: '', mapsUrl: '', address: '', lat: '', lng: '' });
  const [checklist, setChecklist] = useState(null);

  const levels = enums?.levels ?? ['10th', '12th', 'Diploma', 'UG', 'PG'];
  const modes = enums?.modes ?? ['Online', 'Distance', 'Regular'];

  const setB = (k, v) => {
    setBasics(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  function handle(e) {
    if (e instanceof ApiError && e.errors) {
      setErrors(e.errors);
      setFailure('Some fields need attention before this can be saved.');
    } else {
      setFailure(e.message);
    }
  }

  /** Step 1 → create the draft, or save edits to it if the user came back. */
  async function saveBasics() {
    setBusy(true); setFailure(null); setErrors({});
    const payload = {
      ...basics,
      established: basics.established === '' ? undefined : Number(basics.established)
    };
    try {
      const d = inst
        ? await api(`/admin/institutions/${inst.id}`, { method: 'PATCH', body: payload })
        : await api('/admin/institutions', { method: 'POST', body: payload });
      setInst(d.institution);
      setStep(1);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function addCourse() {
    setBusy(true); setFailure(null); setErrors({});
    try {
      const d = await api(`/admin/institutions/${inst.id}`, {
        method: 'POST',
        body: { ...course, totalFee: Number(course.totalFee), durationMonths: Number(course.durationMonths) }
      });
      setCourses(c => [...c, d.course]);
      setCourse(blankCourse);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function dropCourse(c) {
    setBusy(true);
    try {
      await api(`/admin/institutions/${inst.id}/courses/${c.id}?hard=true`, { method: 'DELETE' });
      setCourses(list => list.filter(x => x.id !== c.id));
    } catch (e) { handle(e); }
    setBusy(false);
  }

  /** Approvals are one array on the record, so adding a row rewrites the list. */
  async function saveApprovals(next) {
    setBusy(true); setFailure(null);
    try {
      const d = await api(`/admin/institutions/${inst.id}`, { method: 'PATCH', body: { approvals: next } });
      setInst(d.institution);
      setApprovals(d.institution.approvals);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function addApproval() {
    if (!approval.body.trim()) { setErrors({ body: 'Name the body that recognises them.' }); return; }
    setErrors({});
    await saveApprovals([...approvals, approval]);
    setApproval(blankApproval);
  }

  async function saveEvidence() {
    setBusy(true); setFailure(null);
    try {
      const body = { google: { ...google } };
      if (prospectus) body.prospectusUrl = prospectus.url;
      const d = await api(`/admin/institutions/${inst.id}`, { method: 'PATCH', body });
      setInst(d.institution);
      const full = await api(`/admin/institutions/${d.institution.id}`);
      setChecklist(full.checklist);
      setInst(full.institution);
      setStep(4);
    } catch (e) { handle(e); }
    setBusy(false);
  }

  async function publish(force = false) {
    setBusy(true); setFailure(null);
    try {
      const d = await api(`/admin/institutions/${inst.id}/publish${force ? '?force=true' : ''}`, { method: 'POST' });
      onPublished(d.institution);
      return;
    } catch (e) {
      if (e.status === 409) { setChecklist(e.payload?.checklist ?? null); setFailure(e.message); }
      else handle(e);
    }
    setBusy(false);
  }

  const liveCourses = courses.filter(c => c.isActive !== false);

  return (
    <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-drawer wide" role="dialog" aria-modal="true" aria-label="Add a college">
        <div className="adm-drawer-head">
          <h2>Add a college or university</h2>
          <button type="button" className="adm-btn ghost sm" onClick={onClose} aria-label="Close"><IconClose /></button>
        </div>

        <ol className="adm-steps" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
              <span>{i < step ? <IconCheck /> : i + 1}</span>{s.label}
            </li>
          ))}
        </ol>

        <div className="adm-drawer-body">
          <p className="adm-step-blurb">{STEPS[step].blurb}</p>
          {failure && <div className="adm-note bad" style={{ marginBottom: 16 }}><IconAlert />{failure}</div>}

          {step === 0 && (
            <>
              <Field error={errors.name} label="Name *">
                <input value={basics.name} onChange={e => setB('name', e.target.value)}
                  placeholder="e.g. Amity University Online" autoFocus />
              </Field>
              <div className="adm-row">
                <Field error={errors.vertical} label="Which site does it belong on? *">
                  <select value={basics.vertical} onChange={e => setB('vertical', e.target.value)}>
                    <option value="distance">Distance Courses Wala</option>
                    <option value="colleges">Colleges Wala</option>
                  </select>
                </Field>
                <Field error={errors.type} label="Type *" hint="Shown under the name on the card.">
                  <input value={basics.type} onChange={e => setB('type', e.target.value)}
                    placeholder="e.g. Private University" />
                </Field>
              </div>
              <div className="adm-row">
                <Field error={errors.city} label="City *">
                  <input value={basics.city} onChange={e => setB('city', e.target.value)} placeholder="e.g. Noida" />
                </Field>
                <Field error={errors.state} label="State">
                  <input value={basics.state} onChange={e => setB('state', e.target.value)} placeholder="e.g. Uttar Pradesh" />
                </Field>
              </div>
              <Field error={errors.established} label="Established" hint="Four-digit year. Leave blank if you are unsure.">
                <input type="number" min="1800" max="2100" value={basics.established}
                  onChange={e => setB('established', e.target.value)} placeholder="2009" />
              </Field>
              <Field error={errors.plainSummary} label="One line, in plain words *"
                hint="The sentence a 10th-pass student reads first. No jargon, no marketing.">
                <textarea value={basics.plainSummary} onChange={e => setB('plainSummary', e.target.value)}
                  placeholder="e.g. A UGC-approved online university. You can study from home and sit exams online." />
              </Field>
              <Field error={errors.description} label="Longer description"
                hint="For someone comparing two listings. Optional now, expected before publishing.">
                <textarea value={basics.description} onChange={e => setB('description', e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              {liveCourses.length > 0 && (
                <div className="adm-minilist">
                  {liveCourses.map(c => (
                    <div key={c.id} className="adm-minirow">
                      <div>
                        <b>{c.name}</b>
                        <small>{c.level} · {c.mode} · {c.durationMonths} months · {money(c.totalFee)}</small>
                      </div>
                      <button type="button" className="adm-btn sm ghost" onClick={() => dropCourse(c)}
                        disabled={busy} aria-label={`Remove ${c.name}`}><IconTrash /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="adm-subform">
                <Field error={errors.name} label="Course name *">
                  <input value={course.name} onChange={e => setCourse(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. BBA" />
                </Field>
                <div className="adm-row">
                  <Field error={errors.level} label="Level">
                    <select value={course.level} onChange={e => setCourse(p => ({ ...p, level: e.target.value }))}>
                      {levels.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field error={errors.mode} label="Mode">
                    <select value={course.mode} onChange={e => setCourse(p => ({ ...p, mode: e.target.value }))}>
                      {modes.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="adm-row">
                  <Field error={errors.durationMonths} label="Duration (months)">
                    <input type="number" min="1" value={course.durationMonths}
                      onChange={e => setCourse(p => ({ ...p, durationMonths: e.target.value }))} />
                  </Field>
                  <Field error={errors.totalFee} label="Total fee (₹) *" hint="The whole programme, not one year.">
                    <input type="number" min="0" step="500" value={course.totalFee}
                      onChange={e => setCourse(p => ({ ...p, totalFee: e.target.value }))} placeholder="165000" />
                  </Field>
                </div>
                <Field error={errors.eligibility} label="Who can apply"
                  hint="Written for the student. “12th pass, any stream” beats “10+2 qualified”.">
                  <input value={course.eligibility}
                    onChange={e => setCourse(p => ({ ...p, eligibility: e.target.value }))} />
                </Field>
                <button type="button" className="adm-btn" onClick={addCourse} disabled={busy || !course.name.trim()}>
                  <IconPlus />Add this course
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="adm-more-note" style={{ marginTop: 0 }}>
                This is the claim the whole listing rests on — UGC-DEB, AICTE, NAAC, a state
                affiliation. Upload the letter itself where you have it: a recognition nobody can
                open is a recognition a student has to take on trust.
              </p>

              {approvals.length > 0 && (
                <div className="adm-minilist">
                  {approvals.map((a, i) => (
                    <div key={`${a.body}-${i}`} className="adm-minirow">
                      <div>
                        <b><IconShield style={{ width: 15, height: 15, verticalAlign: '-3px' }} /> {a.body}{a.grade ? ` — ${a.grade}` : ''}</b>
                        <small>{a.documentName ? `Certificate: ${a.documentName}` : 'No certificate uploaded'}{a.validTill ? ` · valid to ${a.validTill}` : ''}</small>
                      </div>
                      <button type="button" className="adm-btn sm ghost" disabled={busy}
                        onClick={() => saveApprovals(approvals.filter((_, j) => j !== i))}
                        aria-label={`Remove ${a.body}`}><IconTrash /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="adm-subform">
                <div className="adm-row">
                  <Field error={errors.body} label="Approving body *">
                    <input value={approval.body} onChange={e => setApproval(p => ({ ...p, body: e.target.value }))}
                      placeholder="e.g. UGC-DEB" />
                  </Field>
                  <Field label="Grade or entitlement">
                    <input value={approval.grade} onChange={e => setApproval(p => ({ ...p, grade: e.target.value }))}
                      placeholder="e.g. A+ / Entitled" />
                  </Field>
                </div>
                <div className="adm-row">
                  <Field label="What it covers" hint="Leave blank if it covers the institution as a whole.">
                    <input value={approval.scope} onChange={e => setApproval(p => ({ ...p, scope: e.target.value }))}
                      placeholder="e.g. Online MBA only" />
                  </Field>
                  <Field label="Valid until">
                    <input type="date" value={approval.validTill}
                      onChange={e => setApproval(p => ({ ...p, validTill: e.target.value }))} />
                  </Field>
                </div>
                <FileField
                  label="Approval letter or certificate"
                  purpose="approval" institutionId={inst?.id}
                  title={approval.body || 'Approval certificate'}
                  value={approval.documentId ? { url: `/api/documents/${approval.documentId}`, title: approval.documentName, kind: 'pdf' } : null}
                  onUploaded={d => setApproval(p => ({ ...p, documentId: d.id, documentName: d.fileName, certificateUrl: d.url }))}
                  onCleared={() => setApproval(p => ({ ...p, documentId: null, documentName: null, certificateUrl: null }))}
                  hint="Optional, but it is the difference between a claim and proof."
                />
                <button type="button" className="adm-btn" onClick={addApproval} disabled={busy || !approval.body.trim()}>
                  <IconPlus />Add this approval
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <FileField
                label="Prospectus"
                purpose="prospectus" institutionId={inst?.id}
                title={`${inst?.name ?? ''} prospectus`}
                value={prospectus}
                onUploaded={setProspectus}
                onCleared={() => setProspectus(null)}
                hint="The PDF the university already publishes. Students download it straight from the listing."
              />

              <h3 style={{ margin: '20px 0 10px', fontSize: 14 }}>
                <IconPin style={{ width: 16, height: 16, verticalAlign: '-3px' }} /> Google location
              </h3>
              <p className="adm-more-note">
                Paste the Place ID from Google Maps, or the share link. The detail page uses it for
                the map and, when a Maps API key is configured, for the Google rating — which is
                shown beside DCW’s own reviews, never blended into them.
              </p>
              <Field label="Google Place ID">
                <input value={google.placeId} onChange={e => setGoogle(p => ({ ...p, placeId: e.target.value }))}
                  placeholder="ChIJ…" />
              </Field>
              <Field label="Google Maps link" hint="Used as the “open in Maps” link when there is no Place ID.">
                <input value={google.mapsUrl} onChange={e => setGoogle(p => ({ ...p, mapsUrl: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/…" />
              </Field>
              <Field label="Address">
                <input value={google.address} onChange={e => setGoogle(p => ({ ...p, address: e.target.value }))} />
              </Field>
              <div className="adm-row">
                <Field label="Latitude">
                  <input type="number" step="any" value={google.lat}
                    onChange={e => setGoogle(p => ({ ...p, lat: e.target.value }))} placeholder="28.5355" />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="any" value={google.lng}
                    onChange={e => setGoogle(p => ({ ...p, lng: e.target.value }))} placeholder="77.3910" />
                </Field>
              </div>
            </>
          )}

          {step === 4 && inst && (
            <>
              <div className="adm-preview">
                <div className="adm-preview-card">
                  <span className="mark">{inst.mark}</span>
                  <div>
                    <b>{inst.name}</b>
                    <small>{[inst.city, inst.state].filter(Boolean).join(', ')} · {inst.type}</small>
                    <p>{inst.plainSummary || inst.description || 'No summary yet.'}</p>
                    <div className="tags">
                      <span>{liveCourses.length} course{liveCourses.length === 1 ? '' : 's'}</span>
                      {liveCourses.length > 0 && <span>from {money(Math.min(...liveCourses.map(c => c.totalFee)))}</span>}
                      {approvals.slice(0, 2).map(a => <span key={a.body}>{a.body}</span>)}
                    </div>
                  </div>
                </div>
                <small className="adm-preview-note">This is roughly how the listing card will read on the public site.</small>
              </div>

              <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Before it goes live</h3>
              <ul className="adm-checklist">
                {checklist?.ready && !checklist.warnings.length && (
                  <li className="ok"><IconCheck />Everything a student looks for is filled in.</li>
                )}
                {(checklist?.blocking ?? []).map(b => <li key={b} className="bad"><IconAlert />{b}</li>)}
                {(checklist?.warnings ?? []).map(w => <li key={w}><IconAlert />{w}</li>)}
              </ul>
              <p className="adm-more-note" style={{ marginTop: 14 }}>
                Saving as a draft keeps everything you have entered and leaves the listing off the
                public site. You can finish it from the catalogue list at any time.
              </p>
            </>
          )}
        </div>

        <div className="adm-drawer-foot">
          {step > 0
            ? <button type="button" className="adm-btn" onClick={() => { setFailure(null); setStep(s => s - 1); }} disabled={busy}>Back</button>
            : <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>}

          {step === 0 && (
            <button type="button" className="adm-btn pri" onClick={saveBasics} disabled={busy || !basics.name.trim()}>
              {busy ? 'Saving…' : 'Save and continue'}
            </button>
          )}
          {(step === 1 || step === 2) && (
            <button type="button" className="adm-btn pri" onClick={() => { setFailure(null); setErrors({}); setStep(s => s + 1); }} disabled={busy}>
              Continue
            </button>
          )}
          {step === 3 && (
            <button type="button" className="adm-btn pri" onClick={saveEvidence} disabled={busy}>
              {busy ? 'Saving…' : 'Review'}
            </button>
          )}
          {step === 4 && (
            <>
              <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>Save as draft</button>
              <button type="button" className="adm-btn pri" onClick={() => publish(false)} disabled={busy}>
                {busy ? 'Publishing…' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
