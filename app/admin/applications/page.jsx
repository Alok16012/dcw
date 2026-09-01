'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageTop, useToast, useRefreshCounts } from '../AdminShell.jsx';
import CandidateDrawer from './CandidateDrawer.jsx';
import { api, fmtWhen, pillClass } from '@/lib/admin-client.js';
import { IconSearch, IconEmpty, IconAlert, IconStar } from '../icons.jsx';

function AppsInner() {
  const toast = useToast();
  const refreshCounts = useRefreshCounts();
  const params = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [jobId, setJobId] = useState(params.get('jobId') || '');
  const [sort, setSort] = useState('recent');
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    const s = new URLSearchParams();
    if (q) s.set('q', q);
    if (status) s.set('status', status);
    if (jobId) s.set('jobId', jobId);
    if (sort) s.set('sort', sort);
    try { setData(await api(`/admin/applications?${s}`)); setErr(null); }
    catch (e) { setErr(e.message); }
  }, [q, status, jobId, sort]);

  useEffect(() => { const t = setTimeout(load, q ? 220 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => { api('/admin/jobs').then(d => setJobs(d.rows)).catch(() => {}); }, []);

  const rows = data?.rows ?? [];
  const stats = data?.stats;
  const stages = data?.stages ?? [];
  const closed = data?.closed ?? [];

  // The stage chips double as the filter and the funnel readout — one control,
  // both jobs, so the recruiter never has to reconcile two numbers.
  const chip = (label, value, n) => (
    <button key={label} className={`adm-chip${status === value ? ' on' : ''}`}
      onClick={() => setStatus(status === value ? '' : value)} aria-pressed={status === value}>
      {label}<span>{n}</span>
    </button>
  );

  return (
    <>
      <PageTop title="Candidates" sub="Everyone who applied, and where they stand in the pipeline.">
        {jobId && <button className="adm-btn" onClick={() => setJobId('')}>Clear job filter</button>}
      </PageTop>

      <div className="adm-body">
        {stats && (
          <div className="adm-chips" role="group" aria-label="Filter by stage">
            {chip('All', '', stats.total)}
            {stages.map(s => chip(s, s, stats.byStatus[s] || 0))}
            {closed.map(s => chip(s, s, stats.byStatus[s] || 0))}
          </div>
        )}

        <div className="adm-filters">
          <span className="adm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
            <IconSearch style={{ width: 16, height: 16, color: 'var(--ink-3)', flex: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} aria-label="Search candidates"
              placeholder="Search name, phone or city"
              style={{ border: 0, outline: 0, background: 'none', padding: 0, minHeight: 36, flex: 1, width: '100%' }} />
          </span>
          <select value={jobId} onChange={e => setJobId(e.target.value)} aria-label="Filter by job">
            <option value="">All jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.location}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
            <option value="recent">Most recent</option>
            <option value="rating">Highest rated</option>
            <option value="name">Name A–Z</option>
          </select>
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
              <h3>{q || status || jobId ? 'No candidates match' : 'No applications yet'}</h3>
              <p>{q || status || jobId
                ? 'Try a different stage or clear the filters.'
                : 'When someone applies on the public site, they land here within the same second.'}</p>
              {(q || status || jobId) &&
                <button className="adm-btn" onClick={() => { setQ(''); setStatus(''); setJobId(''); }}>Clear filters</button>}
            </div>
          </div>
        )}

        {data && rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Candidate</th><th>Applied for</th><th>Contact</th>
                  <th>Stage</th><th>Rating</th><th>Applied</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.name}</b>
                      <span className="adm-sub">
                        {a.city || '—'} · {a.qualification || '—'}
                        {a.experienceYears ? ` · ${a.experienceYears} yr` : ' · Fresher'}
                      </span>
                    </td>
                    <td>{a.jobTitle}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <a href={`tel:${a.phone}`}>{a.phone}</a>
                      {a.email && <span className="adm-sub">{a.email}</span>}
                    </td>
                    <td><span className={pillClass(a.status)}>{a.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap', color: a.rating ? '#B77900' : 'var(--ink-3)' }}>
                      {a.rating
                        ? <><IconStar filled style={{ width: 14, height: 14, verticalAlign: '-2px' }} /> {a.rating}/5</>
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{fmtWhen(a.appliedAt)}</td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-btn sm pri" onClick={() => setOpen(a.id)}>Open</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <CandidateDrawer id={open} onClose={() => setOpen(null)}
          onChanged={msg => { toast(msg); load(); refreshCounts(); }} />
      )}
    </>
  );
}

export default function ApplicationsPage() {
  return <Suspense fallback={null}><AppsInner /></Suspense>;
}
