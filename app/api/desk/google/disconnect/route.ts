import { NextRequest, NextResponse } from 'next/server';
import { clearGoogleTokenCache, googleCalendarConfig, revokeGoogleToken } from '@/lib/ava/booking/google';
import { deskRedirect, ownerCalendar } from '@/lib/ava/booking/google-route';
import { updateCalendarGoogle } from '@/lib/ava/booking/store';

export const dynamic = 'force-dynamic';

/** Disconnects Google Calendar: revokes the token and forgets it. Bookings already on Google stay there. */
export async function POST(request: NextRequest) {
  if (!googleCalendarConfig()) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  try {
    const owner = await ownerCalendar();
    if ('error' in owner) return deskRedirect(request, owner.error);
    const sealed = owner.calendar.google_refresh_token_enc;
    await updateCalendarGoogle(owner.calendar.id, {
      google_refresh_token_enc: null,
      google_calendar_id: null,
      google_connected_at: null,
      google_last_error: null,
    });
    clearGoogleTokenCache();
    if (sealed) await revokeGoogleToken(sealed);
    return deskRedirect(request, 'disconnected');
  } catch (error) {
    console.error('Google Calendar disconnect failed', error instanceof Error ? error.message : error);
    return deskRedirect(request, 'failed');
  }
}
