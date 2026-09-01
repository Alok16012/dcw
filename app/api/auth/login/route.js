import { NextResponse } from 'next/server';
import { authenticate, signSession, COOKIE, cookieOptions, DEMO_USERS } from '@/lib/auth.js';
import { fail, readJson } from '@/lib/http.js';

/** Demo sign-in. The account list is public on purpose — see lib/auth.js. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    data: { accounts: DEMO_USERS.map(({ role, username, passcode, name }) => ({ role, username, passcode, name })) }
  });
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return fail(400, 'BAD_JSON', 'Request body must be JSON.');

  const user = authenticate(body.username, body.passcode);
  if (!user) return fail(401, 'BAD_CREDENTIALS', 'Username or passcode is incorrect.');

  const res = NextResponse.json({
    ok: true,
    data: { role: user.role, name: user.name, company: user.company }
  });
  res.cookies.set(COOKIE, signSession(user), cookieOptions);
  return res;
}
