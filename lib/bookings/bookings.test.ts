import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { onlineBookingLeadPayload, isReceptionistMeterable } from '@/lib/bookings/lead';
import { planBookedLeadBilling } from '@/lib/leads/booked-billing';
import { buildDepositCheckoutParams } from '@/lib/bookings/stripe';
import {
  depositCents,
  generateSlots,
  holdExpiresAt,
  HOLD_MS,
  isHoldActive,
  isValidSlug,
  normalizeSlug,
  slotStillOpen,
  zonedDateTime,
} from '@/lib/bookings/slots';

describe('booking slug and deposit', () => {
  it('normalizes and validates slugs', () => {
    assert.equal(normalizeSlug(' Cole HVAC '), 'cole-hvac');
    assert.equal(isValidSlug('cole-hvac'), true);
    assert.equal(isValidSlug('Cole'), false);
    assert.equal(isValidSlug('a'), false);
  });

  it('uses a fixed deposit or a percent of price', () => {
    assert.equal(depositCents({ priceCents: 20000, depositCents: 5000 }), 5000);
    assert.equal(depositCents({ priceCents: 20000, depositPercent: 25 }), 5000);
    assert.equal(depositCents({ priceCents: 19999, depositPercent: 10 }), 2000);
    assert.equal(depositCents({ priceCents: 10000 }), 0);
  });
});

describe('slot generation', () => {
  const timeZone = 'America/Chicago';
  // 2026-11-10 is a Tuesday
  const hours = [{ weekday: 2, startTime: '09:00', endTime: '12:00' }];

  it('builds open Tuesday morning slots and skips the past', () => {
    const slots = generateSlots({
      date: '2026-11-10',
      timeZone,
      durationMinutes: 60,
      weeklyHours: hours,
      blackouts: [],
      existing: [],
      now: new Date('2026-11-10T08:00:00-06:00'),
    });
    assert.ok(slots.length > 0);
    assert.equal(slots[0].label.includes('9:00') || slots[0].label.includes('09:00'), true);
    const last = slots[slots.length - 1];
    const lastStart = new Date(last.startAt);
    const noon = zonedDateTime('2026-11-10', '12:00', timeZone)!;
    assert.ok(lastStart.getTime() + 60 * 60_000 <= noon.getTime());
  });

  it('hides blackout dates and overlapping bookings', () => {
    const blocked = generateSlots({
      date: '2026-11-10',
      timeZone,
      durationMinutes: 60,
      weeklyHours: hours,
      blackouts: [{ startDate: '2026-11-10', endDate: '2026-11-10' }],
      existing: [],
      now: new Date('2026-11-09T12:00:00Z'),
    });
    assert.equal(blocked.length, 0);

    const nine = zonedDateTime('2026-11-10', '09:00', timeZone)!;
    const ten = zonedDateTime('2026-11-10', '10:00', timeZone)!;
    const slots = generateSlots({
      date: '2026-11-10',
      timeZone,
      durationMinutes: 60,
      weeklyHours: hours,
      blackouts: [],
      existing: [{ startAt: nine.toISOString(), endAt: ten.toISOString(), status: 'confirmed' }],
      now: new Date('2026-11-09T12:00:00Z'),
    });
    assert.equal(slots.some((slot) => slot.startAt === nine.toISOString()), false);
  });

  it('treats an unexpired hold as blocking and an expired hold as free', () => {
    const nine = zonedDateTime('2026-11-10', '09:00', timeZone)!;
    const ten = zonedDateTime('2026-11-10', '10:00', timeZone)!;
    const now = new Date('2026-11-10T08:30:00-06:00');
    assert.equal(
      isHoldActive({ status: 'held', holdExpiresAt: new Date(now.getTime() + 60_000).toISOString(), now }),
      true,
    );
    assert.equal(
      slotStillOpen({
        startAt: nine.toISOString(),
        endAt: ten.toISOString(),
        existing: [
          {
            startAt: nine.toISOString(),
            endAt: ten.toISOString(),
            status: 'held',
            holdExpiresAt: new Date(now.getTime() - 1000).toISOString(),
          },
        ],
        now,
      }),
      true,
    );
    assert.equal(new Date(holdExpiresAt(now)).getTime() - now.getTime(), HOLD_MS);
  });

  it('does not open slots on a closed weekday', () => {
    const slots = generateSlots({
      date: '2026-11-08', // Sunday
      timeZone,
      durationMinutes: 60,
      weeklyHours: hours,
      blackouts: [],
      existing: [],
      now: new Date('2026-11-07T12:00:00Z'),
    });
    assert.equal(slots.length, 0);
  });
});

describe('workforce deposit checkout', () => {
  it('builds a payment-mode session for the workforce product, not receptionist billing', () => {
    const params = buildDepositCheckoutParams({
      origin: 'https://frontporchgrowth.com',
      slug: 'cole-hvac',
      bookingId: 'appt-1',
      serviceName: 'Tune-up',
      businessName: 'Cole HVAC',
      depositCents: 5000,
      customerEmail: 'pat@example.com',
      expiresAtUnix: 1_799_999_999,
    });
    assert.equal(params.get('mode'), 'payment');
    assert.equal(params.get('metadata[product]'), 'workforce_booking');
    assert.equal(params.get('metadata[booking_id]'), 'appt-1');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '5000');
    assert.equal(params.get('success_url')?.includes('/book/cole-hvac/confirmed'), true);
    assert.equal(params.has('subscription_data[trial_period_days]'), false);
  });
});

describe('online booking CRM lead', () => {
  it('creates a Booked lead that must not hit the $25 receptionist meter', () => {
    const payload = onlineBookingLeadPayload({
      ownerId: '33333333-3333-4333-8333-333333333333',
      customerName: 'Pat Neighbor',
      customerPhone: '2565550100',
      customerEmail: 'pat@example.com',
      serviceName: 'Tune-up',
      businessName: 'Cole HVAC',
      startAt: '2026-11-10T15:00:00.000Z',
      endAt: '2026-11-10T16:00:00.000Z',
      timeZone: 'America/Chicago',
      depositCents: 5000,
      appointmentId: '44444444-4444-4444-8444-444444444444',
    });
    assert.equal(payload.source, 'online booking');
    assert.equal(payload.status, 'Booked');
    assert.equal(payload.billing_skipped, true);
    assert.equal(payload.billing_skip_reason, 'online_booking');
    assert.equal(payload.billed_at, null);
    assert.equal(isReceptionistMeterable(payload), false);
    const plan = planBookedLeadBilling({
      lead: {
        booked_at: payload.booked_at,
        billed_at: payload.billed_at,
        source: payload.source,
      },
      jobsAlreadyInPeriod: 0,
      priceConfigured: true,
    });
    assert.equal(plan.type, 'online_booking');
    assert.deepEqual(plan.action, { type: 'skip', cents: 0 });
  });
});
