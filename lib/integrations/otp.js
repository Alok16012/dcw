/** OTP send/verify. PRD §8.2 — verification is mandatory to block junk leads. */
import { DRIVER, isDemo, requireLiveConfig } from './index.js';

/** phone -> { code, expiresAt, attempts, sentAt[] } */
const store = new Map();
const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;   // PRD §14: OTP rate limiting
/** Phones that cleared an OTP, and until when. A verification has to outlive
 *  verifyOtp itself: the visitor still has a form to finish, and the lead
 *  endpoint must be able to check the claim server-side rather than trust a
 *  phoneVerified flag posted by the browser. */
const verified = new Map();
const VERIFIED_TTL_MS = 15 * 60 * 1000;

const now = () => Date.now();
export const isValidPhone = p => /^[6-9]\d{9}$/.test(String(p || '').replace(/\D/g, ''));

export function sendOtp(phoneRaw) {
  const phone = String(phoneRaw || '').replace(/\D/g, '');
  if (!isValidPhone(phone)) return { ok: false, error: 'INVALID_PHONE', message: 'Enter a valid 10-digit Indian mobile number.' };

  const rec = store.get(phone) ?? { code: null, expiresAt: 0, attempts: 0, sentAt: [] };
  rec.sentAt = rec.sentAt.filter(t => now() - t < 60 * 60 * 1000);
  if (rec.sentAt.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: 'RATE_LIMITED', message: 'Too many codes requested. Try again in an hour.' };
  }

  if (!isDemo) {
    requireLiveConfig('otp', ['MSG91_AUTH_KEY', 'MSG91_TEMPLATE_ID']);
    throw new Error('otp: live SMS driver not implemented yet');
  }

  // Demo driver: deterministic code, never sent anywhere.
  const code = String(1000 + (Number(phone.slice(-4)) % 9000)).padStart(4, '0') + '00';
  rec.code = code.slice(0, 6);
  rec.expiresAt = now() + TTL_MS;
  rec.attempts = 0;
  rec.sentAt.push(now());
  store.set(phone, rec);

  return {
    ok: true, driver: DRIVER, demo: true,
    expiresInSec: TTL_MS / 1000,
    message: 'Demo mode: no SMS was sent. Use the code shown below.',
    demoCode: rec.code
  };
}

export function verifyOtp(phoneRaw, codeRaw) {
  const phone = String(phoneRaw || '').replace(/\D/g, '');
  const code = String(codeRaw || '').replace(/\D/g, '');
  const rec = store.get(phone);
  if (!rec || !rec.code) return { ok: false, error: 'NOT_REQUESTED', message: 'Request a code first.' };
  if (now() > rec.expiresAt) { store.delete(phone); return { ok: false, error: 'EXPIRED', message: 'That code expired. Request a new one.' }; }
  if (rec.attempts >= MAX_ATTEMPTS) { store.delete(phone); return { ok: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many wrong attempts. Request a new code.' }; }
  rec.attempts += 1;
  if (rec.code !== code) return { ok: false, error: 'INCORRECT', message: 'That code is not correct.', attemptsLeft: MAX_ATTEMPTS - rec.attempts };
  store.delete(phone);
  verified.set(phone, now() + VERIFIED_TTL_MS);
  return { ok: true, phone, verifiedAt: new Date().toISOString() };
}

/** Has this number cleared an OTP recently? Reusable inside the window so a
 *  visitor making a second enquiry is not asked to verify twice. */
export function isPhoneVerified(phoneRaw) {
  const phone = String(phoneRaw || '').replace(/\D/g, '');
  const until = verified.get(phone);
  if (!until) return false;
  if (now() > until) { verified.delete(phone); return false; }
  return true;
}

export const __resetOtpStore = () => { store.clear(); verified.clear(); };
