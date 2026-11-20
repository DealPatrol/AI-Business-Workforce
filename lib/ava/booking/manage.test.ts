import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleCancel, handleFindBooking, handleReschedule, type ManageDeps } from '@/lib/ava/booking/manage';
import { manageBookingToolConfigs } from '@/lib/ava/booking/agent-tools';
import type { BookingRow, CalendarRow } from '@/lib/ava/booking/store';

const calendar = {
  id: 'cal1', onboarding_id: 'o1', label: 'Test', is_demo: false, enabled: true, timezone: 'America/Chicago',
  slot_minutes: 120, slot_capacity: 1, min_notice_minutes: 120, horizon_days: 7,
  weekly_hours: { '1': [['08:00', '17:00']], '2': [['08:00', '17:00']] }, blackouts: [], tool_secret_hash: null, elevenlabs_tool_ids: null,
} as unknown as CalendarRow;

// Monday Nov 9, 2026, 6:00 AM Central.
const now = new Date('2026-11-09T12:00:00Z');

function booking(over: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'b1', calendar_id: 'cal1', start_at: '2026-11-10T14:00:00.000Z', end_at: '2026-11-10T16:00:00.000Z', status: 'booked',
    caller_name: 'Mark', caller_phone: '256-555-0148', service_address: null, issue: null, conversation_id: null, is_demo: false,
    created_at: '2026-11-08T00:00:00Z', ...over,
  };
}

function deps(rows: BookingRow[], log: string[] = []): ManageDeps {
  return {
    upcoming: async (_c, phone) => rows.filter((r) => r.caller_phone?.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10))),
    get: async (id) => rows.find((r) => r.id === id) ?? null,
    list: async () => rows,
    busy: async () => [],
    move: async (id, start, end) => {
      log.push(`move ${id} ${start}`);
      return { ...rows.find((r) => r.id === id)!, start_at: start, end_at: end };
    },
    cancel: async (id) => {
      log.push(`cancel ${id}`);
    },
    syncGoogle: async (_c, b, action) => {
      log.push(`google ${action} ${b.id}`);
    },
  };
}

describe('change an appointment by phone', () => {
  it('finds upcoming bookings by number', async () => {
    const r = await handleFindBooking(calendar, { caller_phone: '(256) 555-0148' }, now, deps([booking()]));
    assert.equal(r.found, true);
    assert.equal(r.bookings?.[0].window, 'Tuesday, November 10, 8 to 10 AM');
  });

  it('refuses a booking whose number does not match', async () => {
    const log: string[] = [];
    const r = await handleCancel(calendar, { booking_id: 'b1', caller_phone: '2565550000' }, now, deps([booking()], log));
    assert.equal(r.canceled, false);
    assert.deepEqual(log, []);
  });

  it('refuses a booking on another calendar', async () => {
    const r = await handleCancel(calendar, { booking_id: 'b1', caller_phone: '2565550148' }, now, deps([booking({ calendar_id: 'other' })]));
    assert.equal(r.canceled, false);
  });

  it('cancels and removes the Google event', async () => {
    const log: string[] = [];
    const r = await handleCancel(calendar, { booking_id: 'b1', caller_phone: '2565550148' }, now, deps([booking()], log));
    assert.equal(r.canceled, true);
    assert.deepEqual(log, ['cancel b1', 'google delete b1']);
  });

  it('offers windows, then moves to an open one (its own old window counts as free)', async () => {
    const log: string[] = [];
    const d = deps([booking()], log);
    const offer = await handleReschedule(calendar, { booking_id: 'b1', caller_phone: '2565550148', preferred_date: '2026-11-10' }, now, d);
    assert.equal(offer.rescheduled, false);
    assert.ok(offer.slots && offer.slots.length > 0);
    const moved = await handleReschedule(calendar, { booking_id: 'b1', caller_phone: '2565550148', new_slot_start: '2026-11-10T18:00:00.000Z' }, now, d);
    assert.equal(moved.rescheduled, true);
    assert.deepEqual(log, ['move b1 2026-11-10T18:00:00.000Z', 'google move b1']);
  });

  it('does not move into a closed window', async () => {
    const r = await handleReschedule(calendar, { booking_id: 'b1', caller_phone: '2565550148', new_slot_start: '2026-11-11T03:00:00.000Z' }, now, deps([booking()]));
    assert.equal(r.rescheduled, false);
  });

  it('defines three webhook tools on this app', () => {
    const tools = manageBookingToolConfigs('https://x.test', 'avt_x');
    assert.deepEqual(tools.map((t) => t.tool_config.name), ['find_booking', 'reschedule_appointment', 'cancel_appointment']);
    assert.ok(tools.every((t) => t.tool_config.api_schema.url.startsWith('https://x.test/api/ava/')));
  });
});
