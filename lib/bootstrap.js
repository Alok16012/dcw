/** Seeds the demo applicant pipeline once per process so the console is never empty. */
import { listJobs } from './jobs-repo.js';
import { seedApplications } from './integrations/ats.js';

let done = false;
export function ensureSeeded() {
  if (done) return;
  done = true;
  seedApplications(listJobs());
}
