'use client';
import { useEffect, useState, useMemo } from 'react';
import { PageTop } from '../AdminShell.jsx';
import { api, fmtWhen, pillClass } from '@/lib/admin-client.js';
import { IconSearch, IconEmpty, IconAlert } from '../icons.jsx';

/** Counselling leads from the Sky-High CRM. Deliberately read-only here: a
 *  lead is a counselling relationship owned by the counsellor in that system,
 *  not a hiring record. Recruiter actions live under Candidates instead. */
export default function LeadsPage() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [vertical, setVertical] = useState('');

  useEffect(() => {
    api('/admin/leads')
      .then(d => setRows(d.rows))
      .catch(e => setErr(e.status === 403
        ? 'Counselling leads are visible to DCW admins only.'
        : e.message));
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const n = q.trim().toLowerCase();
    return rows.filter(l =>
      (!vertical || l.vertical === vertical) &&
      (!n || `${l.name} ${l.phone} ${l.city} ${l.id}`.toLowerCase().includes(n)));
  }, [rows, q, vertical]);

  const byVertical = useMemo(() => {
    const m = { distance: 0, colleges: 0, jobs: 0 };
    (rows || []).forEach(l => { if (m[l.vertical] !== undefined) m[l.vertical]++; });
    return m;
  }, [rows]);

  return (
    <>
      <PageTop title="Counselling leads"
        sub="Enquiries captured across all three verticals and handed to the counselling team." />

      <div className="adm-body">
        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {rows && (
          <div className="adm-stats">
            <div className="adm-stat lead"><small>Total leads</small><b>{rows.length}</b><i>across every vertical</i></div>
            <div className="adm-stat"><small>Distance courses</small><b>{byVertical.distance}</b><i>Distance Courses Wala</i></div>
            <div className="adm-stat"><small>Colleges</small><b>{byVertical.colleges}</b><i>Colleges Wala</i></div>
            <div className="adm-stat"><small>Jobs</small><b>{byVertical.jobs}</b><i>Berojgar Bharat</i></div>
          </div>
        )}

        {rows && (
          <div className="adm-filters">
            <span className="adm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
              <IconSearch style={{ width: 16, height: 16, color: 'var(--ink-3)', flex: 'none' }} />
              <input value={q} onChange={e => setQ(e.target.value)} aria-label="Search leads"
                placeholder="Search name, phone, city or lead ID"
                style={{ border: 0, outline: 0, background: 'none', padding: 0, minHeight: 36, flex: 1, width: '100%' }} />
            </span>
            <select value={vertical} onChange={e => setVertical(e.target.value)} aria-label="Filter by vertical">
              <option value="">All verticals</option>
              <option value="distance">Distance courses</option>
              <option value="colleges">Colleges</option>
              <option value="jobs">Jobs</option>
            </select>
          </div>
        )}

        {!rows && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {rows && shown.length === 0 && (
          <div className="adm-panel">
            <div className="adm-empty">
              <IconEmpty />
              <h3>{rows.length ? 'No leads match' : 'No leads yet'}</h3>
              <p>{rows.length
                ? 'Try a different vertical or clear the search.'
                : 'Enquiries from the counselling forms across the site will collect here.'}</p>
            </div>
          </div>
        )}

        {rows && shown.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Lead</th><th>Vertical</th><th>Interested in</th><th>Contact</th>
                  <th>Status</th><th>Owner</th><th className="adm-num">Enquiries</th><th>Created</th></tr>
              </thead>
              <tbody>
                {shown.map(l => (
                  <tr key={l.id}>
                    <td>
                      <b>{l.name}</b>
                      <span className="adm-sub">{l.id} · {l.city || '—'}</span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{l.vertical}</td>
                    <td>
                      {l.course || l.interestId || '—'}
                      <span className="adm-sub">{l.course ? `${l.interestType} · ${l.interestId}` : l.interestType}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <a href={`tel:${l.phone}`}>{l.phone}</a>
                      <span className="adm-sub">
                        {l.phoneVerified ? 'Verified' : 'Unverified'}{l.whatsappSame ? ' · WhatsApp' : ''}
                      </span>
                    </td>
                    <td><span className={pillClass(l.status)}>{l.status}</span></td>
                    <td>{l.assignedTo || '—'}</td>
                    <td className="adm-num">{l.enquiryCount}</td>
                    <td style={{ color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{fmtWhen(l.createdAt)}</td>
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
