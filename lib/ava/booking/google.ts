import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { BookedRange } from '@/lib/ava/booking/slots';

/**
 * Two-way Google Calendar sync for an owner's Ava booking calendar.
 * - Availability subtracts the owner's busy times (freeBusy).
 * - Each Ava booking becomes a Google event. Those events are created as "show as free" (transparent), so they
 *   never come back through freeBusy and double-block a window Ava already counts from her own bookings.
 * Everything is hidden unless GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET are set.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
] as const;

export const GOOGLE_CALLBACK_PATH = '/api/desk/google/callback';
export const GOOGLE_STATE_COOKIE = 'ava_gcal_state';
const STATE_MAX_AGE_MS = 15 * 60_000;

export type GoogleEnv = {
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  GOOGLE_CALENDAR_REDIRECT_URI?: string;
  AVA_TOKEN_ENCRYPTION_KEY?: string;
  AVA_BOOKING_LINK_SECRET?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export type GoogleCalendarLink = {
  id: string;
  google_refresh_token_enc: string | null;
  google_calendar_id: string | null;
};

export function googleCalendarConfig(env: GoogleEnv = process.env as GoogleEnv) {
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID?.trim() || '';
  const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() || '';
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleRedirectUri(siteUrl: string, env: GoogleEnv = process.env as GoogleEnv) {
  return env.GOOGLE_CALENDAR_REDIRECT_URI?.trim() || `${siteUrl.replace(/\/$/, '')}${GOOGLE_CALLBACK_PATH}`;
}

function secretKey(env: GoogleEnv, purpose: string) {
  const base =
    env.AVA_TOKEN_ENCRYPTION_KEY?.trim() || env.AVA_BOOKING_LINK_SECRET?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  if (!base) throw new Error('No server secret is configured for Google Calendar tokens.');
  return createHash('sha256').update(`${purpose}:${base}`).digest();
}

/** AES-256-GCM. Refresh tokens are stored only in this form. */
export function encryptToken(plain: string, env: GoogleEnv = process.env as GoogleEnv) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(env, 'gcal-token'), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptToken(sealed: string, env: GoogleEnv = process.env as GoogleEnv) {
  const [version, iv, tag, data] = String(sealed || '').split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Unreadable Google token.');
  const decipher = createDecipheriv('aes-256-gcm', secretKey(env, 'gcal-token'), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

/** Signed OAuth state: onboarding id + time + nonce. The nonce also goes in an httpOnly cookie. */
export function signState(onboardingId: string, nonce: string, env: GoogleEnv = process.env as GoogleEnv, now = Date.now()) {
  const payload = `${onboardingId}.${now}.${nonce}`;
  const sig = createHmac('sha256', secretKey(env, 'gcal-state')).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyState(
  state: string,
  cookieNonce: string,
  env: GoogleEnv = process.env as GoogleEnv,
  now = Date.now(),
): { ok: true; onboardingId: string } | { ok: false } {
  const parts = String(state || '').split('.');
  if (parts.length !== 4) return { ok: false };
  const [onboardingId, ts, nonce, sig] = parts;
  const expected = createHmac('sha256', secretKey(env, 'gcal-state')).update(`${onboardingId}.${ts}.${nonce}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false };
  if (!cookieNonce || cookieNonce !== nonce) return { ok: false };
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > STATE_MAX_AGE_MS) return { ok: false };
  return { ok: true, onboardingId };
}

export function googleAuthUrl(opts: { clientId: string; redirectUri: string; state: string }) {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: opts.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string };

export async function exchangeCode(
  code: string,
  redirectUri: string,
  config: { clientId: string; clientSecret: string },
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !data.refresh_token) {
    throw new Error(data.error || `Google token exchange failed (${response.status}).`);
  }
  const granted = String(data.scope || '').split(' ');
  const missing = GOOGLE_CALENDAR_SCOPES.filter((scope) => !granted.includes(scope));
  return { refreshToken: data.refresh_token, missingScopes: missing };
}

const accessCache = new Map<string, { token: string; expiresAt: number }>();

export function clearGoogleTokenCache() {
  accessCache.clear();
}

async function accessToken(
  link: GoogleCalendarLink,
  config: { clientId: string; clientSecret: string },
  env: GoogleEnv,
  fetchImpl: typeof fetch,
) {
  const cached = accessCache.get(link.id);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const refreshToken = decryptToken(link.google_refresh_token_enc || '', env);
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });
  const data = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !data.access_token) throw new Error(data.error || `Google token refresh failed (${response.status}).`);
  accessCache.set(link.id, { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3000) * 1000 });
  return data.access_token;
}

export function isGoogleLinked(link: Partial<GoogleCalendarLink> | null | undefined) {
  return Boolean(link?.google_refresh_token_enc);
}

/** Busy ranges from the owner's Google calendar between two instants. */
export async function googleBusyRanges(
  link: GoogleCalendarLink,
  timeMin: string,
  timeMax: string,
  env: GoogleEnv = process.env as GoogleEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<BookedRange[]> {
  const config = googleCalendarConfig(env);
  if (!config || !isGoogleLinked(link)) return [];
  const calendarId = link.google_calendar_id || 'primary';
  const token = await accessToken(link, config, env, fetchImpl);
  const response = await fetchImpl('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }>; errors?: unknown[] }>;
  };
  if (!response.ok) throw new Error(`Google freeBusy failed (${response.status}).`);
  const entry = data.calendars?.[calendarId] ?? Object.values(data.calendars ?? {})[0];
  if (entry?.errors?.length) throw new Error('Google freeBusy returned an error for this calendar.');
  return (entry?.busy ?? []).map((b) => ({ start_at: b.start, end_at: b.end }));
}

export type GoogleEventInput = {
  bookingId: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  callerName: string | null;
  callerPhone: string | null;
  serviceAddress: string | null;
  issue: string | null;
};

export function googleEventBody(input: GoogleEventInput) {
  const who = input.callerName || 'Caller';
  const what = input.issue ? ` – ${input.issue.slice(0, 80)}` : '';
  return {
    summary: `Ava booked: ${who}${what}`,
    location: input.serviceAddress || undefined,
    description: [
      `Booked by Ava on a phone call.`,
      input.callerPhone ? `Callback: ${input.callerPhone}` : '',
      input.serviceAddress ? `Address: ${input.serviceAddress}` : '',
      input.issue ? `Issue: ${input.issue}` : '',
      'Arrival window, not an exact time. Confirm with the customer before the visit.',
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: input.startAt, timeZone: input.timeZone },
    end: { dateTime: input.endAt, timeZone: input.timeZone },
    // Show as free so freeBusy never echoes Ava's own bookings back as owner busy time.
    transparency: 'transparent',
    extendedProperties: { private: { avaBookingId: input.bookingId } },
    reminders: { useDefault: true },
  };
}

export async function createGoogleEvent(
  link: GoogleCalendarLink,
  input: GoogleEventInput,
  env: GoogleEnv = process.env as GoogleEnv,
  fetchImpl: typeof fetch = fetch,
) {
  const config = googleCalendarConfig(env);
  if (!config || !isGoogleLinked(link)) return null;
  const token = await accessToken(link, config, env, fetchImpl);
  const calendarId = encodeURIComponent(link.google_calendar_id || 'primary');
  const response = await fetchImpl(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(googleEventBody(input)),
  });
  const data = (await response.json().catch(() => ({}))) as { id?: string };
  if (!response.ok || !data.id) throw new Error(`Google event create failed (${response.status}).`);
  return data.id;
}

/** Best-effort revoke when the owner disconnects. */
export async function revokeGoogleToken(sealed: string, env: GoogleEnv = process.env as GoogleEnv, fetchImpl: typeof fetch = fetch) {
  try {
    const token = decryptToken(sealed, env);
    await fetchImpl(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' });
  } catch (error) {
    console.error('Google token revoke failed', error instanceof Error ? error.message : error);
  }
}

/** Run a Google call with a deadline so a slow Google never stalls a live phone call. */
export async function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<{ value: T; timedOut: boolean; error?: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ value: T; timedOut: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ value: fallback, timedOut: true }), ms);
  });
  try {
    return await Promise.race([
      promise.then((value) => ({ value, timedOut: false })),
      timeout,
    ]);
  } catch (error) {
    return { value: fallback, timedOut: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
