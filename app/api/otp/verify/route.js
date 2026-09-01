import { verifyOtp } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const res = verifyOtp(body.phone, body.code);
  if (!res.ok) return fail(422, res.error, res.message, res.attemptsLeft != null ? { attemptsLeft: res.attemptsLeft } : {});
  return ok(res);
}
