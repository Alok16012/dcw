'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PageTop, useToast, useRefreshCounts } from '../AdminShell.jsx';
import { api, fmtDate } from '@/lib/admin-client.js';
import { IconEmpty, IconAlert, IconStar, IconCheck, IconClose } from '../icons.jsx';

const VERTICAL_LABEL = { distance: 'Distance Courses Wala', colleges: 'Colleges Wala', jobs: 'Berojgar Bharat' };

function Stars({ n }) {
  return (
    <span aria-label={`${n} out of 5`} style={{ display: 'inline-flex', gap: 1, color: '#C9821A' }}>
      {[1, 2, 3, 4, 5].map(i => <IconStar key={i} filled={i <= n} style={{ width: 13, height: 13 }} />)}
    </span>
  );
}

/**
 * Review moderation (client requirement 11).
 *
 * A review is one record keyed to what it is about — an institution, a course, a
 * board, a job — so publishing one here puts it on the reviews page, on that
 * institution's detail page, and into the rating on its listing card at the same
 * time. There is no second copy to also approve.
 *
 * Everything submitted from the public form arrives as `pending`. That is a
 * deliberate default: the rating on a card is a claim DCW makes, and an unread
 * review should not be able to move it.
 */
export default function ReviewsPage() {
  const toast = useToast();
  const refreshCounts = useRefreshCounts();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [status, setStatus] = useState('pending');
  const [vertical, setVertical] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const search = new URLSearchParams();
    if (status) search.set('status', status);
    if (vertical) search.set('vertical', vertical);
    try { setData(await api(`/admin/reviews?${search}`)); setErr(null); }
    catch (e) { setErr(e.message); }
  }, [status, vertical]);

  useEffect(() => { load(); }, [load]);

  async function moderate(review, next) {
    setBusyId(review.id);
    try {
      await api('/admin/reviews', { method: 'PATCH', body: { id: review.id, status: next } });
      toast(next === 'published'
        ? 'Published — it now counts towards the rating shown on the listing.'
        : next === 'rejected' ? 'Hidden from the public site.' : 'Back in the queue.');
      await load();
      refreshCounts();
    } catch (e) { toast(e.message, 'bad'); }
    setBusyId(null);
  }

  const rows = data?.rows ?? [];

  return (
    <>
      <PageTop title="Reviews"
        sub="What students wrote, and where it appears. A published review shows on the reviews page, on the listing it names and in that listing's star rating." />

      <div className="adm-body">
        {data && (
          <div className="adm-stats">
            <div className="adm-stat lead"><small>Waiting on you</small><b>{data.pending}</b><i>unread submissions</i></div>
            <div className="adm-stat"><small>Published</small><b>{data.summary.count}</b><i>live across the site</i></div>
            <div className="adm-stat"><small>Average</small><b>{data.summary.average ?? '—'}</b><i>of published reviews</i></div>
            <div className="adm-stat"><small>Verified</small><b>{data.summary.verified}</b><i>from a confirmed applicant</i></div>
          </div>
        )}

        <div className="adm-filters">
          <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by state">
            <option value="">Everything</option>
            <option value="pending">Waiting on you</option>
            <option value="published">Published</option>
            <option value="rejected">Hidden</option>
          </select>
          <select value={vertical} onChange={e => setVertical(e.target.value)} aria-label="Filter by vertical">
            <option value="">All three verticals</option>
            <option value="distance">Distance Courses Wala</option>
            <option value="colleges">Colleges Wala</option>
            <option value="jobs">Berojgar Bharat</option>
          </select>
          {(status !== 'pending' || vertical) && (
            <button className="adm-btn sm" onClick={() => { setStatus('pending'); setVertical(''); }}>Reset</button>
          )}
        </div>

        {err && <div className="adm-note bad"><IconAlert />{err}</div>}

        {!data && !err && (
          <div className="adm-panel" style={{ padding: 18 }}>
            {[0, 1, 2].map(i => <div key={i} className="adm-skel" style={{ marginBottom: 14, height: 17 }} />)}
          </div>
        )}

        {data && rows.length === 0 && (
          <div className="adm-panel">
            <div className="adm-empty">
              <IconEmpty />
              <h3>{status === 'pending' ? 'Nothing waiting' : 'No reviews here'}</h3>
              <p>{status === 'pending'
                ? 'Every submitted review has been read. New ones arrive here the moment a student posts one.'
                : 'Try another filter.'}</p>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr><th>Review</th><th>About</th><th>Rating</th><th>State</th><th /></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={busyId === r.id ? { opacity: .5 } : undefined}>
                    <td style={{ maxWidth: 420 }}>
                      <b>{r.name}{r.city ? ` · ${r.city}` : ''}</b>
                      <span className="adm-sub" style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>{r.text}</span>
                    </td>
                    <td>
                      {r.institutionId
                        ? <Link href={`/admin/catalogue/${r.institutionId}`}>{r.subject}</Link>
                        : r.subject}
                      <span className="adm-sub">{VERTICAL_LABEL[r.vertical] ?? r.vertical} · {fmtDate(r.createdAt)}</span>
                    </td>
                    <td><Stars n={r.rating} /><span className="adm-sub">{r.verified ? 'Verified applicant' : 'Unverified'}</span></td>
                    <td>
                      <span className={`adm-pill s-${r.status === 'published' ? 'active' : r.status === 'pending' ? 'new' : 'inactive'}`}>
                        {r.status === 'published' ? 'Published' : r.status === 'pending' ? 'Waiting' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="adm-actions">
                        {r.status !== 'published' && (
                          <button className="adm-btn sm" onClick={() => moderate(r, 'published')} disabled={busyId === r.id}>
                            <IconCheck />Publish
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button className="adm-btn sm ghost" onClick={() => moderate(r, 'rejected')} disabled={busyId === r.id}>
                            <IconClose />Hide
                          </button>
                        )}
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
