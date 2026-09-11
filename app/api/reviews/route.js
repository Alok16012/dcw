/**
 * Reviews, read and written by the public.
 *
 * The same store answers every surface (client requirement 11): no filter is the
 * /reviews page, `?institutionId=` is a college's detail page, adding
 * `?courseName=` narrows to one programme, and `?companyId=` is an employer on
 * Berojgar Bharat. One record, four places, no copies.
 *
 * A submitted review is held as `pending` and does not appear until it is
 * approved in /admin — a public review page is somewhere a real institution can
 * be defamed, and "it was a user" is not a defence anybody accepts.
 */
import { listReviews, summariseReviews, addReview, markHelpful } from '@/lib/reviews-repo.js';
import { ok, fail, readJson, VERTICAL_SET } from '@/lib/http.js';

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const filter = {
    vertical: VERTICAL_SET.has(sp.get('vertical')) ? sp.get('vertical') : undefined,
    institutionId: sp.get('institutionId') ?? undefined,
    courseName: sp.get('courseName') ?? undefined,
    jobId: sp.get('jobId') ?? undefined,
    companyId: sp.get('companyId') ?? undefined,
    boardId: sp.get('boardId') ?? undefined
  };
  const rows = listReviews(filter);
  const limit = Number(sp.get('limit') ?? 0);
  return ok({
    rows: limit > 0 ? rows.slice(0, limit) : rows,
    total: rows.length,
    summary: summariseReviews(filter)
  });
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const result = addReview(body);
  if (!result.ok) return fail(422, 'VALIDATION', 'Check the highlighted fields.', { errors: result.errors });
  return ok({
    review: result.review,
    message: 'Thanks — your review goes live once our team has checked it.'
  }, { status: 201 });
}

/** "This was helpful". Its own verb because it changes a count, not a review. */
export async function PATCH(request) {
  const body = await readJson(request);
  if (!body?.id) return fail(400, 'ID_REQUIRED', 'Say which review.');
  const result = markHelpful(body.id);
  if (!result.ok) return fail(404, 'NOT_FOUND', 'That review is not available.');
  return ok({ review: result.review });
}
