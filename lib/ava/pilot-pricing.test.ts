import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PILOT_MONTHLY_CAP_CENTS,
  PILOT_PLANS,
  PILOT_PLAN_KEYS,
  PILOT_SALE_CENTS,
  PILOT_TRIAL_DAYS,
  decideSaleBilling,
  isPilotPlanKey,
  pilotPriceIdEnvName,
  type SaleBillingOutcome,
} from '@/lib/ava/pilot-pricing';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { buildAvaCheckoutParams, buildAvaPilotCheckoutParams } from '@/lib/stripe-checkout';

/** Simulates N sales in one billing period and returns what each was billed. */
function simulate(baseCents: number, sales: number, status = 'active') {
  const billed: number[] = [];
  const outcomes: SaleBillingOutcome[] = [];
  let soFar = 0;
  for (let i = 0; i < sales; i += 1) {
    const decision = decideSaleBilling({ subscriptionStatus: status, baseCents, billedSoFarCents: soFar });
    billed.push(decision.billedCents);
    outcomes.push(decision.outcome);
    soFar += decision.billedCents;
  }
  return { billed, outcomes, total: baseCents + soFar };
}

describe('pilot pricing constants', () => {
  it('matches the agreed pilot terms', () => {
    assert.equal(PILOT_TRIAL_DAYS, 14);
    assert.equal(PILOT_SALE_CENTS, 5000);
    assert.equal(PILOT_MONTHLY_CAP_CENTS, 39700);
    assert.deepEqual(
      PILOT_PLAN_KEYS.map((key) => PILOT_PLANS[key].baseCents),
      [9700, 14700, 19700],
    );
  });

  it('does not touch the live plans', () => {
    assert.deepEqual(
      Object.values(AVA_PLANS).map((plan) => plan.monthlyCents),
      [7700, 16800, 32400],
    );
    for (const key of PILOT_PLAN_KEYS) assert.equal(key in AVA_PLANS, false);
    assert.equal(isPilotPlanKey('starter'), false);
    assert.equal(isPilotPlanKey('pilot_97'), true);
    assert.equal(isPilotPlanKey('constructor'), false);
    assert.equal(isPilotPlanKey(null), false);
  });

  it('names one optional price env var per tier', () => {
    assert.deepEqual(PILOT_PLAN_KEYS.map(pilotPriceIdEnvName), [
      'STRIPE_AVA_PILOT_97_PRICE_ID',
      'STRIPE_AVA_PILOT_147_PRICE_ID',
      'STRIPE_AVA_PILOT_197_PRICE_ID',
    ]);
  });
});

describe('cap math', () => {
  it('bills $50 per sale until base + sales reaches exactly $397', () => {
    // $97 base leaves $300 = 6 sales; $147 leaves $250 = 5; $197 leaves $200 = 4.
    const expectedFull = { pilot_97: 6, pilot_147: 5, pilot_197: 4 } as const;
    for (const key of PILOT_PLAN_KEYS) {
      const base = PILOT_PLANS[key].baseCents;
      const result = simulate(base, 10);
      const full = result.billed.filter((cents) => cents === 5000).length;
      assert.equal(full, expectedFull[key], key);
      assert.equal(result.total, 39700, `${key} total lands exactly on the cap`);
      // everything after the cap is recorded but free
      assert.deepEqual(result.outcomes.slice(expectedFull[key]), Array(10 - expectedFull[key]).fill('capped'));
    }
  });

  it('trims the sale that crosses the cap to a partial charge', () => {
    // base $120 -> $277 room -> 5 x $50 then $27, then $0
    const result = simulate(12000, 8);
    assert.deepEqual(result.billed, [5000, 5000, 5000, 5000, 5000, 2700, 0, 0]);
    assert.equal(result.outcomes[5], 'partial_cap');
    assert.equal(result.outcomes[6], 'capped');
    assert.equal(result.total, 39700);
  });

  it('never exceeds the cap for any base and sale count', () => {
    for (let base = 0; base <= 39700; base += 1300) {
      for (const sales of [0, 1, 3, 7, 20]) {
        assert.ok(simulate(base, sales).total <= Math.max(39700, base), `base ${base} sales ${sales}`);
      }
    }
  });

  it('bills $0 when the base alone already meets or exceeds the cap', () => {
    assert.deepEqual(simulate(39700, 2).billed, [0, 0]);
    assert.deepEqual(simulate(45000, 1).outcomes, ['capped']);
  });
});

