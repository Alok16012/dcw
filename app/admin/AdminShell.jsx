'use client';
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/admin-client.js';
import { IconGrid, IconBriefcase, IconUsers, IconSpark, IconOut, IconCheck, IconAlert,
  IconCampus, IconBoard, IconChat, IconStar, IconCap, IconSliders } from './icons.jsx';
import { can } from '@/lib/permissions.js';
import { SITES } from '@/lib/crm.js';

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
/* The three websites are managed separately. Each section says which sites
   it belongs to; the switcher at the top of the rail picks the site, and a
   page that filters by vertical (catalogue, reviews, leads) reads it from
   useSite() instead of offering a cross-site dropdown. */
const ALL = ['distance', 'colleges', 'jobs'];
const SITE_KEY = 'dcw.admin.site';
export const useSite = () => useContext(Ctx)?.site ?? 'distance';

const NAV = [
  { href: '/admin', label: 'Overview', sites: ALL, Icon: IconGrid, group: 'Manage', cap: 'jobs:read:own' },
  { href: '/admin/catalogue', label: { distance: 'Universities & courses', colleges: 'Colleges & courses' }, sites: ['distance', 'colleges'], Icon: IconCampus, group: 'Catalogue', cap: 'catalogue:read', count: 'catalogue' },
  { href: '/admin/boards', label: 'Open school boards', sites: ['distance'], Icon: IconBoard, group: 'Catalogue', cap: 'boards:read' },
  { href: '/admin/reviews', label: 'Reviews', sites: ALL, Icon: IconStar, group: 'Catalogue', cap: 'catalogue:write', count: 'reviews' },
  { href: '/admin/jobs', label: 'Jobs', sites: ['jobs'], Icon: IconBriefcase, group: 'Manage', cap: 'jobs:read:own', count: 'jobs' },
  /* Students sits above Candidates deliberately: they are the two halves of the
     same rail — one admission pipeline, one hiring pipeline — and the education
     side is the larger of the two. `students` counts files still in the funnel,
     not everyone ever enrolled, so the badge means "waiting on somebody". */
  { href: '/admin/students', label: 'Students', sites: ['distance', 'colleges'], Icon: IconCap, group: 'Manage', cap: 'catalogue:read', count: 'students' },
  { href: '/admin/applications', label: 'Candidates', sites: ['jobs'], Icon: IconUsers, group: 'Manage', cap: 'applications:read:own', count: 'apps' },
  { href: '/admin/leads', label: 'Counselling leads', sites: ALL, Icon: IconSpark, group: 'Manage', cap: 'leads:read:own', count: 'leads' },
  { href: '/admin/whatsapp', label: 'WhatsApp', sites: ALL, Icon: IconChat, group: 'Outreach', cap: 'whatsapp:read' },
  /* The dropdown vocabularies. Same capability as editing a course, because
     that is what editing them does. */
  { href: '/admin/settings', label: 'Dropdowns & lists', sites: ALL, Icon: IconSliders, group: 'Settings', cap: 'catalogue:write' }
];

/** Rail order. A group with nothing in it for this role is not rendered at all. */
const GROUPS = ['Manage', 'Catalogue', 'Outreach', 'Settings'];

export default function AdminShell({ children }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState('loading');
  const [counts, setCounts] = useState({});
  const [toast, setToast] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [site, setSiteState] = useState('distance');
  // ?site= wins (the website's login sends people here with it), then the
  // last site this browser worked on.
  useEffect(() => {
    const asked = params.get('site');
    let next = SITES[asked] ? asked : null;
    if (!next) { try { const saved = localStorage.getItem(SITE_KEY); if (SITES[saved]) next = saved; } catch {} }
    if (next) setSiteState(next);
    if (SITES[asked]) { try { localStorage.setItem(SITE_KEY, asked); } catch {} }
  }, [params]);
  function setSite(next) {
    setSiteState(next);
    try { localStorage.setItem(SITE_KEY, next); } catch {}
    const here = NAV.find(n => n.href !== '/admin' && pathname.startsWith(n.href));
    if (here && !here.sites.includes(next)) router.push('/admin');
  }

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
      // Students still moving through the funnel, not everyone ever enrolled —
      // the badge is meant to read as "files waiting on somebody".
      students: d.admissions?.inPipeline,
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

  const items = NAV.filter(n => can(session, n.cap) && n.sites.includes(site));
  const initials = session.name.replace(/\(.*\)/, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Ctx.Provider value={{ session, toast: push, refreshCounts: loadCounts, site }}>
      <div className="adm">
        <div className="adm-shell">
          <aside className="adm-rail">
            <div className="adm-rail-top">
              <Link href={`/${site}`} className="adm-logo">
                <img src={SITES[site].logo} alt="" />
                <span><b>{SITES[site].label}</b><small>Website admin</small></span>
              </Link>
              <div className="adm-sites" role="group" aria-label="Website to manage">
                {Object.entries(SITES).map(([k, v]) => (
                  <button key={k} type="button" aria-pressed={site === k} className={`adm-site s-${k}`} onClick={() => setSite(k)}>
                    <img src={v.logo} alt="" /><span>{v.short}</span>
                  </button>
                ))}
              </div>
            </div>
            <nav className="adm-nav" aria-label="Console sections">
              {GROUPS.map(group => {
                const inGroup = items.filter(n => n.group === group);
                if (!inGroup.length) return null;
                return (
                  <div key={group} className="adm-nav-group">
                    <div className="adm-nav-label">{group}</div>
                    {inGroup.map(({ href, label: rawLabel, Icon, count }) => {
                      const label = typeof rawLabel === 'string' ? rawLabel : rawLabel[site];
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
