/**
 * Fee collection — instalment plans, receipts and the monthly collection book.
 *
 * An admission is a promise to pay; this module is the record of that promise
 * and of what has actually arrived against it. It answers the two questions the
 * business and the student each have, from one set of rows:
 *
 *   admin   — how much do I have to collect this month, and what is overdue?
 *   student — how much do I owe, and when is the next instalment due?
 *
 * A plan belongs to an admission application (lib/integrations/admissions.js)
 * and is cut from the course fee held in lib/institutions-repo.js, so an admin
 * who corrects a fee corrects the schedule the next applicant is given. Plans
 * already issued are NOT rewritten by a later fee change — a schedule someone
 * has been shown and has started paying is a commitment, not a cached view.
 *
 * PERSISTENCE: process memory, same caveat as the CRM adapters.
 * MONEY: whole rupees, integers only. No floating-point paise anywhere.
 */

const plans = [];
const payments = [];
let seq = 0;

const now = () => new Date().toISOString();
const digits = p => String(p ?? '').replace(/\D/g, '');
const planId = () => `FEE-${String(++seq).padStart(5, '0')}`;
const day = 86400000;
const iso = d => new Date(d).toISOString().slice(0, 10);
export const monthOf = isoDate => String(isoDate ?? '').slice(0, 7);
export const thisMonth = () => new Date().toISOString().slice(0, 7);

export const PAYMENT_METHODS = ['UPI', 'Card', 'Netbanking', 'Cash', 'Bank transfer'];

/**
 * The schedule a fee is broken into. Small fees are not worth three visits to a
 * payment page, so they stay whole; anything larger is split front-loaded,
 * because the registration share is what actually secures the seat.
 * Percentages are of the payable fee and the last instalment absorbs the
 * rounding, so the parts always sum to the whole.
 */
export function scheduleFor(totalFee, { start = Date.now() } = {}) {
  const fee = Math.max(0, Math.round(Number(totalFee) || 0));
  if (!fee) return [];
  const parts = fee <= 25000
    ? [{ label: 'Full fee', share: 1, offset: 7 }]
    : [{ label: 'Registration', share: 0.25, offset: 7 },
       { label: 'Second instalment', share: 0.4, offset: 45 },
       { label: 'Final instalment', share: 0.35, offset: 120 }];
  let allocated = 0;
  return parts.map((p, i) => {
    const last = i === parts.length - 1;
    const amount = last ? fee - allocated : Math.round(fee * p.share);
    allocated += amount;
    return { n: i + 1, label: p.label, amount, dueOn: iso(start + p.offset * day), paidAt: null, paidAmount: 0, method: null, reference: null };
  });
}

/**
 * @param {{applicationId:string,phone:string,name?:string,institutionId?:string,
 *          institutionName?:string,course?:string,totalFee:number,discount?:number,
 *          startAt?:string}} input
 */
export function createPlan(input) {
  const existing = plans.find(p => p.applicationId === input.applicationId);
  if (existing) return { ok: true, plan: existing, duplicate: true };

  const gross = Math.max(0, Math.round(Number(input.totalFee) || 0));
  const discount = Math.min(gross, Math.max(0, Math.round(Number(input.discount) || 0)));
  const payable = gross - discount;
  const plan = {
    id: planId(),
    applicationId: input.applicationId ?? null,
    kind: input.kind ?? 'admission',
    phone: digits(input.phone),
    name: String(input.name ?? '').trim(),
    institutionId: input.institutionId ?? null,
    institutionName: input.institutionName ?? null,
    course: input.course ?? null,
    grossFee: gross, discount, totalFee: payable,
    /* startAt exists for one caller: the demo seed, which has to produce a
       collection book with history in it. A plan created by the app always
       starts today. */
    instalments: scheduleFor(payable, { start: input.startAt ? new Date(input.startAt).getTime() : Date.now() }),
    createdAt: now(), updatedAt: now()
  };
  plans.push(plan);
  return { ok: true, plan, duplicate: false };
}

export const getPlan = id => plans.find(p => p.id === id) ?? null;
export const planForApplication = applicationId => plans.find(p => p.applicationId === applicationId) ?? null;
export const plansForPhone = phone => plans.filter(p => p.phone === digits(phone));
export const listPlans = ({ institutionId, unpaidOnly = false } = {}) => plans.filter(p =>
  (!institutionId || p.institutionId === institutionId) && (!unpaidOnly || outstandingOf(p) > 0));

export const paidOf = plan => plan.instalments.reduce((n, i) => n + (i.paidAmount || 0), 0);
export const outstandingOf = plan => Math.max(0, plan.totalFee - paidOf(plan));

/** The next instalment still owed, or null when the plan is settled. */
export function nextDue(plan) {
  return plan.instalments.find(i => !i.paidAt || i.paidAmount < i.amount) ?? null;
}

/**
 * Records money against one instalment. A short payment is recorded as a short
 * payment rather than being rejected — a student who pays what they have today
 * is a better outcome than a blocked form — and the instalment only closes when
 * the full amount has arrived.
 */
