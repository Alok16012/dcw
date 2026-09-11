/**
 * Serves a supporting document — an approval letter, a result sheet, a prospectus.
 *
 * Unlike a resume (/api/resumes/[id]), these are meant to be seen: a UGC
 * entitlement letter nobody can open proves nothing. So there is no session
 * check for a public document, only for one an admin marked `internal`.
 *
 * The id is a UUID, which is what keeps an internal document from being found by
 * guessing rather than by permission.
 */
import { getDocument } from '@/lib/document-store.js';
import { sessionFromRequest } from '@/lib/auth.js';
import { fail } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) return fail(404, 'NOT_FOUND', 'That document is not on file.');

  if (doc.internal) {
    const session = sessionFromRequest(request);
    if (!session || !['admin', 'staff'].includes(session.role)) {
      return fail(403, 'FORBIDDEN', 'That document is not public.');
    }
  }

  return new Response(Buffer.from(doc.bytes, 'base64'), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(doc.sizeBytes),
      // inline, not attachment: an approval certificate should open in the tab
      // next to the claim it supports, not land in a downloads folder.
      'Content-Disposition': `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
      'Cache-Control': doc.internal ? 'private, no-store' : 'public, max-age=3600'
    }
  });
}
