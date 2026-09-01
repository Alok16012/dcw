/** Consistent JSON envelope + input coercion for all /api routes. */
import { DATA_PROVENANCE } from './data/schema.js';
import { DRIVER } from './integrations/index.js';

export const ok = (data, init = {}) =>
  Response.json({ ok: true, data, meta: { provenance: DATA_PROVENANCE, driver: DRIVER } }, { status: 200, ...init });

export const fail = (status, error, message, extra = {}) =>
  Response.json({ ok: false, error, message, ...extra }, { status });

export const num = (v, d = undefined) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
export const bool = v => (v == null || v === '' ? undefined : v === 'true' || v === '1');

export async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

export const VERTICAL_SET = new Set(['distance', 'colleges', 'jobs']);
