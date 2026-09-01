'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageTop, useSession } from './AdminShell.jsx';
import { api, fmtWhen, pillClass } from '@/lib/admin-client.js';
import { IconPlus, IconAlert, IconEmpty } from './icons.jsx';

const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired'];

export default function Overview() {
  const { session } = useSession();
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { api('/admin/stats').then(setD).catch(e => setErr(e.message)); }, []);

  if (err) return (
    <>
      <PageTop title="Overview" />
      <div className="adm-body"><div className="adm-note bad"><IconAlert />{err}</div></div>
    </>
  );

  if (!d) return (
    <>
      <PageTop title="Overview" sub="Loading your figures…" />
      <div className="adm-body">
        <div className="adm-stats">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="adm-stat">
              <div className="adm-skel" style={{ width: '55%', height: 10 }} />
              <div className="adm-skel" style={{ width: '38%', height: 26, marginTop: 11 }} />
            </div>
          ))}
        </div>
        <div className="adm-panel" style={{ height: 190 }} />
      </div>
    </>
  );

  const { jobs, pipeline, leads, recent } = d;
  // The funnel is scaled against its own widest stage so the shape stays
  // readable whether the pipeline holds 10 candidates or 10,000.
  const peak = Math.max(1, ...STAGES.map(s => pipeline.byStatus[s] || 0));

  return (
    <>
      <PageTop title={`Good to see you, ${session.name.replace(/\s*\(.*\)/, '')}`}
        sub={session.role === 'employer'
          ? 'Your postings and the candidates in your pipeline.'
          : 'Everything live across DCW jobs, candidates and counselling.'}>
        <Link href="/admin/jobs?new=1" className="adm-btn pri"><IconPlus />Post a job</Link>
      </PageTop>

      <div className="adm-body">
        <div className="adm-stats">
          <div className="adm-stat lead">
            <small>Live postings</small><b>{jobs.active}</b>
            <i>{jobs.openings} openings across {jobs.companies} companies</i>
          </div>
          <div className="adm-stat">
            <small>In pipeline</small><b>{pipeline.inPipeline}</b>
            <i>{pipeline.byStatus.Applied || 0} not yet screened</i>
          </div>
          <div className="adm-stat">
            <small>Hired</small><b>{pipeline.hired}</b>
            <i>{pipeline.conversion}% of {pipeline.total} applications</i>
          </div>
          <div className="adm-stat">
            <small>{leads == null ? 'Expiring soon' : 'Counselling leads'}</small>
            <b>{leads == null ? jobs.expiringSoon : leads}</b>
            <i>{leads == null ? 'postings past their expiry date' : 'from the counselling CRM'}</i>
          </div>
        </div>

        <div className="adm-split">
          <section className="adm-panel">
            <div className="adm-panel-head">
              <h2>Hiring funnel</h2>
              <Link href="/admin/applications" className="adm-btn sm">Open pipeline</Link>
            </div>
            {pipeline.total === 0
              ? <div className="adm-empty"><IconEmpty /><h3>No applications yet</h3>
                  <p>As soon as someone applies on the public site, they appear here.</p></div>
              : (
                <>
                  <div className="adm-funnel">
                    {STAGES.map(s => {
                      const n = pipeline.byStatus[s] || 0;
                      return (
                        <div key={s}>
                          <div className="bar" style={{ height: `${28 + (n / peak) * 96}px` }}
                            title={`${n} at ${s}`}>{n}</div>
                          <small>{s}</small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="adm-funnel-legend">
                    <span>Rejected <b style={{ color: 'var(--bad)' }}>{pipeline.byStatus.Rejected || 0}</b></span>
                    <span>On hold <b style={{ color: 'var(--warn)' }}>{pipeline.byStatus['On hold'] || 0}</b></span>
                    <span>Withdrawn <b>{pipeline.byStatus.Withdrawn || 0}</b></span>
                  </div>
                </>
              )}
          </section>

          <section className="adm-panel">
            <div className="adm-panel-head">
              <h2>Latest applications</h2>
              <Link href="/admin/applications" className="adm-btn sm">See all</Link>
            </div>
            {recent.length === 0
              ? <div className="adm-empty"><IconEmpty /><h3>Nothing yet</h3><p>New applicants show up here first.</p></div>
              : (
                <div className="adm-scroll">
                  <table className="adm-table">
                    <thead><tr><th>Candidate</th><th>Applied for</th><th>Stage</th><th>When</th></tr></thead>
                    <tbody>
                      {recent.map(a => (
                        <tr key={a.id}>
                          <td><b>{a.name}</b><span className="adm-sub">{a.city || '—'}</span></td>
                          <td>{a.jobTitle}</td>
                          <td><span className={pillClass(a.status)}>{a.status}</span></td>
                          <td style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{fmtWhen(a.appliedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </div>
      </div>
    </>
  );
}
