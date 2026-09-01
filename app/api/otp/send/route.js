import { sendOtp } from '@/lib/integrations/otp.js';
import { ok, fail, readJson } from '@/lib/http.js';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');
  const res = sendOtp(body.phone);
  if (!res.ok) return fail(res.error === 'RATE_LIMITED' ? 429 : 422, res.error, res.message);
  return ok(res);
}
