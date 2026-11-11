import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_STATE_COOKIE,
  clearGoogleTokenCache,
  encryptToken,
  exchangeCode,
  googleCalendarConfig,
  verifyState,
} from '@/lib/ava/booking/google';
import { deskRedirect, ownerCalendar, redirectUriFor } from '@/lib/ava/booking/google-route';
import { updateCalendarGoogle } from '@/lib/ava/booking/store';

export const dynamic = 'force-dynamic';

/** Google OAuth redirect: checks state, stores the encrypted refresh token on the owner's calendar. */
export async function GET(request: NextRequest) {
  const config = googleCalendarConfig();
  if (!config) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const params = request.nextUrl.searchParams;
  const finish = (status: string) => {
    const response = deskRedirect(request, status);
    response.cookies.set(GOOGLE_STATE_COOKIE, '', { path: '/api/desk/google', maxAge: 0 });
    return response;
  };
  if (params.get('error')) return finish('declined');

  const state = verifyState(params.get('state') || '', request.cookies.get(GOOGLE_STATE_COOKIE)?.value || '');
  if (!state.ok) return finish('expired');

  try {
    const owner = await ownerCalendar();
    if ('error' in owner) return finish(owner.error);
    if (owner.onboarding.id !== state.onboardingId) return finish('expired');

    const code = params.get('code') || '';
    if (!code) return finish('failed');
    const token = await exchangeCode(code, redirectUriFor(request), config);
    if (token.missingScopes.length) return finish('scopes');

    await updateCalendarGoogle(owner.calendar.id, {
      google_refresh_token_enc: encryptToken(token.refreshToken),
      google_calendar_id: 'primary',
      google_connected_at: new Date().toISOString(),
      google_last_error: null,
    });
    clearGoogleTokenCache();
    return finish('connected');
  } catch (error) {
    console.error('Google Calendar connect failed', error instanceof Error ? error.message : error);
    return finish('failed');
  }
}
