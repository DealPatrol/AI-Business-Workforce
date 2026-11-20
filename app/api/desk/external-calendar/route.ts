import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/ava/booking/google';
import { ownerCalendar } from '@/lib/ava/booking/google-route';
import { isExternalProvider, saveExternalCalendar, verifyExternalToken } from '@/lib/ava/booking/external-calendars';
import { createRateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const take = createRateLimiter(10, 10 * 60_000);

function back(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/desk?extcal=${encodeURIComponent(status)}#calendar`, request.nextUrl.origin), 303);
}

/**
 * Connects or disconnects a Cal.com / Calendly account as a busy-time source for the signed-in owner's
 * Ava calendar. The token is checked against the provider, then stored encrypted. It is never echoed back.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return back(request, 'failed');
  const owner = await ownerCalendar();
  if ('error' in owner) return back(request, owner.error);
  const limit = take(owner.calendar.id);
  if (!limit.ok) return back(request, 'busy');

  if (form.get('action') === 'disconnect') {
    try {
      await saveExternalCalendar(owner.calendar.id, {
        external_calendar_provider: null,
        external_calendar_token_enc: null,
        external_calendar_connected_at: null,
        external_calendar_last_error: null,
      });
      return back(request, 'disconnected');
    } catch (error) {
      console.error('External calendar disconnect failed', error instanceof Error ? error.message : error);
      return back(request, 'failed');
    }
  }

  const provider = form.get('provider');
  const token = String(form.get('token') || '').trim();
  if (!isExternalProvider(provider) || token.length < 10 || token.length > 2000) return back(request, 'invalid');
  try {
    await verifyExternalToken(provider, token);
  } catch {
    return back(request, 'rejected');
  }
  try {
    await saveExternalCalendar(owner.calendar.id, {
      external_calendar_provider: provider,
      external_calendar_token_enc: encryptToken(token),
      external_calendar_connected_at: new Date().toISOString(),
      external_calendar_last_error: null,
    });
    return back(request, 'connected');
  } catch (error) {
    console.error('External calendar save failed', error instanceof Error ? error.message : error);
    return back(request, 'failed');
  }
}
