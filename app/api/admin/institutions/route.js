/**
 * The catalogue console: every college, university and board DCW lists.
 *
 * This is the "what listings are there, what courses, what fees" half of the
 * admin panel. It writes to lib/institutions-repo.js, which is also what the
 * public site reads through lib/store.js — so a fee corrected here is the fee
 * the next visitor is quoted, with no second copy to forget about.
 *
 * Admin only. An employer's console is about their own jobs; the education
 * catalogue is not theirs to edit.
 */
import { listInstitutions, createInstitution, catalogueStats, INSTITUTION_ENUMS } from '@/lib/institutions-repo.js';
import { countsByInstitution } from '@/lib/integrations/admissions.js';
import { requireRole } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requireRole(request, ['admin']);
  if (error) return error;
  ensureSeeded();

  const sp = request.nextUrl.searchParams;
  let rows = listInstitutions({ includeInactive: true, vertical: sp.get('vertical') ?? undefined });

  const q = sp.get('q');
  if (q) {
    const n = q.toLowerCase();
    rows = rows.filter(i => `${i.name} ${i.city ?? ''} ${i.state ?? ''}`.toLowerCase().includes(n));
  }
  const status = sp.get('status');
  if (status === 'active') rows = rows.filter(i => i.isActive !== false);
  if (status === 'inactive') rows = rows.filter(i => i.isActive === false);

  // Applicant counts travel with the row: an admin deciding whether to retire a
  // listing needs to know how many people are mid-application against it.
  const counts = countsByInstitution();
  return ok({
    rows: rows.map(i => ({ ...i, applicants: counts.get(i.id) ?? { total: 0, new: 0, enrolled: 0 } })),
    stats: catalogueStats(),
    enums: INSTITUTION_ENUMS
  });
}

export async function POST(request) {
  const { error, session } = requireRole(request, ['admin']);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = createInstitution(body, { actor: session.name });
  if (!result.ok) return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
  return ok({ institution: result.institution }, { status: 201 });
}
