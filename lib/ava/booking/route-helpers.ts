import { NextRequest, NextResponse } from 'next/server';
import { TOOL_SECRET_HEADER } from '@/lib/ava/booking/secret';
import { calendarForToolSecret, type CalendarRow } from '@/lib/ava/booking/store';
import { createRateLimiter } from '@/lib/rate-limit';

const take = createRateLimiter(60, 60_000);

/** Authenticates an ElevenLabs webhook-tool call by its per-agent secret header. */
export async function authorizeToolCall(
  request: NextRequest,
): Promise<{ ok: true; calendar: CalendarRow; body: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  const secret = request.headers.get(TOOL_SECRET_HEADER)?.trim() || '';
  const limit = take(secret ? secret.slice(-12) : request.headers.get('x-forwarded-for') || 'tool');
  if (!limit.ok) {
    return { ok: false, response: NextResponse.json({ error: 'Too many requests.' }, { status: 429 }) };
  }
  const calendar = secret ? await calendarForToolSecret(secret) : null;
  if (!calendar) {
    return { ok: false, response: NextResponse.json({ error: 'Not found.' }, { status: 404 }) };
  }
  const raw = await request.json().catch(() => null);
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { ok: true, calendar, body };
}
