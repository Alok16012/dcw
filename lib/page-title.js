/* Titles for the public site.
 *
 * Every public URL is served by one catch-all route, so before this existed
 * all ~30 of them shared the single default title from layout.jsx — the same
 * text in every bookmark, every shared link, every search result, and as the
 * first thing a screen reader announces on load.
 *
 * This is a pure function of the route so it can be resolved on the server, in
 * generateMetadata, and land in the initial HTML. Two earlier attempts set
 * document.title from the client and both were wrong: an effect loses a race
 * with Next's own metadata (it only appeared to work on detail routes, whose
 * effect re-runs later when the catalogue resolves), and a rendered <title>
 * hoisted by React is appended alongside the ones Next already emitted,
 * leaving three title elements with the default still winning on document
 * order. A crawler that does not run JavaScript would have seen the default in
 * either case, which is the whole point of having a title.
 *
 * Deliberately not derived from the page's <h1>. On the hero pages the h1 is
 * marketing copy split across a <br> — "Less searching.<br>More moving
 * forward." — which reads as one run-on word and names neither the site
 * section nor the subject.
 */
const LABEL = {distance:'Distance courses', colleges:'Colleges', jobs:'Jobs'};

/** @param {string} path @param {string} vertical @param {string|null} entityName */
export function titleFor(path, vertical, entityName) {
  if (entityName) return entityName;
  if (!path || path === '/') return null;           // home keeps the site title
  if (path === '/about') return 'About us';
  if (path.startsWith('/blog')) return 'Blog';
  if (path === '/reviews') return 'Student reviews';
  if (path === '/saved') return 'Saved for later';
  if (path === '/applications') return 'Your applications';
  if (path === '/notifications') return 'Notifications';
  if (path === '/profile') return 'Your profile';
  if (path === '/automations') return 'Automations';
  if (path.endsWith('/compare')) return `Compare ${(LABEL[vertical] || '').toLowerCase()}`;
  if (path.includes('resume-builder')) return 'Resume builder';
  if (path.includes('neet-predictor')) return 'NEET rank predictor';
  if (path.includes('boards')) return 'Open school boards';
  if (path.includes('/search') || path.includes('/list') || path.includes('universities'))
    return vertical === 'jobs' ? 'Search jobs' : `Search ${(LABEL[vertical] || '').toLowerCase()}`;
  return LABEL[vertical] || null;
}

export default titleFor;
