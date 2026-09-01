import { getJob } from '@/lib/store.js';
import { upsertLead } from '@/lib/integrations/crm.js';
import { sendTemplate } from '@/lib/integrations/whatsapp.js';
import { isValidPhone } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request, { params }) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return fail(404, 'NOT_FOUND', `No job "${id}".`);

  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!body.name?.trim()) return fail(422, 'NAME_REQUIRED', 'Name is required.');
  if (!isValidPhone(body.phone)) return fail(422, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');

  const { lead, duplicate } = upsertLead({
    vertical: 'jobs', name: body.name, phone: body.phone, city: body.city,
    qualification: body.qualification, interestType: 'job', interestId: job.id,
    associateCode: body.associateCode, phoneVerified: !!body.phoneVerified,
    source: body.source ?? {}
  });
  const wa = sendTemplate({ phone: lead.phone, template: 'job_applied', vars: { job: job.title } });

  return ok({ application: { jobId: job.id, title: job.title, status: 'Submitted', appliedAt: new Date().toISOString() },
    lead: { id: lead.id, crmLeadId: lead.crmLeadId, status: lead.status, assignedTo: lead.assignedTo },
    duplicate, whatsapp: wa.queued });
}
