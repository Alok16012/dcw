/**
 * Serves one resume.
 *
 * The id is an unguessable UUID, but obscurity is not access control: the file
 * is a person's CV, with their address and history in it. Two callers may read
 * it — the candidate whose verified number it was saved under, and signed-in
 * staff who have an application to review. Everything else gets a 404 rather
 * than a 403, so this route cannot be used to confirm that an id exists.
 */
import { getResume } from '@/lib/resume-store.js';
import { applicantFromRequest } from '@/lib/applicant.js';
import { sessionFromRequest } from '@/lib/auth.js';
import { fail } from '@/lib/http.js';

export async function GET(request, { params }) {
  const { id } = await params;
  const resume = getResume(id);
  if (!resume) return fail(404, 'NOT_FOUND', 'That resume is not on file.');

  const applicant = applicantFromRequest(request);
  const staff = sessionFromRequest(request);
  const mine = applicant?.phone === resume.phone;
  const recruiter = !!staff && ['admin', 'employer'].includes(staff.role);
  if (!mine && !recruiter) return fail(404, 'NOT_FOUND', 'That resume is not on file.');

  // A builder resume is structured data: the console renders it, so it is
  // returned as JSON rather than pushed at the browser as a download.
  if (resume.kind === 'builder') {
    return Response.json({ ok: true, data: { resume: { id: resume.id, kind: 'builder',
      name: resume.name, fileName: resume.fileName, builder: resume.builder } } });
  }

  const bytes = Buffer.from(resume.bytes, 'base64');
  return new Response(bytes, { status: 200, headers: {
    'Content-Type': resume.mimeType,
    'Content-Length': String(bytes.length),
    'Content-Disposition': `inline; filename="${resume.fileName.replace(/"/g, '')}"`,
    // A CV must not sit in a shared cache between two different viewers.
    'Cache-Control': 'private, no-store'
  }});
}
