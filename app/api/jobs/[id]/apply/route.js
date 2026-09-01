import { getJob } from '@/lib/store.js';
import { upsertLead } from '@/lib/integrations/crm.js';
import { apply as fileApplication } from '@/lib/integrations/ats.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
import { isValidPhone, isPhoneVerified } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request, { params }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return fail(404, 'NOT_FOUND', `No job "${id}".`);

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!body.name?.trim()) return fail(422, 'NAME_REQUIRED', 'Name is required.');
  if (!isValidPhone(body.phone)) return fail(422, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');

  ensureSeeded();
  const { lead, duplicate } = upsertLead({
    vertical: 'jobs', name: body.name, phone: body.phone, city: body.city,
    qualification: body.qualification, interestType: 'job', interestId: job.id,
    associateCode: body.associateCode, phoneVerified: isPhoneVerified(body.phone),
    source: body.source ?? {}
  });
  // The lead is the counselling relationship; the application is the hiring one.
  // Both are created so the candidate shows up in the recruiter pipeline too.
  const filed = fileApplication({
    jobId: job.id, jobTitle: job.title, companyId: job.companyId,
    name: body.name, phone: body.phone, email: body.email, city: body.city,
    qualification: body.qualification, experienceYears: body.experienceYears,
    resumeUrl: body.resumeUrl, leadId: lead.id, source: body.source ?? {}
  });
  const wa = sendTemplate({ phone: lead.phone, template: 'job_applied', vars: { job: job.title } });

  return ok({ application: { id: filed.application.id, jobId: job.id, title: job.title,
      status: filed.application.status, appliedAt: filed.application.appliedAt },
    lead: { id: lead.id, crmLeadId: lead.crmLeadId, status: lead.status, assignedTo: lead.assignedTo },
    duplicate: duplicate || filed.duplicate, whatsapp: wa.queued });
}
