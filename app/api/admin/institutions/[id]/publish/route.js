/**
 * The review step between "someone added a college" and "it is on the site".
 *
 * The client asked for a listing flow with a preview and an explicit publish.
 * That only means anything if publishing is its own action with its own check —
 * which is why PATCH on the institution deliberately refuses to write `status`.
 * A listing goes live here, after publishChecklist() says it is complete, or
 * with ?force=true when an admin has read the warnings and accepted them.
 */
import { findInstitution, publishInstitution, unpublishInstitution, publishChecklist } from '@/lib/institutions-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const { error } = requirePermission(request, 'catalogue:read');
  if (error) return error;
  const institution = findInstitution(id);
  if (!institution) return fail(404, 'NOT_FOUND', `No institution "${id}".`);
  return ok({ status: institution.status ?? 'published', checklist: publishChecklist(institution) });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { error, session } = requirePermission(request, 'catalogue:write');
  if (error) return error;

  const force = request.nextUrl.searchParams.get('force') === 'true';
  const result = publishInstitution(id, { actor: session.name, force });
  if (!result.ok) {
    if (result.error === 'NOT_FOUND') return fail(404, 'NOT_FOUND', `No institution "${id}".`);
    // 409, not 422: nothing the request said is wrong, the listing is simply
    // not finished. The checklist tells the console exactly what to fix.
    return fail(409, 'INCOMPLETE', 'This listing is not ready to go live yet.', {
      checklist: { ready: false, blocking: result.blocking, warnings: result.warnings }
    });
  }
  return ok({
    institution: result.institution,
    checklist: { ready: result.ready, blocking: result.blocking, warnings: result.warnings },
    forced: force && !result.ready
  });
}

/** Takes a listing back off the site without deleting it or its applications. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, session } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const result = unpublishInstitution(id, { actor: session.name });
  if (!result.ok) return fail(404, 'NOT_FOUND', `No institution "${id}".`);
  return ok({ institution: result.institution });
}
