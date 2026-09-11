/** Review moderation: the queue behind the public /api/reviews POST. */
import { listReviews, setReviewStatus, summariseReviews } from '@/lib/reviews-repo.js';
import { requirePermission } from '@/lib/auth.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requirePermission(request, 'catalogue:read');
  if (error) return error;
  const sp = request.nextUrl.searchParams;
  const rows = listReviews({
    includeUnpublished: true,
    vertical: sp.get('vertical') ?? undefined,
    institutionId: sp.get('institutionId') ?? undefined
  });
  const status = sp.get('status');
  return ok({
    rows: status ? rows.filter(r => r.status === status) : rows,
    pending: rows.filter(r => r.status === 'pending').length,
    summary: summariseReviews({})
  });
}

export async function PATCH(request) {
  const { error } = requirePermission(request, 'catalogue:write');
  if (error) return error;
  const body = await readJson(request);
  if (!body?.id || !body?.status) return fail(400, 'BAD_REQUEST', 'Send an id and a status.');
  const result = setReviewStatus(body.id, body.status);
  if (!result.ok) {
    return result.error === 'BAD_STATUS'
      ? fail(422, 'BAD_STATUS', 'Status must be published, pending or rejected.')
      : fail(404, 'NOT_FOUND', 'No such review.');
  }
  return ok({ review: result.review });
}
