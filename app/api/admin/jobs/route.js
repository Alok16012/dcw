import { listJobs, createJob, jobStats, listCompanies, JOB_ENUMS } from '@/lib/jobs-repo.js';
import { countsByJob } from '@/lib/integrations/ats.js';
import { requireRole, scopeToCompany } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

/** Every posting the caller may manage, with live applicant counts attached. */
export async function GET(request) {
  const { error, session } = requireRole(request, ['admin', 'employer']);
  if (error) return error;
  ensureSeeded();

  const company = scopeToCompany(session);
  const counts = countsByJob();
  let rows = listJobs({ includeInactive: true });
  if (company) rows = rows.filter(j => j.companyId === company);

  const q = request.nextUrl.searchParams.get('q');
  if (q) {
    const n = q.toLowerCase();
    rows = rows.filter(j => `${j.title} ${j.location} ${j.industry}`.toLowerCase().includes(n));
  }
  const status = request.nextUrl.searchParams.get('status');
  if (status === 'active') rows = rows.filter(j => j.isActive);
  if (status === 'inactive') rows = rows.filter(j => !j.isActive);

  return ok({
    rows: rows.map(j => ({ ...j, applicants: counts.get(j.id) ?? { total: 0, new: 0 } })),
    stats: jobStats(company ?? undefined),
    companies: listCompanies(),
    enums: JOB_ENUMS,
    scope: company ?? 'all'
  });
}

export async function POST(request) {
  const { error, session } = requireRole(request, ['admin', 'employer']);
  if (error) return error;

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  // An employer may only post under its own company, whatever the payload says.
  const company = scopeToCompany(session);
  const input = company ? { ...body, companyId: company, companyName: undefined } : body;

  const result = createJob(input, { actor: session.name });
  if (!result.ok) return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
  return ok({ job: result.job }, { status: 201 });
}
