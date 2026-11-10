import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { outsideBusy, runAfterBook } from '@/lib/ava/booking/after-book';
import {
  GOOGLE_CALENDAR_SCOPES,
  clearGoogleTokenCache,
  createGoogleEvent,
  decryptToken,
  encryptToken,
  exchangeCode,
  googleAuthUrl,
  googleBusyRanges,
  googleCalendarConfig,
  googleEventBody,
  signState,
  verifyState,
  withDeadline,
} from '@/lib/ava/booking/google';
import { bookingSmsBody, decideBookingSms, sendBookingConfirmation } from '@/lib/ava/booking/sms-confirm';
import { computeOpenSlots, type CalendarSettings } from '@/lib/ava/booking/slots';
import type { BookingRow, CalendarRow } from '@/lib/ava/booking/store';
import { bookingToolConfigs } from '@/lib/ava/booking/agent-tools';

const smsEnv = {
  AVA_BOOKING_SMS_ENABLED: '1',
  AVA_BOOKING_SMS_FROM: '+18885550100',
  TWILIO_ACCOUNT_SID: 'AC_test',
  TWILIO_AUTH_TOKEN: 'test-token',
};
const gEnv = {
  GOOGLE_CALENDAR_CLIENT_ID: 'client-id.apps.googleusercontent.com',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'client-secret',
  AVA_TOKEN_ENCRYPTION_KEY: 'unit-test-key-unit-test-key-unit-test',
};
const smsInput = {
  businessName: 'Porchlight Heating & Air',
  window: 'Tuesday, November 10, 8 to 10 AM',
  callerPhone: '(205) 555-0134',
  optIn: true,
  isDemo: false,
};

function calendar(overrides: Partial<CalendarRow> = {}): CalendarRow {
  return {
    id: 'cal-1',
    onboarding_id: 'onb-1',
    label: 'Porchlight',
    is_demo: false,
    enabled: true,
    timezone: 'America/Chicago',
    slot_minutes: 120,
    slot_capacity: 1,
    min_notice_minutes: 120,
    horizon_days: 7,
    weekly_hours: {},
    blackouts: [],
    tool_secret_hash: null,
    elevenlabs_tool_ids: null,
    ...overrides,
  };
}

