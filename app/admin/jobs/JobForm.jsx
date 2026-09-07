'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/admin-client.js';
import { IconClose, IconAlert } from '../icons.jsx';

/** Label + control + error, hoisted to module scope on purpose: a component
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

/** The optional fields that live behind the disclosure below. */
const MORE_FIELDS = ['city', 'area', 'lat', 'lng', 'eligibility', 'roleType', 'tags', 'deadlineLabel'];

const blank = {
  title: '', companyId: '', companyName: '', location: '', wfh: false,
  salaryMin: '', salaryMax: '', qualification: 'Any', experienceMin: 0,
  jobType: 'Full-time', industry: '', openings: 1, jd: '', expiresOn: '', featured: false,
  // Optional. Each one is derived on the public listing when it is left empty,
  // which is why none of them is required and why the hints say what the
  // fallback will be rather than just describing the field.
  city: '', area: '', lat: '', lng: '', eligibility: '', roleType: '',
  tags: '', deadlineLabel: ''
};

/** Create/edit drawer. The same form serves both so the field rules, the
 *  error mapping and the salary units can never drift apart between them. */
export default function JobForm({ job, companies, enums, canPickCompany, onClose, onSaved }) {
  const editing = Boolean(job);
  const [v, setV] = useState(() => (job
    ? {
        ...blank, ...job,
        expiresOn: job.expiresOn ? String(job.expiresOn).slice(0, 10) : '',
        companyName: '',
        // Absent optional keys must become '' rather than undefined, or the
        // inputs they feed switch from controlled to uncontrolled mid-edit.
        city: job.city ?? '', area: job.area ?? '',
        lat: job.lat ?? '', lng: job.lng ?? '',
        eligibility: job.eligibility ?? '', roleType: job.roleType ?? '',
        deadlineLabel: job.deadlineLabel ?? '',
        tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags ?? '')
      }
    : blank));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const [newCompany, setNewCompany] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const set = (k, val) => {
    setV(p => ({ ...p, [k]: val }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setFailure(null); setErrors({});
    const payload = {
      title: v.title.trim(),
      location: v.location.trim(),
      wfh: v.wfh,
      salaryMin: Number(v.salaryMin),
      salaryMax: Number(v.salaryMax),
      qualification: v.qualification,
      experienceMin: Number(v.experienceMin) || 0,
      jobType: v.jobType,
      industry: v.industry.trim() || undefined,
      openings: Number(v.openings) || 1,
      jd: v.jd.trim() || undefined,
      expiresOn: v.expiresOn || undefined,
      featured: v.featured,
      // Sent as '' rather than undefined when cleared: on a PATCH an empty
      // value removes the stored field, while undefined would leave it as it
      // was and make the field look un-clearable.
      city: v.city.trim(), area: v.area.trim(),
      lat: String(v.lat).trim(), lng: String(v.lng).trim(),
      eligibility: v.eligibility.trim(), roleType: v.roleType.trim(),
      deadlineLabel: v.deadlineLabel.trim(), tags: v.tags.trim()
    };
    if (canPickCompany) {
      if (newCompany) payload.companyName = v.companyName.trim();
      else payload.companyId = v.companyId;
    }
    try {
      const d = editing
        ? await api(`/admin/jobs/${job.id}`, { method: 'PATCH', body: payload })
        : await api('/admin/jobs', { method: 'POST', body: payload });
      onSaved(d.job, editing);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
        // A validation error inside a collapsed disclosure is an error nobody
        // can see: the banner says something needs attention and every visible
        // field looks fine. Open it when the problem is in there.
        if (MORE_FIELDS.some(k => err.errors[k])) setShowMore(true);
        setFailure('Some fields need attention before this can be saved.');
      } else {
        setFailure(err.message);
      }
      setBusy(false);
    }
  }

  return (
    <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-drawer" role="dialog" aria-modal="true" aria-label={editing ? 'Edit job' : 'Post a job'}>
        <form onSubmit={submit}>
          <div className="adm-drawer-head">
            <h2>{editing ? 'Edit posting' : 'Post a job'}</h2>
            <button type="button" className="adm-btn ghost sm" onClick={onClose} aria-label="Close"><IconClose /></button>
          </div>

          <div className="adm-drawer-body">
            {failure && <div className="adm-note bad" style={{ marginBottom: 16 }}><IconAlert />{failure}</div>}

            <Field error={errors.title} label="Job title *">
              <input value={v.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Field Sales Executive" required />
            </Field>

            {canPickCompany && (
              <Field error={newCompany ? errors.companyName : errors.companyId} label="Company *">
                {newCompany ? (
                  <input value={v.companyName} onChange={e => set('companyName', e.target.value)}
                    placeholder="New company name" required />
                ) : (
                  <select value={v.companyId} onChange={e => set('companyId', e.target.value)} required>
                    <option value="">Select a company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button type="button" className="adm-btn ghost sm" style={{ marginTop: 7, paddingLeft: 0 }}
                  onClick={() => setNewCompany(n => !n)}>
                  {newCompany ? '← Pick an existing company' : '+ Add a company that is not listed'}
                </button>
              </Field>
            )}

            <div className="adm-row">
              <Field error={errors.location} label="Location *">
                <input value={v.location} onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Patna" required />
              </Field>
              <Field error={errors.industry} label="Industry">
                <input value={v.industry} onChange={e => set('industry', e.target.value)}
                  placeholder="e.g. Banking & finance" />
              </Field>
            </div>

            <div className="adm-check">
              <input type="checkbox" id="wfh" checked={!!v.wfh} onChange={e => set('wfh', e.target.checked)} />
              <label htmlFor="wfh">Work from home</label>
            </div>

            <div className="adm-row">
              <Field error={errors.salaryMin} label="Annual salary — minimum *" hint="Shown to candidates per month">
                <input type="number" min="0" step="1000" value={v.salaryMin}
                  onChange={e => set('salaryMin', e.target.value)} placeholder="216000" required />
              </Field>
              <Field error={errors.salaryMax} label="Annual salary — maximum *">
                <input type="number" min="0" step="1000" value={v.salaryMax}
                  onChange={e => set('salaryMax', e.target.value)} placeholder="312000" required />
              </Field>
            </div>

            <div className="adm-row">
              <Field error={errors.jobType} label="Job type">
                <select value={v.jobType} onChange={e => set('jobType', e.target.value)}>
                  {enums.jobTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field error={errors.qualification} label="Minimum qualification">
                <select value={v.qualification} onChange={e => set('qualification', e.target.value)}>
                  {enums.qualifications.map(q => <option key={q}>{q}</option>)}
                </select>
              </Field>
            </div>

            <div className="adm-row">
              <Field error={errors.experienceMin} label="Minimum experience (years)">
                <input type="number" min="0" step="1" value={v.experienceMin}
                  onChange={e => set('experienceMin', e.target.value)} />
              </Field>
              <Field error={errors.openings} label="Openings">
                <input type="number" min="1" step="1" value={v.openings}
                  onChange={e => set('openings', e.target.value)} />
              </Field>
            </div>

            <Field error={errors.expiresOn} label="Applications close on">
              <input type="date" value={v.expiresOn} onChange={e => set('expiresOn', e.target.value)} />
            </Field>

            <Field error={errors.jd} label="Job description">
              <textarea value={v.jd} onChange={e => set('jd', e.target.value)}
                placeholder="What the person will actually do, day to day." />
            </Field>

            <details className="adm-more" open={showMore}
              onToggle={e => setShowMore(e.currentTarget.open)}>
              <summary>Listing detail — city filter, map position, badges</summary>
              <p className="adm-more-note">
                All optional. The public listing derives a reasonable value for
                every one of these when it is left blank; fill one in only to
                override what it would work out on its own.
              </p>

              <div className="adm-row">
                <Field error={errors.city} label="City"
                  hint="The filter facet. Use “Remote” for work-from-home roles.">
                  <input value={v.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pune" />
                </Field>
                <Field error={errors.area} label="Locality" hint="Shown after the city.">
                  <input value={v.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Hinjewadi" />
                </Field>
              </div>

              <div className="adm-row">
                <Field error={errors.lat} label="Latitude"
                  hint="Both coordinates or neither. Used by “jobs near me”.">
                  <input type="number" step="any" min="-90" max="90" value={v.lat}
                    onChange={e => set('lat', e.target.value)} placeholder="18.5204" />
                </Field>
                <Field error={errors.lng} label="Longitude">
                  <input type="number" step="any" min="-180" max="180" value={v.lng}
                    onChange={e => set('lng', e.target.value)} placeholder="73.8567" />
                </Field>
              </div>

              <Field error={errors.eligibility} label="Eligibility, in words"
                hint={`Read by candidates. Derived from “${v.qualification}” when blank.`}>
                <input value={v.eligibility} onChange={e => set('eligibility', e.target.value)}
                  placeholder="e.g. 12th pass, freshers welcome" />
              </Field>

              <div className="adm-row">
                <Field error={errors.roleType} label="Role label" hint="Short function label.">
                  <input value={v.roleType} onChange={e => set('roleType', e.target.value)}
                    placeholder="e.g. Night shift" />
                </Field>
                <Field error={errors.deadlineLabel} label="Deadline text"
                  hint="Overrides the close date for walk-ins and rolling hiring.">
                  <input value={v.deadlineLabel} onChange={e => set('deadlineLabel', e.target.value)}
                    placeholder="e.g. Walk-in, Mon–Fri" />
                </Field>
              </div>

              <Field error={errors.tags} label="Badges" hint="Comma separated. Derived from the posting when blank.">
                <input value={v.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="Freshers welcome, Immediate joining" />
              </Field>
            </details>

            <div className="adm-check">
              <input type="checkbox" id="feat" checked={!!v.featured} onChange={e => set('featured', e.target.checked)} />
              <label htmlFor="feat">Feature this posting on the public site</label>
            </div>
          </div>

          <div className="adm-drawer-foot">
            <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn pri" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
