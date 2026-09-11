import { getInstitution } from '@/lib/store.js';
import { listReviews } from '@/lib/reviews-repo.js';
import { placeDetails, placeUrl, directionsUrl, embedUrl } from '@/lib/integrations/maps.js';
import { sessionFromRequest } from '@/lib/auth.js';
import { ok, fail, VERTICAL_SET } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { vertical, slug } = await params;
  if (!VERTICAL_SET.has(vertical)) return fail(404, 'UNKNOWN_VERTICAL', `No vertical "${vertical}".`);

  // An unpublished listing is a 404 to the public and a preview to whoever is
  // about to publish it — which is the point of having a review step at all.
  const session = sessionFromRequest(request);
  const canPreview = session && ['admin', 'staff'].includes(session.role);
  const inst = getInstitution(vertical, slug, { includeDrafts: canPreview });
  if (!inst) return fail(404, 'NOT_FOUND', `No institution "${slug}" in ${vertical}.`);

  // Google's rating is fetched and labelled separately from DCW's own reviews.
  // They measure different things, and Google's terms do not allow averaging
  // their number into someone else's.
  const google = inst.google?.placeId
    ? await placeDetails({ placeId: inst.google.placeId, cached: inst.google })
    : { available: false, reason: 'NOT_MAPPED' };

  // The three map links are built here rather than in the browser because the
  // embed carries a key. It is a referrer-restricted browser key by design (see
  // lib/integrations/maps.js), and when there is no key `embed` is null and the
  // page falls back to the plain "Open in Google Maps" link, which needs none.
  const map = inst.google
    ? {
        mapped: true,
        address: inst.google.address ?? null,
        embed: embedUrl(inst.google),
        place: placeUrl(inst.google),
        directions: directionsUrl(inst.google, inst.name)
      }
    : { mapped: false, address: null, embed: null, place: null, directions: null };

  return ok({
    ...inst,
    reviews: listReviews({ institutionId: inst.id }),
    googleRating: google,
    map,
    preview: canPreview && (inst.status ?? 'published') !== 'published'
  });
}
