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
import { listInstitutions, createInstitution, catalogueStats, publishChecklist, INSTITUTION_ENUMS } from '@/lib/institutions-repo.js';
import { countsByInstitution } from '@/lib/integrations/admissions.js';
import { requirePermission } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  // Counselling staff read the catalogue all day — they are the people who get
  // asked "is this fee current?" — so reading is a capability, not a role.
  const { error } = requirePermission(request, 'catalogue:read');
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
  // 'active'/'inactive' are the switch the console always had. 'draft',
  // 'published' and 'archived' are the publishing state, which is a different
  // question — a draft is not an archived listing — so both filters are kept.
  if (status === 'active') rows = rows.filter(i => i.isActive !== false);
  else if (status === 'inactive') rows = rows.filter(i => i.isActive === false);
  else if (status) rows = rows.filter(i => (i.status ?? 'published') === status);

  // Applicant counts travel with the row: an admin deciding whether to retire a
  // listing needs to know how many people are mid-application against it.
  const counts = countsByInstitution();
  return ok({
    rows: rows.map(i => ({
      ...i,
      applicants: counts.get(i.id) ?? { total: 0, new: 0, enrolled: 0 },
      // So the list can show "3 things missing" without opening every listing.
      checklist: publishChecklist(i)
    })),
    stats: catalogueStats(),
    enums: INSTITUTION_ENUMS
  });
}

export async function POST(request) {
  const { error, session } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = createInstitution(body, { actor: session.name });
  if (!result.ok) return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
  // A new listing is a draft. The checklist tells the console what is still
  // missing before it can go live, which is the whole point of the review step.
  return ok({ institution: result.institution, checklist: publishChecklist(result.institution) }, { status: 201 });
}
