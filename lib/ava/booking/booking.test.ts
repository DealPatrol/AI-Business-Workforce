import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildIcs, googleCalendarUrl } from '@/lib/ava/booking/ics';
import { bookingToolConfigs } from '@/lib/ava/booking/agent-tools';
import { hashToolSecret, newToolSecret } from '@/lib/ava/booking/secret';
import {
  cleanSettingsInput,
  computeOpenSlots,
  localToUtc,
  pickSlotsToOffer,
  slotLabel,
  type CalendarSettings,
} from '@/lib/ava/booking/slots';
import { bookingWindowLabel } from '@/lib/ava/booking/event';
import { buildAvaAgentPrompt, customerBuiltInTools } from '@/lib/ava/provisioning';

const settings: CalendarSettings = {
  timezone: 'America/Chicago',
  slotMinutes: 120,
  slotCapacity: 1,
  minNoticeMinutes: 120,
  horizonDays: 7,
  weeklyHours: { '1': [['08:00', '17:00']], '2': [['08:00', '17:00']] },
  blackouts: [],
};

// Monday Nov 9, 2026, 6:00 AM Central (12:00 UTC).
const monday6am = new Date('2026-11-09T12:00:00Z');

describe('time zones', () => {
  it('converts Central wall time to UTC on both sides of DST', () => {
    assert.equal(localToUtc('2026-11-09', '08:00', 'America/Chicago').toISOString(), '2026-11-09T14:00:00.000Z');
    assert.equal(localToUtc('2026-07-06', '08:00', 'America/Chicago').toISOString(), '2026-07-06T13:00:00.000Z');
  });

  it('reads a window aloud', () => {
    assert.equal(slotLabel('2026-11-10', 8 * 60, 10 * 60), 'Tuesday, November 10, 8 to 10 AM');
    assert.equal(slotLabel('2026-11-10', 11 * 60, 13 * 60), 'Tuesday, November 10, 11 AM to 1 PM');
    assert.equal(slotLabel('2026-11-10', 10 * 60, 12 * 60), 'Tuesday, November 10, 10 AM to noon');
    assert.equal(slotLabel('2026-11-10', 12 * 60, 14 * 60), 'Tuesday, November 10, noon to 2 PM');
    assert.equal(
      bookingWindowLabel({ start_at: '2026-11-10T14:00:00.000Z', end_at: '2026-11-10T16:00:00.000Z' }, 'America/Chicago'),
      'Tuesday, November 10, 8 to 10 AM',
    );
  });
});

describe('open slots', () => {
  it('builds windows inside business hours after the notice period', () => {
    const slots = computeOpenSlots(settings, [], monday6am);
    // Monday 8-10 starts in 2h which equals min notice, so it is offered; 4 windows fit 8-5 with 2h windows.
    const monday = slots.filter((s) => s.localDate === '2026-11-09');
    assert.deepEqual(monday.map((s) => s.localStart), ['08:00', '10:00', '12:00', '14:00']);
    assert.ok(slots.every((s) => ['2026-11-09', '2026-11-10', '2026-11-16'].includes(s.localDate)));
  });

  it('hides booked windows and blackouts', () => {
    const booked = [{ start_at: '2026-11-09T14:00:00.000Z', end_at: '2026-11-09T16:00:00.000Z' }];
    const slots = computeOpenSlots({ ...settings, blackouts: [{ start: '2026-11-10', end: '2026-11-10' }] }, booked, monday6am);
    assert.ok(!slots.some((s) => s.start === '2026-11-09T14:00:00.000Z'));
    assert.ok(!slots.some((s) => s.localDate === '2026-11-10'));
  });

  it('allows more than one job per window when capacity is higher', () => {
    const booked = [{ start_at: '2026-11-09T14:00:00.000Z', end_at: '2026-11-09T16:00:00.000Z' }];
    const slots = computeOpenSlots({ ...settings, slotCapacity: 2 }, booked, monday6am);
    assert.ok(slots.some((s) => s.start === '2026-11-09T14:00:00.000Z'));
  });

  it('offers the preferred day and part of day, at most four across two days', () => {
    const slots = computeOpenSlots(settings, [], monday6am);
    const afternoon = pickSlotsToOffer(slots, { date: '2026-11-10', partOfDay: 'afternoon' });
    assert.ok(afternoon.length > 0 && afternoon.length <= 4);
    assert.equal(afternoon[0].localDate, '2026-11-10');
    assert.ok(afternoon.every((s) => s.localStart >= '12:00'));
  });
});

