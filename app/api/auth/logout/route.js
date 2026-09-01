import { NextResponse } from 'next/server';
import { COOKIE, cookieOptions } from '@/lib/auth.js';

export async function POST() {
  const res = NextResponse.json({ ok: true, data: { signedOut: true } });
  res.cookies.set(COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
