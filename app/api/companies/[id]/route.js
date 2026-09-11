/**
 * One employer, as a candidate sees it.
 *
 * The job detail page already knows the posting; what it does not know is what
 * the company has put on the record about itself — the Proof of Work an admin
 * filed against it (requirement 8). That is this route's whole job, so it
 * returns the company's public fields and its evidence, and nothing internal.
 */
import { findCompany } from '@/lib/jobs-repo.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail } from '@/lib/http.js';

export async function GET(_request, { params }) {
  const { id } = await params;
  ensureSeeded();
  const company = findCompany(id);
  if (!company) return fail(404, 'NOT_FOUND', `No employer "${id}".`);
  return ok({
    id: company.id, name: company.name, mark: company.mark,
    about: company.about ?? '', isVerified: !!company.isVerified,
    proofOfWork: company.proofOfWork ?? []
  });
}
