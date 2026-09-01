/**
 * Generated from the live dataset (PRD §13.5 — per-vertical sitemaps).
 * Previously /sitemap.xml was swallowed by the [[...slug]] catch-all and served HTML.
 */
import { institutions, jobs } from '@/lib/data/index.js';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function sitemap() {
  const now = new Date();
  const entry = (path, priority, changeFrequency = 'weekly') => ({
    url: `${site}${path}`, lastModified: now, changeFrequency, priority
  });

  return [
    entry('/', 1),
    entry('/distance', 0.9, 'daily'),
    entry('/colleges', 0.9, 'daily'),
    entry('/jobs', 0.9, 'daily'),
    entry('/boards', 0.7),
    entry('/compare', 0.5),
    ...institutions.filter(i => i.isActive)
      .map(i => entry(`/${i.vertical}/${i.vertical === 'colleges' ? 'college' : 'university'}/${i.slug}`, 0.8)),
    ...jobs.filter(j => j.isActive)
      .map(j => entry(`/jobs/${j.slug}`, 0.7, 'daily'))
  ];
}
