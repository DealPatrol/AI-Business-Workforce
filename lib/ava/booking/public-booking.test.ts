import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cleanPublicBookingInput, publicOpenSlots } from '@/lib/ava/booking/public-booking';
import type { CalendarRow } from '@/lib/ava/booking/store';

const calendar = {
  id: 'cal1', onboarding_id: null, label: 'Test', is_demo: false, enabled: true, timezone: 'America/Chicago',
  slot_minutes: 120, slot_capacity: 1, min_notice_minutes: 120, horizon_days: 1,
  weekly_hours: { '1': [['08:00', '12:00']] }, blackouts: [], tool_secret_hash: null, elevenlabs_tool_ids: null,
} as unknown as CalendarRow;

describe('hosted booking page', () => {
  it('validates the form', () => {
    assert.deepEqual(cleanPublicBookingInput({ slot_start: 'x', name: 'A', phone: '123' }), { error: 'Add a phone number with area code.' });
    assert.deepEqual(cleanPublicBookingInput({ slot_start: 'x', name: 'A', phone: '2565550100', email: 'bad' }), { error: 'Check the email address.' });
    const ok = cleanPublicBookingInput({ slot_start: 'x', name: 'A', phone: '2565550100', email: 'A@B.co' });
    assert.ok(!('error' in ok) && ok.email === 'a@b.co');
  });

  it('offers the same windows as the phone, minus booked and outside-busy time, and frees the booking being moved', async () => {
    const now = new Date('2026-11-09T12:00:00Z'); // Monday 6 AM Central
    const booked = [{ id: 'b1', start_at: '2026-11-09T14:00:00.000Z', end_at: '2026-11-09T16:00:00.000Z' }];
    const deps = { list: async () => booked, busy: async () => [] };
    const open = await publicOpenSlots(calendar, now, deps);
    assert.deepEqual(open.map((s) => s.localStart), ['10:00']);
    const moving = await publicOpenSlots(calendar, now, deps, 'b1');
    assert.deepEqual(moving.map((s) => s.localStart), ['08:00', '10:00']);
  });
});
