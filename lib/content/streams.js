/* Colleges vertical: the subject a college teaches, and the country it is in.
   ---------------------------------------------------------------------------
   The six cards on the /colleges home page all pointed at /colleges/search with
   no filter, so "Medical", "Law" and "Study abroad" were three different
   promises leading to one identical list of eight colleges. These constants are
   what makes each of them mean something.

   The spellings are the seed's own (lib/data/institutions.js records `stream`
   per course), not a second vocabulary invented here, so a college added in the
   admin console lands on the right card without anyone updating a mapping.

   Note what is deliberately absent: nothing here invents a Law or a Management
   college. The catalogue currently holds seven medical colleges and one
   engineering institute; a filter for a stream nobody has published yet returns
   nothing, and the listing says so in plain words. That is the honest state of
   the data, and it is visible rather than hidden behind an unfiltered list. */

export const STREAMS = ['Medical', 'Engineering', 'Management', 'Commerce', 'Law'];

/** The study-abroad card is not a stream — it is a question about location, so
 *  it travels as its own query parameter. */
export const ABROAD_LABEL = 'Studying abroad';

/** @param {string|null} v @returns {string|null} the stream, if we offer it. */
export function readStream(v) {
  return STREAMS.includes(v) ? v : null;
}

/** True when the row teaches this stream. A row whose projection predates the
 *  `streams` field (or a college whose courses record no stream) is not ruled
 *  out — an institution the catalogue knows less about should not silently
 *  vanish from a list it may well belong on. */
export function matchesStream(row, stream) {
  if (!stream) return true;
  const s = row.streams;
  return !Array.isArray(s) || s.length === 0 || s.includes(stream);
}

/** True when the row is outside India. `country` is only absent on rows from an
 *  older projection, and the same benefit of the doubt applies. */
export function isAbroad(row) {
  return row.country != null && row.country !== 'India';
}
