import { sessionFromRequest } from '@/lib/auth.js';
import { ok } from '@/lib/http.js';

export async function GET(request) {
  const s = sessionFromRequest(request);
  return ok({ authenticated: !!s, session: s ? { role: s.role, name: s.name, company: s.company } : null });
}
