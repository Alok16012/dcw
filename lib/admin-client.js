/** Browser-side helper for the console. Cookies carry the session, so every
 *  call is `credentials:'include'`; a 401 means the session lapsed and the
 *  caller should bounce to /login rather than render an error. */
export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message || `Request failed (${status})`);
    this.status = status;
    this.code = payload?.error;
    this.errors = payload?.errors || null;
    this.allowed = payload?.allowed || null;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let payload = null;
  try { payload = await res.json(); } catch { /* empty body */ }
  if (!res.ok || payload?.ok === false) throw new ApiError(res.status, payload);
  return payload.data;
}

export const fmtDate = iso => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

export const fmtWhen = iso => {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  const days = Math.round(mins / 1440);
  return days < 30 ? `${days}d ago` : fmtDate(iso);
};

/** Salaries are stored per year; recruiters read them per month. */
export const fmtSalary = (min, max) => {
  const m = n => `₹${Math.round(n / 12000)}K`;
  if (!min && !max) return '—';
  return `${m(min)}–${m(max)}/mo`;
};

export const pillClass = status => `adm-pill s-${String(status).toLowerCase().replace(/\s+/g, '')}`;