export function recordPayment(id, n, { amount, method = 'UPI', reference = null, actor = 'admin' } = {}) {
  const plan = getPlan(id);
  if (!plan) return { ok: false, error: 'NOT_FOUND' };
  const inst = plan.instalments.find(x => x.n === Number(n));
  if (!inst) return { ok: false, error: 'NO_SUCH_INSTALMENT' };
  const due = inst.amount - (inst.paidAmount || 0);
  if (due <= 0) return { ok: false, error: 'ALREADY_PAID' };
  const paid = Math.round(Number(amount ?? due));
  if (!Number.isFinite(paid) || paid <= 0) return { ok: false, error: 'BAD_AMOUNT', message: 'Enter an amount greater than zero.' };
  if (paid > due) return { ok: false, error: 'OVER_PAYMENT', message: `That instalment only has ₹${due.toLocaleString('en-IN')} outstanding.` };
  if (method && !PAYMENT_METHODS.includes(method)) return { ok: false, error: 'BAD_METHOD', allowed: PAYMENT_METHODS };

  inst.paidAmount = (inst.paidAmount || 0) + paid;
  inst.method = method;
  inst.reference = reference ?? inst.reference;
  if (inst.paidAmount >= inst.amount) inst.paidAt = now();
  plan.updatedAt = now();

  const receipt = {
    id: `RCPT-${String(payments.length + 1).padStart(5, '0')}`,
    planId: plan.id, instalment: inst.n, amount: paid, method,
    reference, actor, at: now(), phone: plan.phone,
    institutionName: plan.institutionName, course: plan.course
  };
  payments.push(receipt);
  return { ok: true, plan, instalment: inst, receipt, settled: outstandingOf(plan) === 0 };
}

export const listPayments = ({ month, planId: pid } = {}) => payments.filter(p =>
  (!month || monthOf(p.at) === month) && (!pid || p.planId === pid));

/**
 * The collection book for one month: what was scheduled to arrive, what did,
 * and what is past its date and still open. "Overdue" is measured against
 * today rather than against the end of the month, so an instalment dated the
 * 28th is not reported as late on the 3rd.
 */
export function collectionSummary({ month = thisMonth() } = {}) {
  const today = iso(Date.now());
  let expected = 0, collected = 0, outstanding = 0, overdue = 0, overdueCount = 0, dueCount = 0;
  const rows = [];
  for (const plan of plans) {
    for (const i of plan.instalments) {
      if (monthOf(i.dueOn) !== month) continue;
      const paid = i.paidAmount || 0;
      const open = Math.max(0, i.amount - paid);
      expected += i.amount; collected += paid; outstanding += open; dueCount++;
      const late = open > 0 && i.dueOn < today;
      if (late) { overdue += open; overdueCount++; }
      rows.push({ planId: plan.id, applicationId: plan.applicationId, n: i.n, label: i.label,
        name: plan.name, phone: plan.phone, institutionName: plan.institutionName, course: plan.course,
        amount: i.amount, paidAmount: paid, outstanding: open, dueOn: i.dueOn, overdue: late,
        status: open === 0 ? 'Paid' : late ? 'Overdue' : paid > 0 ? 'Part paid' : 'Due' });
    }
  }
  // Money received this month against instalments dated in other months still
  // counts as collected cash, so it is reported alongside — a collections book
  // that only counted on-schedule receipts would understate the bank.
  const receiptsThisMonth = listPayments({ month }).reduce((n, p) => n + p.amount, 0);
  rows.sort((a, b) => a.dueOn.localeCompare(b.dueOn) || b.outstanding - a.outstanding);
  return { month, expected, collected, outstanding, overdue, overdueCount, dueCount,
    receiptsThisMonth, collectedPct: expected ? +((collected / expected) * 100).toFixed(1) : 0, rows };
}

/** Expected versus collected across a window, oldest first — the console chart. */
export function monthlyBook({ months = 6, endMonth = thisMonth() } = {}) {
  const [y, m] = endMonth.split('-').map(Number);
  const out = [];
  for (let k = months - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(y, m - 1 - k, 1));
    const s = collectionSummary({ month: d.toISOString().slice(0, 7) });
    out.push({ month: s.month, expected: s.expected, collected: s.collected, outstanding: s.outstanding, overdue: s.overdue });
  }
  return out;
}

/** Everything one applicant owes — what the client-side payment prompt reads. */
export function duesFor(phone) {
  const mine = plansForPhone(phone);
  const today = iso(Date.now());
  let outstanding = 0, overdue = 0;
  let next = null;
  for (const plan of mine) {
    outstanding += outstandingOf(plan);
    for (const i of plan.instalments) {
      const open = Math.max(0, i.amount - (i.paidAmount || 0));
      if (!open) continue;
      if (i.dueOn < today) overdue += open;
      const row = { planId: plan.id, n: i.n, label: i.label, amount: i.amount, outstanding: open,
        dueOn: i.dueOn, overdue: i.dueOn < today, institutionName: plan.institutionName, course: plan.course };
      if (!next || row.dueOn < next.dueOn) next = row;
    }
  }
  return { plans: mine.length, outstanding, overdue, next,
    daysToNext: next ? Math.round((new Date(next.dueOn + 'T00:00:00Z') - new Date(today + 'T00:00:00Z')) / day) : null };
}

export const __resetFees = () => { plans.length = 0; payments.length = 0; seq = 0; };
