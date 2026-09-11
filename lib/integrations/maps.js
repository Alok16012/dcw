/**
 * Google Maps + Google Business Profile adapter.
 *
 * WHAT GOOGLE ACTUALLY ALLOWS
 *   The Places API returns a place's `rating`, `userRatingCount` and up to
 *   FIVE reviews. There is no endpoint that returns all of them, and the terms
 *   forbid storing review text or scraping the page for more. So this module
 *   returns what the official API returns, labels it as Google's, and links out
 *   to the place page for the rest. Anything that claimed a full review corpus
 *   would be a claim the API cannot back.
 *
 *   Google ratings are therefore kept separate from DCW's own reviews
 *   (lib/reviews-repo.js) everywhere they are shown. Averaging the two would
 *   produce a number neither party stands behind.
 *
 * CREDENTIALS (live driver only)
 *   GOOGLE_MAPS_API_KEY          server key, Places API (New) enabled, IP-restricted
 *   GOOGLE_MAPS_BROWSER_KEY      optional separate key for the <iframe> embed;
 *                                falls back to GOOGLE_MAPS_API_KEY. This one is
 *                                public by nature, so restrict it by HTTP referrer.
 *
 * An institution is mapped by storing its Place ID (`google.placeId`) from the
 * admin console. Latitude and longitude are cached alongside it so the map and
 * the distance maths work even before a Places call is made — and so the public
 * page never needs a key at all when the embed is not wanted.
 */
import { isDemo, requireLiveConfig } from './index.js';

const PLACES = 'https://places.googleapis.com/v1/places';

export const MAPS_ENV = ['GOOGLE_MAPS_API_KEY'];
export const hasMapsKey = () => Boolean(process.env.GOOGLE_MAPS_API_KEY);

/** A place page anyone can open, with or without a key. */
export const placeUrl = google => {
  if (!google) return null;
  if (google.mapsUrl) return google.mapsUrl;
  if (google.placeId) return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(google.placeId)}`;
  if (google.lat != null && google.lng != null) return `https://www.google.com/maps/search/?api=1&query=${google.lat},${google.lng}`;
  return null;
};

/** Turn-by-turn from wherever the person is. Needs no key. */
export const directionsUrl = (google, name = '') => {
  if (google?.placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}&destination_place_id=${encodeURIComponent(google.placeId)}`;
  }
  if (google?.lat != null && google?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${google.lat},${google.lng}`;
  }
  return null;
};

/**
 * The <iframe> src for an embedded map.
 *
 * Returns null without a browser key rather than rendering a broken frame — the
 * detail page falls back to the "Open in Google Maps" link, which always works.
 */
export function embedUrl(google) {
  const key = process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key || !google) return null;
  if (google.placeId) return `https://www.google.com/maps/embed/v1/place?key=${key}&q=place_id:${google.placeId}`;
  if (google.lat != null && google.lng != null) {
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${google.lat},${google.lng}&zoom=15`;
  }
  return null;
}

/**
 * Rating, review count and up to five reviews for one place.
 *
 * Demo driver replays whatever the catalogue already stores on `google`, so the
 * page layout and the admin console are exercisable with no key. It never
 * invents a rating: an institution with no `google.rating` returns
 * `available:false`, and the UI says the listing is not mapped yet.
 *
 * @param {{placeId?:string, cached?:Object}} input
 */
export async function placeDetails({ placeId, cached = null }) {
  if (!placeId) return { available: false, reason: 'NOT_MAPPED' };

  if (isDemo) {
    if (!cached || cached.rating == null) return { available: false, reason: 'NO_CACHED_RATING', placeId };
    return {
      available: true, source: 'demo', placeId,
      rating: cached.rating, total: cached.reviews ?? 0,
      reviews: cached.sampleReviews ?? [],
      url: placeUrl({ placeId, ...cached }),
      fetchedAt: null,
      note: 'Demo driver: replayed from the catalogue. Set GOOGLE_MAPS_API_KEY and DCW_INTEGRATION_DRIVER=live for the real figure.'
    };
  }

  requireLiveConfig('maps', MAPS_ENV);
  // Places API (New) needs an explicit field mask; asking for everything is
  // billed at the most expensive SKU.
  const fields = 'id,displayName,rating,userRatingCount,googleMapsUri,location,reviews';
  let res, json;
  try {
    res = await fetch(`${PLACES}/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': fields
      },
      // Google's figures move slowly and this sits on a public page; an hour of
      // cache is the difference between one call and one call per visitor.
      next: { revalidate: 3600 }
    });
    json = await res.json().catch(() => null);
  } catch (e) {
    return { available: false, reason: 'TRANSPORT', message: e.message, placeId };
  }
  if (!res.ok) {
    return { available: false, reason: 'GOOGLE_ERROR', message: json?.error?.message ?? `HTTP ${res.status}`, placeId };
  }

  return {
    available: json?.rating != null, source: 'google', placeId,
    name: json?.displayName?.text ?? null,
    rating: json?.rating ?? null, total: json?.userRatingCount ?? 0,
    lat: json?.location?.latitude ?? null, lng: json?.location?.longitude ?? null,
    url: json?.googleMapsUri ?? placeUrl({ placeId }),
    // Capped at five by Google, not by us.
    reviews: (json?.reviews ?? []).slice(0, 5).map(r => ({
      author: r.authorAttribution?.displayName ?? 'Google user',
      rating: r.rating ?? null,
      text: r.originalText?.text ?? r.text?.text ?? '',
      when: r.relativePublishTimeDescription ?? null
    })),
    fetchedAt: new Date().toISOString()
  };
}

/** Normalises whatever the admin console typed into the stored `google` block. */
export function normaliseGoogle(input) {
  if (!input || typeof input !== 'object') return null;
  const lat = input.lat === '' || input.lat == null ? null : Number(input.lat);
  const lng = input.lng === '' || input.lng == null ? null : Number(input.lng);
  const placeId = String(input.placeId ?? '').trim() || null;
  const mapsUrl = String(input.mapsUrl ?? '').trim() || null;
  if (!placeId && !mapsUrl && lat == null && lng == null) return null;
  return {
    placeId, mapsUrl,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    address: String(input.address ?? '').trim() || null,
    rating: input.rating === '' || input.rating == null ? null : Number(input.rating),
    reviews: input.reviews === '' || input.reviews == null ? null : Number(input.reviews)
  };
}
