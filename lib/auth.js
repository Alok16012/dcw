/**
 * Role-based sessions for the three audiences the app serves.
 *
 *   student   — the public app (browse, save, apply). No sign-in required today.
 *   employer  — posts jobs, sees applicants for its own company only.
 *   admin     — full CRUD on every job, every application and the lead CRM.
 *
 * ⚠️ DEMO AUTHENTICATION. Accounts are the fixed list below and passcodes are
 * published in the sign-in UI on purpose, so a reviewer can get in. There is no
 * user table, no password hashing and no account recovery. The session cookie
 * itself is real — HMAC-signed, httpOnly, expiring — so it is not trivially
 * forgeable, but this must be replaced with a genuine identity provider before
 * anything handles real candidate data.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const ROLES = ['student', 'employer', 'admin'];
export const COOKIE = 'dcw_session';
const TTL_HOURS = 12;

/** Dev fallback keeps the prototype runnable; a real deploy must set the env var. */
const SECRET = process.env.DCW_SESSION_SECRET || 'dcw-demo-session-secret-not-for-production';
export const USING_FALLBACK_SECRET = !process.env.DCW_SESSION_SECRET;

/** Demo directory. `company` scopes an employer to its own postings. */
export const DEMO_USERS = [
  { id: 'u-admin', role: 'admin', name: 'Alok (Admin)', username: 'admin', passcode: 'admin123', company: null },
  { id: 'u-employer', role: 'employer', name: 'Bajaj Finserv HR', username: 'employer', passcode: 'employer123', company: 'bajaj-finserv' },
  { id: 'u-student', role: 'student', name: 'Rahul Kumar', username: 'student', passcode: 'student123', company: null }
];

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const unb64 = s => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
const mac = body => createHmac('sha256', SECRET).update(body).digest('base64url');

export function signSession(user) {
  const payload = {
    sub: user.id, role: user.role, name: user.name,
    company: user.company ?? null,
    exp: Date.now() + TTL_HOURS * 3600_000
  };
  const body = b64(payload);
  return `${body}.${mac(body)}`;
}

/** @returns {null|{sub:string,role:string,name:string,company:string|null,exp:number}} */
export function verifySession(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = mac(body);
  // Constant-time compare so a bad signature cannot be probed byte by byte.
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = unb64(body);
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

export function authenticate(username, passcode) {
  const u = DEMO_USERS.find(x => x.username === String(username ?? '').trim().toLowerCase());
  if (!u || u.passcode !== String(passcode ?? '')) return null;
  return u;
}

export const sessionFromRequest = request => verifySession(request.cookies.get(COOKIE)?.value);

export const cookieOptions = {
  httpOnly: true, sameSite: 'lax', path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: TTL_HOURS * 3600
};

/**
 * Route guard. Returns the session, or a Response to return straight to the caller.
 * @param {Request & {cookies:any}} request
 * @param {string[]} roles
 */
export function requireRole(request, roles) {
  const s = sessionFromRequest(request);
  if (!s) {
    return { error: Response.json({ ok: false, error: 'UNAUTHENTICATED', message: 'Sign in to continue.' }, { status: 401 }) };
  }
  if (!roles.includes(s.role)) {
    return { error: Response.json({ ok: false, error: 'FORBIDDEN', message: `Requires role: ${roles.join(' or ')}.` }, { status: 403 }) };
  }
  return { session: s };
}

/** Employers only ever see their own company's rows; admins see everything. */
export const scopeToCompany = session =>
  session.role === 'employer' ? session.company : null;
