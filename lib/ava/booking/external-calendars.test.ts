import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcomBusyRanges, calendlyBusyRanges } from '@/lib/ava/booking/external-calendars';
import { outsideBusy } from '@/lib/ava/booking/after-book';
import type { CalendarRow } from '@/lib/ava/booking/store';

function fakeFetch(routes: Record<string, unknown>, calls: string[] = []) {
  return (async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify(routes[key]), { status: 200 });
  }) as unknown as typeof fetch;
}

describe('Cal.com and Calendly busy time', () => {
  it('reads Cal.com bookings and skips cancelled ones', async () => {
    const f = fakeFetch({
      '/v2/bookings': { status: 'success', data: [
        { start: '2026-11-10T14:00:00Z', end: '2026-11-10T15:00:00Z', status: 'accepted' },
        { start: '2026-11-10T16:00:00Z', end: '2026-11-10T17:00:00Z', status: 'cancelled' },
      ] },
    });
    assert.deepEqual(await calcomBusyRanges('k', '2026-11-10T00:00:00Z', '2026-11-11T00:00:00Z', f), [
      { start_at: '2026-11-10T14:00:00Z', end_at: '2026-11-10T15:00:00Z' },
    ]);
  });

  it('pages Calendly busy times a week at a time', async () => {
    const calls: string[] = [];
    const f = fakeFetch({
      '/users/me': { resource: { uri: 'https://api.calendly.com/users/U1' } },
      '/user_busy_times': { collection: [{ start_time: '2026-11-10T14:00:00Z', end_time: '2026-11-10T15:00:00Z', type: 'calendly' }] },
    }, calls);
    const ranges = await calendlyBusyRanges('t', '2026-11-09T00:00:00Z', '2026-11-20T00:00:00Z', f);
    assert.equal(calls.filter((c) => c.includes('user_busy_times')).length, 2);
    assert.equal(ranges.length, 2);
  });

  it('adds external busy time to the open-slot check and fails open', async () => {
    const cal = { id: 'c', is_demo: false } as unknown as CalendarRow;
    const busy = await outsideBusy(cal, 'a', 'b', { external: async () => [{ start_at: 'x', end_at: 'y' }] });
    assert.deepEqual(busy, [{ start_at: 'x', end_at: 'y' }]);
    const broken = await outsideBusy(cal, 'a', 'b', { external: async () => { throw new Error('down'); } });
    assert.deepEqual(broken, []);
  });
});