function booking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'bk-1',
    calendar_id: 'cal-1',
    start_at: '2026-11-10T14:00:00.000Z',
    end_at: '2026-11-10T16:00:00.000Z',
    status: 'booked',
    caller_name: 'Dana Test',
    caller_phone: '2055550134',
    service_address: '412 Oak St, Gadsden, AL',
    issue: 'Furnace blowing cold air',
    conversation_id: 'conv_1',
    is_demo: false,
    created_at: '2026-11-10T09:00:00.000Z',
    sms_opt_in: true,
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('booking text confirmation', () => {
  it('is off by default and when the flag is anything but 1/true', () => {
    assert.deepEqual(decideBookingSms(smsInput, { ...smsEnv, AVA_BOOKING_SMS_ENABLED: undefined }), { send: false, reason: 'disabled' });
    assert.deepEqual(decideBookingSms(smsInput, { ...smsEnv, AVA_BOOKING_SMS_ENABLED: 'yes' }), { send: false, reason: 'disabled' });
    assert.equal(decideBookingSms(smsInput, { ...smsEnv, AVA_BOOKING_SMS_ENABLED: 'true' }).send, true);
  });

  it('needs the dedicated from number and Twilio credentials, with no fallback number', () => {
    assert.deepEqual(decideBookingSms(smsInput, { ...smsEnv, AVA_BOOKING_SMS_FROM: '' }), { send: false, reason: 'not_configured' });
    assert.deepEqual(decideBookingSms(smsInput, { ...smsEnv, TWILIO_AUTH_TOKEN: '' }), { send: false, reason: 'not_configured' });
  });

  it('never texts demo bookings, callers who did not say yes, or bad numbers', () => {
    assert.deepEqual(decideBookingSms({ ...smsInput, isDemo: true }, smsEnv), { send: false, reason: 'demo' });
    assert.deepEqual(decideBookingSms({ ...smsInput, optIn: false }, smsEnv), { send: false, reason: 'no_opt_in' });
    assert.deepEqual(decideBookingSms({ ...smsInput, callerPhone: '555-0134' }, smsEnv), { send: false, reason: 'bad_phone' });
    assert.deepEqual(decideBookingSms({ ...smsInput, callerPhone: '+442071234567' }, smsEnv), { send: false, reason: 'bad_phone' });
    assert.deepEqual(decideBookingSms({ ...smsInput, callerPhone: '888-555-0100' }, smsEnv), { send: false, reason: 'same_number' });
  });

  it('sends one message from the toll-free number to the caller, naming Ava and the business, with STOP language', () => {
    const decision = decideBookingSms(smsInput, smsEnv);
    assert.equal(decision.send, true);
    if (!decision.send) return;
    assert.equal(decision.to, '+12055550134');
    assert.equal(decision.from, '+18885550100');
    assert.match(decision.body, /^Ava for Porchlight Heating & Air: you're booked for Tuesday, November 10, 8 to 10 AM\./);
    assert.match(decision.body, /Reply HELP for help, STOP to opt out\.$/);
    assert.ok(decision.body.length <= 306, `two segments max, got ${decision.body.length}`);
  });

  it('keeps long or odd business names tidy', () => {
    const body = bookingSmsBody('A Very Long Business Name That Goes On And On Heating Cooling\nPlumbing', 'Monday, 8 to 10 AM');
    assert.ok(!body.includes('\n'));
    assert.match(body, /^Ava for .{1,40}: /);
    assert.match(bookingSmsBody('', 'Monday'), /^Ava for your service company: /);
  });

  it('uses the injected transport, reports status, and never throws', async () => {
    const sent: Array<{ to: string; from: string; body: string }> = [];
    const ok = await sendBookingConfirmation(smsInput, smsEnv, async (msg) => {
      sent.push(msg);
      return { sid: 'SM123' };
    });
    assert.deepEqual(ok, { status: 'sent', sid: 'SM123' });
    assert.equal(sent.length, 1);
    const failed = await sendBookingConfirmation(smsInput, smsEnv, async () => ({ error: 'Attempt to send to unsubscribed recipient' }));
    assert.deepEqual(failed, { status: 'failed' });
    const threw = await sendBookingConfirmation(smsInput, smsEnv, async () => {
      throw new Error('network');
    });
    assert.deepEqual(threw, { status: 'failed' });
    const skipped = await sendBookingConfirmation({ ...smsInput, optIn: false }, smsEnv, async () => {
      throw new Error('must not be called');
    });
    assert.deepEqual(skipped, { status: 'skipped:no_opt_in' });
  });

  it('book_appointment exposes text_ok so the caller can say yes on the call', () => {
    const book = bookingToolConfigs('https://example.test', 'secret')[1].tool_config as unknown as {
      api_schema: { request_body_schema: { properties: Record<string, { type: string }>; required: string[] } };
    };
    assert.equal(book.api_schema.request_body_schema.properties.text_ok.type, 'boolean');
    assert.ok(!book.api_schema.request_body_schema.required.includes('text_ok'));
  });
});

describe('Google Calendar sync', () => {
  it('is hidden until both OAuth env vars are set', () => {
    assert.equal(googleCalendarConfig({}), null);
    assert.equal(googleCalendarConfig({ GOOGLE_CALENDAR_CLIENT_ID: 'x' }), null);
    assert.deepEqual(googleCalendarConfig(gEnv), { clientId: gEnv.GOOGLE_CALENDAR_CLIENT_ID, clientSecret: 'client-secret' });
  });

  it('asks for offline access with exactly the events and freebusy scopes', () => {
    const url = new URL(googleAuthUrl({ clientId: 'cid', redirectUri: 'https://x.test/api/desk/google/callback', state: 's' }));
    assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.deepEqual(url.searchParams.get('scope')?.split(' '), [...GOOGLE_CALENDAR_SCOPES]);
    assert.deepEqual([...GOOGLE_CALENDAR_SCOPES], [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ]);
  });

  it('signs state, binds it to the browser cookie, and expires it', () => {
    const now = Date.parse('2026-11-10T09:00:00Z');
    const state = signState('onb-1', 'nonce123', gEnv, now);
    assert.deepEqual(verifyState(state, 'nonce123', gEnv, now + 60_000), { ok: true, onboardingId: 'onb-1' });
    assert.deepEqual(verifyState(state, 'other', gEnv, now + 60_000), { ok: false });
    assert.deepEqual(verifyState(state, 'nonce123', gEnv, now + 16 * 60_000), { ok: false });
    assert.deepEqual(verifyState(state.replace('onb-1', 'onb-2'), 'nonce123', gEnv, now), { ok: false });
    assert.deepEqual(verifyState(state, 'nonce123', { ...gEnv, AVA_TOKEN_ENCRYPTION_KEY: 'another-key-another-key' }, now), { ok: false });
  });

  it('stores refresh tokens encrypted and refuses tampering', () => {
    const sealed = encryptToken('1//refresh-token', gEnv);
    assert.ok(!sealed.includes('refresh-token'));
    assert.equal(decryptToken(sealed, gEnv), '1//refresh-token');
    const parts = sealed.split('.');
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('AA') ? 'BB' : 'AA');
    assert.throws(() => decryptToken(parts.join('.'), gEnv));
  });

  it('rejects a token exchange that did not grant both scopes', async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, { refresh_token: 'r', access_token: 'a', scope: GOOGLE_CALENDAR_SCOPES[0] })) as typeof fetch;
    const result = await exchangeCode('code', 'https://x/cb', { clientId: 'c', clientSecret: 's' }, fetchImpl);
    assert.deepEqual(result.missingScopes, [GOOGLE_CALENDAR_SCOPES[1]]);
  });

  it('reads busy times through freeBusy with a refreshed access token', async () => {
    clearGoogleTokenCache();
    const calls: string[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push(String(url));
      if (String(url).includes('oauth2.googleapis.com/token')) {
        assert.match(String(init?.body), /grant_type=refresh_token/);
        return jsonResponse(200, { access_token: 'access-1', expires_in: 3600 });
      }
      assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer access-1');
      return jsonResponse(200, { calendars: { primary: { busy: [{ start: '2026-11-10T15:00:00Z', end: '2026-11-10T15:30:00Z' }] } } });
    }) as typeof fetch;
    const link = { id: 'cal-g', google_refresh_token_enc: encryptToken('r1', gEnv), google_calendar_id: 'primary' };
    const busy = await googleBusyRanges(link, '2026-11-10T00:00:00Z', '2026-11-17T00:00:00Z', gEnv, fetchImpl);
    assert.deepEqual(busy, [{ start_at: '2026-11-10T15:00:00Z', end_at: '2026-11-10T15:30:00Z' }]);
    await googleBusyRanges(link, '2026-11-10T00:00:00Z', '2026-11-17T00:00:00Z', gEnv, fetchImpl);
    assert.equal(calls.filter((c) => c.includes('/token')).length, 1, 'access token is cached');
    assert.ok(calls.some((c) => c.endsWith('/calendar/v3/freeBusy')));
  });

  it('creates booking events as "show as free" so they never block Ava twice', async () => {
    const body = googleEventBody({
      bookingId: 'bk-1',
      startAt: '2026-11-10T14:00:00.000Z',
      endAt: '2026-11-10T16:00:00.000Z',
      timeZone: 'America/Chicago',
      callerName: 'Dana Test',
      callerPhone: '2055550134',
      serviceAddress: '412 Oak St',
      issue: 'No heat',
    });
    assert.equal(body.transparency, 'transparent');
    assert.equal(body.summary, 'Ava booked: Dana Test – No heat');
    assert.equal(body.extendedProperties.private.avaBookingId, 'bk-1');
    clearGoogleTokenCache();
    let posted: Record<string, unknown> | null = null;
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      if (String(url).includes('/token')) return jsonResponse(200, { access_token: 'a', expires_in: 3600 });
      posted = JSON.parse(String(init?.body));
      return jsonResponse(200, { id: 'evt_1' });
    }) as typeof fetch;
    const id = await createGoogleEvent(
      { id: 'cal-e', google_refresh_token_enc: encryptToken('r', gEnv), google_calendar_id: null },
      { bookingId: 'bk-1', startAt: 'a', endAt: 'b', timeZone: 'UTC', callerName: null, callerPhone: null, serviceAddress: null, issue: null },
      gEnv,
      fetchImpl,
    );
    assert.equal(id, 'evt_1');
    assert.equal((posted as unknown as { transparency: string }).transparency, 'transparent');
  });

  it('Google busy time closes a window even when capacity is left', () => {
    const settings: CalendarSettings = {
      timezone: 'America/Chicago',
      slotMinutes: 120,
      slotCapacity: 2,
      minNoticeMinutes: 0,
      horizonDays: 0,
      weeklyHours: { '2': [['08:00', '12:00']] },
      blackouts: [],
    };
    const now = new Date('2026-11-10T12:00:00Z'); // Tuesday 6 AM Central
    const free = computeOpenSlots(settings, [], now);
    assert.deepEqual(free.map((s) => s.localStart), ['08:00', '10:00']);
    const busy = [{ start_at: '2026-11-10T16:30:00Z', end_at: '2026-11-10T17:00:00Z' }]; // 10:30-11:00 Central
    assert.deepEqual(computeOpenSlots(settings, [], now, busy).map((s) => s.localStart), ['08:00']);
  });

  it('fails open on a slow or broken Google so the caller is not left waiting', async () => {
    const linked = calendar({ google_refresh_token_enc: 'sealed' });
    const broken = await outsideBusy(linked, 'a', 'b', { busy: async () => { throw new Error('500'); } });
    assert.deepEqual(broken, []);
    const slow = await withDeadline(new Promise<string[]>((resolve) => setTimeout(() => resolve(['late']), 50)), 5, []);
    assert.deepEqual(slow, { value: [], timedOut: true });
    const demo = await outsideBusy(calendar({ is_demo: true, google_refresh_token_enc: 'sealed' }), 'a', 'b', {
      busy: async () => { throw new Error('must not be called for demo calendars'); },
    });
    assert.deepEqual(demo, []);
  });
});