describe('settings input', () => {
  it('rejects closing before opening and cleans numbers', () => {
    assert.equal(cleanSettingsInput({ weeklyHours: { '1': [['17:00', '08:00']] } }).ok, false);
    const ok = cleanSettingsInput({ enabled: true, slotMinutes: 5000, weeklyHours: { '2': [['09:00', '12:00']] } });
    assert.ok(ok.ok);
    if (ok.ok) {
      assert.equal(ok.value.slotMinutes, 480);
      assert.deepEqual(ok.value.weeklyHours, { '2': [['09:00', '12:00']] });
      assert.equal(ok.value.enabled, true);
    }
  });
});

describe('calendar links', () => {
  const event = {
    id: 'b1',
    title: 'Porchlight: Dana, no heat',
    start: new Date('2026-11-10T14:00:00Z'),
    end: new Date('2026-11-10T16:00:00Z'),
    description: 'Caller: Dana\nPhone: 2055550134',
    location: '12 Oak St, Gadsden',
  };
  it('writes a valid single-event ics', () => {
    const ics = buildIcs(event, new Date('2026-11-10T00:00:00Z'));
    assert.match(ics, /BEGIN:VEVENT\r\n/);
    assert.match(ics, /DTSTART:20261110T140000Z/);
    assert.match(ics, /SUMMARY:Porchlight: Dana\\, no heat/);
    assert.match(ics, /DESCRIPTION:Caller: Dana\\nPhone/);
  });
  it('builds a Google Calendar template link', () => {
    const url = new URL(googleCalendarUrl(event));
    assert.equal(url.searchParams.get('dates'), '20261110T140000Z/20261110T160000Z');
  });
});

describe('tool auth and agent wiring', () => {
  it('generates distinct secrets and stable hashes', () => {
    const a = newToolSecret();
    assert.notEqual(a, newToolSecret());
    assert.equal(hashToolSecret(a), hashToolSecret(` ${a} `));
  });
  it('sends the secret header and the conversation id from a system variable', () => {
    const [availability, book] = bookingToolConfigs('https://example.test', 'avt_x');
    assert.equal(availability.tool_config.api_schema.url, 'https://example.test/api/ava/availability');
    assert.equal(book.tool_config.api_schema.request_headers['x-ava-tool-secret'], 'avt_x');
    assert.equal(
      (book.tool_config.api_schema.request_body_schema.properties as unknown as Record<string, { dynamic_variable?: string }>).conversation_id
        .dynamic_variable,
      'system__conversation_id',
    );
  });
  const details = {
    businessName: 'Porchlight',
    businessHours: '8-5',
    services: 'HVAC',
    callHandlingRules: 'Take a message.',
    staffName: 'Sam',
    staffContact: 'sam@example.com',
    calendarPreference: 'Email me.',
    urgentCallRules: 'No heat with an infant.',
  };
  it('only lets Ava offer times when booking is on', () => {
    assert.match(buildAvaAgentPrompt(details), /Do not offer appointment times/);
    const on = buildAvaAgentPrompt({ ...details, bookingEnabled: true });
    assert.match(on, /check_availability/);
    assert.doesNotMatch(on, /Do not offer appointment times/);
  });
  it('adds live transfer only with a valid owner number', () => {
    assert.equal(customerBuiltInTools(details).transfer_to_number, null);
    const tools = customerBuiltInTools({ ...details, transferNumber: '+12055550199' });
    assert.ok(tools.transfer_to_number);
    assert.match(buildAvaAgentPrompt({ ...details, transferNumber: '+12055550199' }), /transfer_to_number/);
  });
});
