/* Server half of the public catch-all route.
 *
 * The whole site is one client component, which is why it had no per-page
 * metadata: `generateMetadata` is Server Components only, so a client page
 * cannot export it. The documented remedy (next/dist/docs/01-app/
 * 03-api-reference/04-functions/generate-metadata.md, "Why generateMetadata is
 * Server Component only") is exactly this split — keep page.jsx on the server
 * and move the interactive half to its own file. SiteApp is that file,
 * unchanged apart from its name.
 *
 * Resolving the title here rather than in the browser means it is in the HTML
 * of the first response, which is the version a crawler and a link preview
 * actually read.
 */
import SiteApp from './site-app.jsx';
import {titleFor} from '@/lib/page-title.js';
import {getInstitution, getJob} from '@/lib/store.js';

const VERTICALS = ['distance', 'colleges', 'jobs'];

/* A detail URL is /jobs/:id or /<vertical>/university|college/:id. Anything
   else has no entity, and a miss returns null so the route still gets its
   section title rather than a title built from a slug the catalogue has never
   heard of. */
function entityNameFor(segments, vertical) {
  if (segments.length < 2) return null;
  const id = segments[segments.length - 1];
  if (vertical === 'jobs') return getJob(id)?.card?.name ?? null;
  return getInstitution(vertical, id)?.card?.name ?? null;
}

export async function generateMetadata({params}) {
  const {slug} = await params;
  const segments = Array.isArray(slug) ? slug : [];
  const path = '/' + segments.join('/');
  const vertical = VERTICALS.includes(segments[0]) ? segments[0] : 'distance';
  const title = titleFor(path, vertical, entityNameFor(segments, vertical));
  /* No title means the home page, which keeps layout.jsx's default. Returning
     an empty object leaves that default in place; returning {title: undefined}
     would too, but saying nothing is clearer about the intent. */
  return title ? {title} : {};
}

export default function Page() {
  return <SiteApp/>;
}
