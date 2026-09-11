import { findInstitution, updateInstitution, deleteInstitution, addCourse, publishChecklist } from '@/lib/institutions-repo.js';
import { listAdmissions, pipelineStats } from '@/lib/integrations/admissions.js';
import { listDocuments } from '@/lib/document-store.js';
import { listReviews, summariseReviews } from '@/lib/reviews-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, readJson } from '@/lib/http.js';

function resolve(request, id, capability = 'catalogue:write') {
  const { error, session } = requirePermission(request, capability);
  if (error) return { error };
  const institution = findInstitution(id);
  if (!institution) return { error: fail(404, 'NOT_FOUND', `No institution "${id}".`) };
  return { session, institution };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { error, institution } = resolve(request, id, 'catalogue:read');
  if (error) return error;
  ensureSeeded();
  return ok({
    institution,
    // Everything the editor screen shows about this one listing, in one request:
    // the pipeline against it, the files filed under it, the reviews written
    // about it, and what is still missing before it can be published.
    admissions: listAdmissions({ institutionId: institution.id }),
    pipeline: pipelineStats({ institutionId: institution.id }),
    documents: listDocuments({ institutionId: institution.id, includeInternal: true }),
    reviews: listReviews({ institutionId: institution.id, includeUnpublished: true }),
    reviewSummary: summariseReviews({ institutionId: institution.id }),
    checklist: publishChecklist(institution)
  });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { error, institution, session } = resolve(request, id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = updateInstitution(institution.id, body, { actor: session.name });
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', 'Institution disappeared.');
  }
  return ok({ institution: result.institution });
}

/** Adds a course to this institution. Courses live under their institution
 *  rather than in a table of their own, because a course without one is not a
 *  thing anybody can apply to. */
export async function POST(request, { params }) {
  const { id } = await params;
  const { error, institution } = resolve(request, id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = addCourse(institution.id, body);
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', 'Institution disappeared.');
  }
  return ok({ course: result.course, institution: result.institution }, { status: 201 });
}

/** Soft delete by default: people have live applications against this listing
 *  and the pipeline has to stay readable. ?hard=true only when it never ran. */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error, institution } = resolve(request, id);
  if (error) return error;
  const hard = request.nextUrl.searchParams.get('hard') === 'true';
  const result = deleteInstitution(institution.id, { hard });
  if (!result.ok) return fail(404, 'NOT_FOUND', 'Institution disappeared.');
  return ok({ institution: result.institution, hard: result.hard });
}
