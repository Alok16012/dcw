import { institutions, jobs } from '@/lib/data/index.js';
import { DRIVER } from '@/lib/integrations/index.js';
import { ok } from '@/lib/http.js';

export async function GET() {
  return ok({ status: 'up', driver: DRIVER, counts: { institutions: institutions.length, jobs: jobs.length } });
}
