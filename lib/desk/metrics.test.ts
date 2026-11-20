import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeDeskMetrics, formatUsd, metricRange, parseJobValueInput } from './metrics';

const now = new Date('2026-11-20T18:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

test('counts calls, appointments, won leads, rate and revenue in range', () => {
  const m = computeDeskMetrics({
    now,
    rangeDays: 30,
    avgJobValueCents: 45_000,
    calls: [
      { conversation_id: 'c1', created_at: daysAgo(1) },
      { conversation_id: 'c2', created_at: daysAgo(2) },
      { conversation_id: 'c3', created_at: daysAgo(3) },
      { conversation_id: 'c4', created_at: daysAgo(10) },
      { conversation_id: 'old', created_at: daysAgo(40) },
    ],
    bookings: [
      { conversation_id: 'c1', created_at: daysAgo(1), status: 'booked', kind: 'visit' },
      { conversation_id: 'c2', created_at: daysAgo(2), status: 'booked', kind: 'callback' },
      { conversation_id: 'c3', created_at: daysAgo(3), status: 'canceled' },
      { conversation_id: null, created_at: daysAgo(4), status: 'booked' },
      { conversation_id: 'demo', created_at: daysAgo(4), status: 'booked', is_demo: true },
    ],
    leads: [
      { conversation_id: 'c1', status: 'Booked', booked_at: daysAgo(1) },
      { conversation_id: 'c4', status: 'Booked', booked_at: daysAgo(9) },
      { conversation_id: 'c2', status: 'New', called_at: daysAgo(2) },
    ],
  });
  assert.equal(m.calls, 4);
  assert.equal(m.appointments, 2);
  assert.equal(m.won, 2);
  assert.equal(m.bookedCalls, 2); // c1 (appointment + won, once) and c4 (won)
  assert.equal(m.rate, 0.5);
  assert.equal(m.revenueCents, 3 * 45_000); // 2 appointments + c4 won
  assert.equal(m.weeks.length, 5);
  assert.equal(m.weeks.at(-1)?.calls, 3);
});

test('no calls and no job value', () => {
  const m = computeDeskMetrics({ now, rangeDays: 7, avgJobValueCents: null, calls: [], bookings: [], leads: [] });
  assert.equal(m.rate, null);
  assert.equal(m.revenueCents, null);
  assert.equal(m.weeks.length, 1);
});

test('parses job values and ranges', () => {
  assert.equal(parseJobValueInput('$1,250'), 125_000);
  assert.equal(parseJobValueInput('99.5'), 9_950);
  assert.equal(parseJobValueInput(''), null);
  assert.equal(parseJobValueInput('abc'), undefined);
  assert.equal(parseJobValueInput('0.50'), undefined);
  assert.equal(parseJobValueInput('200000'), undefined);
  assert.equal(metricRange('90'), 90);
  assert.equal(metricRange('12'), 30);
  assert.equal(formatUsd(125_000), '$1,250');
});
