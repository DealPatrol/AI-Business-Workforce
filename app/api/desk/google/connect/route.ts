import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_STATE_COOKIE, googleAuthUrl, googleCalendarConfig, signState } from '@/lib/ava/booking/google';
import { deskRedirect, ownerCalendar, redirectUriFor, type OwnerCalendarResult } from '@/lib/ava/booking/google-route';

export const dynamic = 'force-dynamic';

/** Starts "Connect Google Calendar" for the signed-in owner. Hidden (404) until the OAuth client is configured. */
export async function GET(request: NextRequest) {
  const config = googleCalendarConfig();
  if (!config) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const owner: OwnerCalendarResult = await ownerCalendar().catch(() => ({ error: 'failed' as const }));
  if ('error' in owner) {
    if (owner.error === 'signin') return NextResponse.redirect(new URL('/login?next=/desk', request.nextUrl.origin), 303);
    return deskRedirect(request, owner.error);
  }
  const nonce = randomBytes(16).toString('base64url');
  const state = signState(owner.onboarding.id, nonce);
  const response = NextResponse.redirect(
    googleAuthUrl({ clientId: config.clientId, redirectUri: redirectUriFor(request), state }),
    303,
  );
  response.cookies.set(GOOGLE_STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/desk/google',
    maxAge: 15 * 60,
  });
  return response;
}