describe('trial rule', () => {
  it('records sales made while trialing but never bills them', () => {
    const result = simulate(9700, 5, 'trialing');
    assert.deepEqual(result.billed, [0, 0, 0, 0, 0]);
    assert.deepEqual(result.outcomes, Array(5).fill('trial'));
  });

  it('does not let trial sales count toward the first paid period cap', () => {
    // trial sales bill $0, so billedSoFar for the next period stays 0 and the first 6 paid sales bill in full
    const trial = simulate(9700, 3, 'trialing');
    assert.equal(trial.total, 9700);
    const paid = decideSaleBilling({ subscriptionStatus: 'active', baseCents: 9700, billedSoFarCents: 0 });
    assert.deepEqual(paid, { outcome: 'billed', billedCents: 5000 });
  });

  it('bills past_due subscriptions but not canceled or unpaid ones', () => {
    assert.equal(decideSaleBilling({ subscriptionStatus: 'past_due', baseCents: 9700, billedSoFarCents: 0 }).billedCents, 5000);
    for (const status of ['canceled', 'unpaid', 'paused', 'incomplete', 'incomplete_expired', '']) {
      assert.deepEqual(decideSaleBilling({ subscriptionStatus: status, baseCents: 9700, billedSoFarCents: 0 }), {
        outcome: 'inactive',
        billedCents: 0,
      });
    }
  });
});

describe('pilot checkout params', () => {
  const params = buildAvaPilotCheckoutParams({ origin: 'https://example.test', planKey: 'pilot_147' });

  it('creates a card-required 14-day trial subscription on the chosen tier', () => {
    assert.equal(params.get('mode'), 'subscription');
    assert.equal(params.get('payment_method_collection'), 'always');
    assert.equal(params.get('subscription_data[trial_period_days]'), '14');
    assert.equal(params.get('subscription_data[trial_settings][end_behavior][missing_payment_method]'), 'cancel');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '14700');
    assert.equal(params.get('line_items[0][price_data][recurring][interval]'), 'month');
    assert.equal(params.get('cancel_url'), 'https://example.test/receptionist/pilot');
    assert.match(params.get('success_url') || '', /plan=pilot_147$/);
  });

  it('tags the session and subscription so webhooks and sales can find the pilot plan', () => {
    for (const prefix of ['metadata', 'subscription_data[metadata]']) {
      assert.equal(params.get(`${prefix}[product]`), 'ava');
      assert.equal(params.get(`${prefix}[plan]`), 'pilot_147');
      assert.equal(params.get(`${prefix}[pricing]`), 'pilot');
      assert.equal(params.get(`${prefix}[cap_cents]`), '39700');
    }
  });

  it('uses a pre-created price instead of price_data when one is supplied', () => {
    const withPrice = buildAvaPilotCheckoutParams({
      origin: 'https://example.test',
      planKey: 'pilot_97',
      priceId: 'price_123',
    });
    assert.equal(withPrice.get('line_items[0][price]'), 'price_123');
    assert.equal(withPrice.get('line_items[0][price_data][unit_amount]'), null);
  });

  it('leaves the live checkout builder on the 7-day trial and live prices', () => {
    const live = buildAvaCheckoutParams({ origin: 'https://example.test', planKey: 'starter' });
    assert.equal(live.get('subscription_data[trial_period_days]'), '7');
    assert.equal(live.get('line_items[0][price_data][unit_amount]'), '7700');
    assert.equal(live.get('payment_method_collection'), null);
    assert.equal(live.get('metadata[pricing]'), null);
  });
});
