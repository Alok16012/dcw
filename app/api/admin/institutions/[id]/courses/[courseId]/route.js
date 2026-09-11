import { findInstitution, updateCourse, deleteCourse } from '@/lib/institutions-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

/* Same capability the rest of the catalogue uses. Counselling staff are the
   people who get told a fee has changed, so the guard is `catalogue:write`
   rather than the admin role this route was originally pinned to. */
function resolve(request, id) {
  const { error, session } = requirePermission(request, 'catalogue:write');
  if (error) return { error };
  const institution = findInstitution(id);
  if (!institution) return { error: fail(404, 'NOT_FOUND', `No institution "${id}".`) };
  return { session, institution };
}

export async function PATCH(request, { params }) {
  const { id, courseId } = await params;
  const { error, institution } = resolve(request, id);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const result = updateCourse(institution.id, courseId, body);
  if (!result.ok) {
    return result.errors
      ? fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors })
      : fail(404, 'NOT_FOUND', `No course "${courseId}" at ${institution.name}.`);
  }
  // Fee schedules already issued keep the figures the student agreed to; only
  // applications made from here on use the new one.
  return ok({ course: result.course, note: 'Existing fee plans are unchanged.' });
}

export async function DELETE(request, { params }) {
  const { id, courseId } = await params;
  const { error, institution } = resolve(request, id);
  if (error) return error;
  const hard = request.nextUrl.searchParams.get('hard') === 'true';

  const result = deleteCourse(institution.id, courseId, { hard });
  if (!result.ok) {
    if (result.error === 'LAST_COURSE') {
      return fail(409, 'LAST_COURSE', 'This is the only course on the listing. Retire the listing instead.');
    }
    return fail(404, 'NOT_FOUND', `No course "${courseId}" at ${institution.name}.`);
  }
  return ok({ course: result.course, hard: result.hard });
}
