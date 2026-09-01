'use client';
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/admin-client.js';
import { IconGrid, IconBriefcase, IconUsers, IconSpark, IconOut, IconCheck, IconAlert } from './icons.jsx';

const Ctx = createContext(null);
export const useSession = () => useContext(Ctx);

/** Console-wide toast. Kept here so any page can confirm an action without
 *  each one re-implementing its own feedback surface. */
export const useRefreshCounts = () => useContext(Ctx).refreshCounts;

export function useToast() {
  const c = useContext(Ctx);
  return c?.toast ?? (() => {});
}

const NAV = [
  { href: '/admin', label: 'Overview', Icon: IconGrid, roles: ['admin', 'employer'] },
  { href: '/admin/jobs', label: 'Jobs', Icon: IconBriefcase, roles: ['admin', 'employer'], count: 'jobs' },
  { href: '/admin/applications', label: 'Candidates', Icon: IconUsers, roles: ['admin', 'employer'], count: 'apps' },
  { href: '/admin/leads', label: 'Counselling leads', Icon: IconSpark, roles: ['admin'], count: 'leads' }
];

export default function AdminShell({ children }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState('loading');
  const [counts, setCounts] = useState({});
  const [toast, setToast] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let live = true;
    api('/auth/session')
      .then(d => {
        if (!live) return;
        if (!d.authenticated) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; }
        setSession(d.session);
        setState('ready');
      })
      .catch(() => { if (live) router.replace('/login'); });
    return () => { live = false; };
  }, [pathname, router]);

  // Badge counts are ambient context, not the point of the page — a failure
  // here must never block the console from rendering.
  const loadCounts = useCallback(() => api('/admin/stats')
    .then(d => setCounts({ jobs: d.jobs?.active, apps: d.pipeline?.inPipeline, leads: d.leads ?? undefined }))
    .catch(() => {}), []);

  useEffect(() => {
    if (state !== 'ready') return;
    loadCounts();
  }, [state, pathname, loadCounts]);

  const push = (message, tone = 'ok') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3200);
  };

  async function signOut() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* leaving anyway */ }
    router.replace('/login');
  }

  if (state === 'loading') {
    return (
      <div className="adm" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: 220 }}>
          <div className="adm-skel" style={{ height: 17, marginBottom: 10 }} />
          <div className="adm-skel" style={{ width: '70%' }} />
          <p style={{ marginTop: 14, color: 'var(--ink-3)', fontSize: 13 }}>Checking your session…</p>
        </div>
      </div>
    );
  }

  const items = NAV.filter(n => n.roles.includes(session.role));
  const initials = session.name.replace(/\(.*\)/, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Ctx.Provider value={{ session, toast: push, refreshCounts: loadCounts }}>
      <div className="adm">
        <div className="adm-shell">
          <aside className="adm-rail">
            <div className="adm-rail-top">
              <Link href="/" className="adm-logo">
                <img src="/distance-lockup.png" alt="" />
                <span><b>DCW Console</b><small>Operations</small></span>
              </Link>
            </div>
            <nav className="adm-nav" aria-label="Console sections">
              <div className="adm-nav-label">Manage</div>
              {items.map(({ href, label, Icon, count }) => {
                const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
                const n = counts[count];
                return (
                  <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                    <Icon /><span>{label}</span>
                    {typeof n === 'number' && <span className="adm-count">{n}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="adm-rail-foot">
              <span className="adm-avatar">{initials}</span>
              <span className="adm-who"><b>{session.name}</b><small>{session.role}</small></span>
              <button className="adm-btn ghost sm" onClick={signOut} style={{ color: '#C3D2E2' }} title="Sign out">
                <IconOut /><span className="adm-hide-sm">Exit</span>
              </button>
            </div>
          </aside>
          <div className="adm-main">{children}</div>
        </div>
        {toast && (
          <div className={`adm-toast${toast.tone === 'bad' ? ' bad' : ''}`} role="status">
            {toast.tone === 'bad' ? <IconAlert /> : <IconCheck />}{toast.message}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

/** Page header slot — every console page uses the same one. */
export function PageTop({ title, sub, children }) {
  return (
    <header className="adm-top">
      <div className="adm-top-copy"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children}
    </header>
  );
}
