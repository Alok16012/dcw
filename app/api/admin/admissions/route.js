/**
 * The counselling pipeline console.
 *
 * Its recruiting counterpart is /api/admin/applications (ATS). This one covers
 * the education side, where the stages are documents and verification rather
 * than interviews, and where money follows the file — so each row carries its
 * fee position with it.
 */
import { listAdmissions, pipelineStats, ALL_STATUSES, STAGES } from '@/lib/integrations/admissions.js';
import { planForApplication, outstandingOf, paidOf } from '@/lib/fees.js';
import { requireRole } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requireRole(request, ['admin']);
  if (error) return error;
  ensureSeeded();

  const sp = request.nextUrl.searchParams;
  const rows = listAdmissions({
    institutionId: sp.get('institutionId') ?? undefined,
    vertical: sp.get('vertical') ?? undefined,
    status: sp.get('status') ?? undefined,
    q: sp.get('q') ?? undefined,
    sort: sp.get('sort') ?? undefined
  }).map(a => {
    const plan = planForApplication(a.id);
    return { ...a, fee: plan
      ? { planId: plan.id, totalFee: plan.totalFee, paid: paidOf(plan), outstanding: outstandingOf(plan) }
      : null };
  });

  return ok({
    rows,
    pipeline: pipelineStats({
      institutionId: sp.get('institutionId') ?? undefined,
      vertical: sp.get('vertical') ?? undefined
    }),
    stages: STAGES,
    statuses: ALL_STATUSES
  });
}