describe('after a booking', () => {
  it('texts the caller and adds the Google event, then records both', async () => {
    const records: Array<Record<string, unknown>> = [];
    const texts: string[] = [];
    const patch = await runAfterBook(calendar({ google_refresh_token_enc: 'sealed' }), booking(), 'Tuesday, November 10, 8 to 10 AM', {
      env: { ...smsEnv, ...gEnv },
      businessName: async () => 'Porchlight Heating & Air',
      record: async (_id, p) => {
        records.push(p);
      },
      smsTransport: async (msg) => {
        texts.push(msg.to);
        return { sid: 'SM1' };
      },
      createEvent: async () => 'evt_9',
    });
    assert.deepEqual(texts, ['+12055550134']);
    assert.deepEqual(patch, { sms_status: 'sent', sms_sid: 'SM1', google_event_id: 'evt_9' });
    assert.equal(records.length, 1);
  });

  it('does nothing outward for demo bookings', async () => {
    const patch = await runAfterBook(calendar({ is_demo: true, google_refresh_token_enc: 'sealed' }), booking({ is_demo: true }), 'w', {
      env: { ...smsEnv, ...gEnv },
      businessName: async () => 'Demo',
      record: async () => {},
      smsTransport: async () => {
        throw new Error('no texts on demo');
      },
      createEvent: async () => {
        throw new Error('no Google events on demo');
      },
    });
    assert.deepEqual(patch, { sms_status: 'skipped:demo' });
  });

  it('keeps going when Google fails and with the flag off sends nothing', async () => {
    const patch = await runAfterBook(calendar({ google_refresh_token_enc: 'sealed' }), booking(), 'w', {
      env: { ...gEnv },
      businessName: async () => 'Porchlight',
      record: async () => {},
      smsTransport: async () => {
        throw new Error('flag is off');
      },
      createEvent: async () => {
        throw new Error('Google down');
      },
    });
    assert.deepEqual(patch, { sms_status: 'skipped:disabled' });
  });
});
