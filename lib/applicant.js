/**
 * Applicant identity — who the person tracking their own applications is.
 *
 * lib/auth.js signs staff sessions (admin, employer). This signs the other
 * side: a member of the public who has verified a mobile number and is now
 * entitled to see the applications filed against that number, and nobody
 * else's. There is no password and no account, because the public app has
 * never asked for one; possession of the number, proved by OTP, is the claim.
 *
 * WHY A COOKIE AND NOT A QUERY PARAMETER: /api/me/applications has to answer
 * "what has this person applied for". If the phone number travelled in the
 * request, anyone could type someone else's number and read their pipeline —
 * a ten-digit enumeration of every applicant in the system. The number is
 * therefore only ever taken from a token this server signed, immediately after
 * the OTP that proved it.
 *
 * The secret is derived from the same env var as the staff session but with a
 * distinct label, so an applicant token can never be presented as a staff
 * session or the reverse, even though both are HMAC-SHA256 over base64url JSON.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const APPLICANT_COOKIE = 'dcw_applicant';
const TTL_DAYS = 30;

const BASE = process.env.DCW_SESSION_SECRET || 'dcw-demo-session-secret-not-for-production';
const SECRET = createHmac('sha256', BASE).update('applicant-identity-v1').digest();
export const USING_FALLBACK_SECRET = !process.env.DCW_SESSION_SECRET;

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const unb64 = s => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
const mac = body => createHmac('sha256', SECRET).update(body).digest('base64url');
const digits = p => String(p ?? '').replace(/\D/g, '');

export function signApplicant({ phone, name }) {
  const body = b64({ phone: digits(phone), name: String(name ?? '').trim() || null,
    exp: Date.now() + TTL_DAYS * 86400_000 });
  return `${body}.${mac(body)}`;
}

/** @returns {null|{phone:string,name:string|null,exp:number}} */
export function verifyApplicant(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  // Constant-time compare so a bad signature cannot be probed byte by byte.
  const a = Buffer.from(sig), b = Buffer.from(mac(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = unb64(body);
    return p.exp > Date.now() && digits(p.phone).length === 10 ? p : null;
  } catch { return null; }
}

export const applicantFromRequest = request => verifyApplicant(request.cookies.get(APPLICANT_COOKIE)?.value);

export const applicantCookieOptions = {
  httpOnly: true, sameSite: 'lax', path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: TTL_DAYS * 86400
};

/** Route guard for /api/me/*. Returns the identity, or a Response to return. */
export function requireApplicant(request) {
  const a = applicantFromRequest(request);
  if (!a) {
    return { error: Response.json({ ok: false, error: 'NO_APPLICANT',
      message: 'Verify your mobile number to see your applications.' }, { status: 401 }) };
  }
  return { applicant: a };
}
