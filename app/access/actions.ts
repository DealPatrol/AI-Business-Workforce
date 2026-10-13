'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { PROSPECT_GATE_COOKIE, prospectGateToken } from '@/lib/prospect-gate';

function sameSecret(password: string, secret: string) {
  const given = createHash('sha256').update(password).digest();
  const expected = createHash('sha256').update(secret).digest();
  return timingSafeEqual(given, expected);
}

export async function unlockProspectGate(password: string) {
  const secret = process.env.PROSPECT_GATE_PASSWORD?.trim() ?? '';
  if (!secret || !password || password.length > 200) return { ok: false as const };
  if (!sameSecret(password, secret)) return { ok: false as const };
  const jar = await cookies();
  jar.set(PROSPECT_GATE_COOKIE, prospectGateToken(secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
  return { ok: true as const };
}
