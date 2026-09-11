'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTop, useToast, useRefreshCounts } from '../AdminShell.jsx';
import AddWizard from './AddWizard.jsx';
import { api, fmtWhen } from '@/lib/admin-client.js';
import { IconPlus, IconSearch, IconEmpty, IconAlert, IconEdit, IconTrash, IconCheck } from '../icons.jsx';

/**
 * The catalogue list: every college, university and open-school listing DCW
 * carries, live or draft, with the publishing state on the row.
 *
 * The two states on a row answer different questions and are shown separately
 * on purpose. `status` is "has anyone finished writing this" — draft or
 * published. `isActive` is "do we still list this at all". A retired listing and
 * a half-written one both stay off the public site, but conflating them would
 * make "unpublish for a week" indistinguishable from "retire".
 */
function CatalogueInner() {
  const toast = useToast();
  const refreshCounts = useRefreshCounts();
  const params = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [vertical, setVertical] = useState('');
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [blocked, setBlocked] = useState(null);   // {institution, checklist}

  const load = useCallback(async () => {
    const search = new URLSearchParams();
    if (q) search.set('q', q);
    if (vertical) search.set('vertical', vertical);
    if (status) search.set('status', status);
    try { setData(await api(`/admin/institutions?${search}`)); setErr(null); }
    catch (e) { setErr(e.message); }
  }, [q, vertical, status]);

  useEffect(() => { const t = setTimeout(load, q ? 220 : 0); return () => clearTimeout(t); }, [load, q]);

  // Deep link from the dashboard and from the rail's empty state.
  useEffect(() => {
    if (params.get('new') === '1') { setAdding(true); router.replace('/admin/catalogue'); }
  }, [params, router]);

  async function publish(inst, force = false) {
    setBusyId(inst.id);
    try {
      await api(`/admin/institutions/${inst.id}/publish${force ? '?force=true' : ''}`, { method: 'POST' });
      toast(`“${inst.name}” is live on the public site.`);
      setBlocked(null);
      await load();
      refreshCounts();
    } catch (e) {
      // 409 means the listing is not finished, not that the request was wrong —
      // so the checklist is shown rather than a red banner with no next step.
      if (e.status === 409) setBlocked({ institution: inst, checklist: e.payload?.checklist ?? null });
      else toast(e.message, 'bad');
    }
    setBusyId(null);
  }

  async function unpublish(inst) {
    setBusyId(inst.id);
    try {
      await api(`/admin/institutions/${inst.id}/publish`, { method: 'DELETE' });
      toast(`“${inst.name}” is back to draft and off the public site.`);
      await load();
      refreshCounts();
    } catch (e) { toast(e.message, 'bad'); }
    setBusyId(null);
  }

  async function remove(inst, hard) {
    setBusyId(inst.id);
    try {
      await api(`/admin/institutions/${inst.id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
      toast(hard ? `Deleted “${inst.name}” permanently.` : `“${inst.name}” retired.`);
      setConfirming(null);
      await load();
      refreshCounts();
    } catch (e) { toast(e.message, 'bad'); }
    setBusyId(null);
  }

  const rows = data?.rows ?? [];
  const s = data?.stats;

  return (
    <>
      <PageTop title="Colleges & courses"
        sub="Every listing on Distance Courses Wala and Colleges Wala. What you publish here is what a student sees — fees, eligibility and all.">
        <button className="adm-btn pri" onClick={() => setAdding(true)}><IconPlus />Add a college</button>
      </PageTop>

      <div className="adm-body">
        {s && (
          <div className="adm-stats">
            <div className="adm-stat lead"><small>Live listings</small><b>{s.active}</b><i>visible to students now</i></div>
            <div className="adm-stat"><small>Drafts</small><b>{s.drafts}</b><i>waiting to be finished</i></div>
            <div className="adm-stat"><small>Courses</small><b>{s.courses}</b><i>{s.missingFee} without a fee</i></div>
            <div className="adm-stat"><small>Mapped</small><b>{s.mapped}</b><i>have a Google location</i></div>
          </div>
        )}

        <div className="adm-filters">
          <span className="adm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
            <IconSearch style={{ width: 16, height: 16, color: 'var(--ink-3)', flex: 'none' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, city or state"
              aria-label="Search listings"
              style={{ border: 0, outline: 0, background: 'none', padding: 0, minHeight: 36, flex: 1, width: '100%' }} />
          </span>
          <select value={vertical} onChange={e => setVertical(e.target.value)} aria-label="Filter by vertical">
            <option value="">Both verticals</option>
            <option value="distance">Distance Courses Wala</option>
            <option value="colleges">Colleges Wala</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by state">
            <option value="">Any state</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="inactive">Retired</option>
          </select>
          {(q || vertical || status) && (
            <button className="adm-btn sm" onClick={() => { setQ(''); setVertical(''); setStatus(''); }}>Clear</button>
          )}
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
              <h3>{q || vertical || status ? 'Nothing matches that filter' : 'No listings yet'}</h3>
              <p>{q || vertical || status
                ? 'Try a broader search, or clear the filters to see everything.'
                : 'Add a college and the guided steps will take you through courses, fees and recognition before it goes live.'}</p>
              {q || vertical || status
                ? <button className="adm-btn" onClick={() => { setQ(''); setVertical(''); setStatus(''); }}>Clear filters</button>
                : <button className="adm-btn pri" onClick={() => setAdding(true)}><IconPlus />Add a college</button>}
            </div>
          </div>
        )}

        {data && rows.length > 0 && (
          <div className="adm-panel adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Listing</th><th>Vertical</th>
                  <th className="adm-num">Courses</th><th className="adm-num">Applicants</th>
                  <th>State</th><th>Still missing</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map(i => {
                  const live = (i.status ?? 'published') === 'published' && i.isActive !== false;
                  const missing = (i.checklist?.blocking?.length ?? 0) + (i.checklist?.warnings?.length ?? 0);
                  return (
                    <tr key={i.id} style={busyId === i.id ? { opacity: .5 } : undefined}>
                      <td>
                        <b>{i.name}</b>
                        <span className="adm-sub">{[i.city, i.state].filter(Boolean).join(', ')} · {i.type}</span>
                      </td>
                      <td>{i.vertical === 'distance' ? 'Distance' : 'Colleges'}</td>
                      <td className="adm-num">{i.courses.filter(c => c.isActive !== false).length}</td>
                      <td className="adm-num">
                        <b>{i.applicants?.total ?? 0}</b>
                        {i.applicants?.new > 0 && <span className="adm-sub" style={{ color: 'var(--a)' }}>{i.applicants.new} new</span>}
                      </td>
                      <td>
                        <span className={`adm-pill s-${live ? 'active' : 'inactive'}`}>
                          {i.isActive === false ? 'Retired' : live ? 'Published' : 'Draft'}
                        </span>
                        <span className="adm-sub">{fmtWhen(i.updatedAt)}</span>
                      </td>
                      <td style={{ color: 'var(--ink-3)' }}>
                        {i.checklist?.ready && !missing
                          ? <span style={{ color: 'var(--ok)', fontWeight: 700 }}>Complete</span>
                          : i.checklist?.blocking?.length
                            ? <span style={{ color: 'var(--bad)', fontWeight: 700 }}>{i.checklist.blocking.length} blocking</span>
                            : `${missing} optional`}
                      </td>
                      <td>
                        <div className="adm-actions">
                          {live
                            ? <button className="adm-btn sm" onClick={() => unpublish(i)} disabled={busyId === i.id}>Unpublish</button>
                            : <button className="adm-btn sm" onClick={() => publish(i)} disabled={busyId === i.id}>Publish</button>}
                          <Link className="adm-btn sm" href={`/admin/catalogue/${i.id}`} aria-label={`Edit ${i.name}`}><IconEdit /></Link>
                          <button className="adm-btn sm danger" onClick={() => setConfirming(i)} aria-label={`Retire ${i.name}`}><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddWizard
          enums={data?.enums}
          onClose={() => { setAdding(false); load(); refreshCounts(); }}
          onPublished={inst => {
            setAdding(false);
            toast(`“${inst.name}” is live on the public site.`);
            load(); refreshCounts();
          }}
        />
      )}

      {blocked && (
        <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && setBlocked(null)}>
          <div className="adm-drawer" style={{ width: 'min(520px,100%)' }} role="dialog" aria-modal="true">
            <div className="adm-drawer-head"><h2>Not ready to publish</h2></div>
            <div className="adm-drawer-body">
              <p style={{ marginBottom: 14 }}><b>{blocked.institution.name}</b> is missing things a student would look for.</p>
              <ul className="adm-checklist">
                {(blocked.checklist?.blocking ?? []).map(b => <li key={b} className="bad"><IconAlert />{b}</li>)}
                {(blocked.checklist?.warnings ?? []).map(w => <li key={w}><IconAlert />{w}</li>)}
              </ul>
            </div>
            <div className="adm-drawer-foot">
              <button className="adm-btn" onClick={() => publish(blocked.institution, true)}
                disabled={busyId === blocked.institution.id}>Publish anyway</button>
              <Link className="adm-btn pri" href={`/admin/catalogue/${blocked.institution.id}`}>Fix it</Link>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div className="adm-scrim" onMouseDown={e => e.target === e.currentTarget && setConfirming(null)}>
          <div className="adm-drawer" style={{ width: 'min(460px,100%)' }} role="dialog" aria-modal="true">
            <div className="adm-drawer-head"><h2>Retire this listing?</h2></div>
            <div className="adm-drawer-body">
              <p style={{ marginBottom: 14 }}><b>{confirming.name}</b> — {confirming.city}</p>
              <div className="adm-note warn" style={{ marginBottom: 16 }}>
                <IconAlert />
                {confirming.applicants?.total
                  ? `${confirming.applicants.total} student${confirming.applicants.total === 1 ? ' has' : 's have'} an application against this listing. Retiring keeps those applications readable; permanent deletion removes the listing they point at.`
                  : 'Retiring hides it from students and can be undone. Permanent deletion cannot.'}
              </div>
              <button className="adm-btn full" style={{ width: '100%', marginBottom: 9 }}
                onClick={() => remove(confirming, false)} disabled={busyId === confirming.id}>
                Retire — hide it, keep the record
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

export default function CataloguePage() {
  return <Suspense fallback={null}><CatalogueInner /></Suspense>;
}
