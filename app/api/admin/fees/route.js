/**
 * Fee collection.
 *
 * The client's question was "how much do I have to collect in a particular
 * month" — so the GET is built around a month, not around a list of students:
 * expected, collected, outstanding, and what is already overdue measured
 * against today rather than against the end of the month. The trailing book
 * gives it a shape to compare against.
 *
 * The POST records a payment against one instalment. Admin only: an employer
 * has no business in the education ledger.
 */
import { collectionSummary, monthlyBook, listPayments, recordPayment,
  getPlan, outstandingOf, paidOf, nextDue, PAYMENT_METHODS, thisMonth } from '@/lib/fees.js';
import { requireRole } from '@/lib/auth.js';
import { ensureSeeded } from '@/lib/bootstrap.js';
import { ok, fail, num, readJson } from '@/lib/http.js';

export async function GET(request) {
  const { error } = requireRole(request, ['admin']);
  if (error) return error;
  ensureSeeded();

  const sp = request.nextUrl.searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.get('month') ?? '') ? sp.get('month') : thisMonth();

  return ok({
    month,
    summary: collectionSummary({ month }),
    book: monthlyBook({ months: num(sp.get('months'), 6), endMonth: month }),
    payments: listPayments({ month }),
    methods: PAYMENT_METHODS
  });
}

export async function POST(request) {
  const { error, session } = requireRole(request, ['admin']);
  if (error) return error;
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  if (!body.planId) return fail(422, 'PLAN_REQUIRED', 'Say which fee plan this payment is against.');

  const n = Number(body.instalment);
  if (!Number.isInteger(n) || n < 1) return fail(422, 'BAD_INSTALMENT', 'Pick an instalment to receipt.');

  const result = recordPayment(body.planId, n, {
    amount: body.amount, method: body.method, reference: body.reference, actor: session.name
  });
  if (!result.ok) {
    const status = result.error === 'NOT_FOUND' ? 404 : result.error === 'OVER_PAYMENT' ? 409 : 422;
    const message = result.message ?? {
      NOT_FOUND: 'That fee plan no longer exists.',
      NO_SUCH_INSTALMENT: 'That plan has no such instalment.',
      ALREADY_PAID: 'That instalment is already settled.',
      BAD_METHOD: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}.`
    }[result.error] ?? 'That payment could not be recorded.';
    return fail(status, result.error, message, result.allowed ? { allowed: result.allowed } : {});
  }

  const plan = getPlan(body.planId);
  return ok({
    receipt: result.receipt,
    plan: { ...plan, paid: paidOf(plan), outstanding: outstandingOf(plan), next: nextDue(plan) },
    summary: collectionSummary({ month: thisMonth() })
  }, { status: 201 });
}
