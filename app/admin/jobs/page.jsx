'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageTop, useSession, useToast, useRefreshCounts } from '../AdminShell.jsx';
import JobForm from './JobForm.jsx';
import { api, fmtSalary, fmtWhen, fmtDate } from '@/lib/admin-client.js';
import { IconPlus, IconSearch, IconEmpty, IconAlert, IconEdit, IconTrash } from '../icons.jsx';

function JobsInner() {
  const { session } = useSession();
  const toast = useToast();
  const refreshCounts = useRefreshCounts();
  const params = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);   // job object, or 'new'
  const [confirming, setConfirming] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    if (status) search.set('status', status);
    try { setData(await api(`/admin/jobs?${search}`)); setErr(null); }
    catch (e) { setErr(e.message); }
  }, [q, status]);

  useEffect(() => { const t = setTimeout(load, q ? 220 : 0); return () => clearTimeout(t); }, [load, q]);

  // Deep link from the dashboard's "Post a job" button.
  useEffect(() => {
    if (params.get('new') === '1') { setEditing('new'); router.replace('/admin/jobs'); }
  }, [params, router]);

  async function remove(job, hard) {
    setBusyId(job.id);
    try {
      await api(`/admin/jobs/${job.id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
      toast(hard ? `Deleted “${job.title}” permanently.` : `“${job.title}” is no longer public.`);
      setConfirming(null);
      await load();
      refreshCounts();
    } catch (e) { toast(e.message, 'bad'); }
    setBusyId(null);
  }

  async function toggle(job) {
    setBusyId(job.id);
    try {
      await api(`/admin/jobs/${job.id}`, { method: 'PATCH', body: { isActive: !job.isActive } });
      toast(job.isActive ? `“${job.title}” unpublished.` : `“${job.title}” is live again.`);
      await load();
      refreshCounts();
    } catch (e) { toast(e.message, 'bad'); }
    setBusyId(null);
  }

  const rows = data?.rows ?? [];
  const companyName = id => data?.companies.find(c => c.id === id)?.name ?? id;

  return (
    <>
      <PageTop title="Jobs"
        sub={session.role === 'employer'
          ? 'Postings for your company. Anything you publish appears on the public site straight away.'
          : 'Every posting across DCW. Publishing here updates the public listing immediately.'}>
        <button className="adm-btn pri" onClick={() => setEditing('new')}><IconPlus />Post a job</button>
      </PageTop>

      <div className="adm-body">
        {data && (
          <div className="adm-stats">
            <div className="adm-stat lead"><small>Live</small><b>{data.stats.active}</b><i>visible to candidates now</i></div>
            <div className="adm-stat"><small>Unpublished</small><b>{data.stats.inactive}</b><i>kept as drafts</i></div>
            <div className="adm-stat"><small>Total openings</small><b>{data.stats.openings}</b><i>seats across live postings</i></div>
            <div className="adm-stat"><small>Expiring soon</small><b>{data.stats.expiringSoon}</b><i>closing within 14 days</i></div>
          </div>
        )}

        <div className="adm-filters">
          <span className="adm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
            <IconSearch style={{ width: 16, height: 16, color: 'var(--ink-3)', flex: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, location or industry"
              aria-label="Search postings"
              style={{ border: 0, outline: 0, background: 'none', padding: 0, minHeight: 36, flex: 1, width: '100%' }} />
          </span>
          <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All postings</option>
            <option value="active">Live only</option>
            <option value="inactive">Unpublished only</option>
          </select>
          {(q || status) && <button className="adm-btn sm" onClick={() => { setQ(''); setStatus(''); }}>Clear</button>}
        </div>

        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {!data && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {data && rows.length === 0 && (
          <div className="adm-panel">
            <div className="adm-empty">
              <IconEmpty />
              <h3>{q || status ? 'Nothing matches that filter' : 'No postings yet'}</h3>
              <p>{q || status
                ? 'Try a broader search, or clear the filters to see everything.'
                : 'Publish your first vacancy and it will appear on the public jobs listing straight away.'}</p>
              {q || status
                ? <button className="adm-btn" onClick={() => { setQ(''); setStatus(''); }}>Clear filters</button>
                : <button className="adm-btn pri" onClick={() => setEditing('new')}><IconPlus />Post a job</button>}
            </div>
          </div>
        )}

        {data && rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Posting</th><th>Company</th><th>Salary</th>
                  <th className="adm-num">Openings</th><th className="adm-num">Applicants</th>
                  <th>Status</th><th>Closes</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map(j => (
                  <tr key={j.id} style={busyId === j.id ? { opacity: .5 } : undefined}>
                    <td>
                      <b>{j.title}</b>
                      <span className="adm-sub">{j.location}{j.wfh ? ' · Work from home' : ''} · {j.jobType}</span>
                    </td>
                    <td>{companyName(j.companyId)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtSalary(j.salaryMin, j.salaryMax)}</td>
                    <td className="adm-num">{j.openings}</td>
                    <td className="adm-num">
                      <b>{j.applicants?.total ?? 0}</b>
                      {j.applicants?.new > 0 && <span className="adm-sub" style={{ color: 'var(--a)' }}>{j.applicants.new} new</span>}
                    </td>
                    <td>
                      <span className={`adm-pill s-${j.isActive ? 'active' : 'inactive'}`}>
                        {j.isActive ? 'Live' : 'Unpublished'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                      {j.expiresOn ? fmtDate(j.expiresOn) : '—'}
                      <span className="adm-sub">posted {fmtWhen(j.postedOn)}</span>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-btn sm" onClick={() => toggle(j)} disabled={busyId === j.id}>
                          {j.isActive ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="adm-btn sm" onClick={() => setEditing(j)} aria-label={`Edit ${j.title}`}><IconEdit /></button>
                        <button className="adm-btn sm danger" onClick={() => setConfirming(j)} aria-label={`Delete ${j.title}`}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && data && (
        <JobForm
          job={editing === 'new' ? null : editing}
          companies={data.companies}
          enums={data.enums}
          canPickCompany={session.role === 'admin'}
          onClose={() => setEditing(null)}
          onSaved={(job, wasEdit) => {
            setEditing(null);
            toast(wasEdit ? `“${job.title}” updated.` : `“${job.title}” is live on the public site.`);
            load();
            refreshCounts();
          }}
        />
      )}

      {confirming && (
        <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && setConfirming(null)}>
          <div className="adm-drawer" style={{ width: 'min(460px,100%)' }} role="dialog" aria-modal="true">
            <div className="adm-drawer-head"><h2>Delete this posting?</h2></div>
            <div className="adm-drawer-body">
              <p style={{ marginBottom: 14 }}><b>{confirming.title}</b> — {companyName(confirming.companyId)}</p>
              <div className="adm-note warn" style={{ marginBottom: 16 }}>
                <IconAlert />
                {confirming.applicants?.total
                  ? `${confirming.applicants.total} candidate${confirming.applicants.total === 1 ? '' : 's'} applied to this job. Unpublishing keeps their applications; deleting permanently removes the posting they are attached to.`
                  : 'Unpublishing hides it from candidates and can be undone. Permanent deletion cannot.'}
              </div>
              <button className="adm-btn full" style={{ width: '100%', marginBottom: 9 }}
                onClick={() => remove(confirming, false)} disabled={busyId === confirming.id}>
                Unpublish — hide it, keep the record
              </button>
              <button className="adm-btn danger" style={{ width: '100%' }}
                onClick={() => remove(confirming, true)} disabled={busyId === confirming.id}>
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

export default function JobsPage() {
  return <Suspense fallback={null}><JobsInner /></Suspense>;
}
