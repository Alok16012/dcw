'use client';
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/admin-client.js';
import { IconGrid, IconBriefcase, IconUsers, IconSpark, IconOut, IconCheck, IconAlert,
  IconCampus, IconBoard, IconChat, IconStar } from './icons.jsx';
import { can } from '@/lib/permissions.js';

const Ctx = createContext(null);
export const useSession = () => useContext(Ctx);

/** Console-wide toast. Kept here so any page can confirm an action without
 *  each one re-implementing its own feedback surface. */
export const useRefreshCounts = () => useContext(Ctx).refreshCounts;

export function useToast() {
  const c = useContext(Ctx);
  return c?.toast ?? (() => {});
}

/**
 * The rail, grouped by what the work actually is.
 *
 * `cap` is the capability the section needs, read from the same table the API
 * routes enforce (lib/permissions.js) — so the rail cannot drift from what a
 * role can really do, and adding a role does not mean editing this list.
 * Hiding a link is a courtesy; the server check is the control.
 */
const NAV = [
  { href: '/admin', label: 'Overview', Icon: IconGrid, group: 'Manage', cap: 'jobs:read:own' },
  { href: '/admin/catalogue', label: 'Colleges & courses', Icon: IconCampus, group: 'Catalogue', cap: 'catalogue:read', count: 'catalogue' },
  { href: '/admin/boards', label: 'Open school boards', Icon: IconBoard, group: 'Catalogue', cap: 'boards:read' },
  { href: '/admin/reviews', label: 'Reviews', Icon: IconStar, group: 'Catalogue', cap: 'catalogue:write', count: 'reviews' },
  { href: '/admin/jobs', label: 'Jobs', Icon: IconBriefcase, group: 'Manage', cap: 'jobs:read:own', count: 'jobs' },
  { href: '/admin/applications', label: 'Candidates', Icon: IconUsers, group: 'Manage', cap: 'applications:read:own', count: 'apps' },
  { href: '/admin/leads', label: 'Counselling leads', Icon: IconSpark, group: 'Manage', cap: 'leads:read:own', count: 'leads' },
  { href: '/admin/whatsapp', label: 'WhatsApp', Icon: IconChat, group: 'Outreach', cap: 'whatsapp:read' }
];

/** Rail order. A group with nothing in it for this role is not rendered at all. */
const GROUPS = ['Manage', 'Catalogue', 'Outreach'];

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
    .then(d => setCounts({
      jobs: d.jobs?.active, apps: d.pipeline?.inPipeline, leads: d.leads ?? undefined,
      // Drafts and pending reviews are queues — things waiting on a person —
      // so they earn a badge where a plain total would not.
      catalogue: d.catalogue?.drafts || undefined,
      reviews: d.reviewsPending || undefined
    }))
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

  const items = NAV.filter(n => can(session, n.cap));
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
              {GROUPS.map(group => {
                const inGroup = items.filter(n => n.group === group);
                if (!inGroup.length) return null;
                return (
                  <div key={group} className="adm-nav-group">
                    <div className="adm-nav-label">{group}</div>
                    {inGroup.map(({ href, label, Icon, count }) => {
                      const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
                      const n = counts[count];
                      return (
                        <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
                          <Icon /><span>{label}</span>
                          {typeof n === 'number' && <span className="adm-count">{n}</span>}
                        </Link>
                      );
                    })}
                  </div>
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
