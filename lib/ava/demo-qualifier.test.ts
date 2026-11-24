import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bundleForPlan, planForMinutes, qualify } from '@/lib/ava/demo-qualifier';
import { GBP_BUNDLES, GBP_CARE, GBP_PRICES_ARE_PROPOSED } from '@/lib/ava/gbp-packages';
import { AVA_PLANS } from '@/lib/ava/pricing';

describe('demo qualifier', () => {
  it('picks the smallest plan that covers the minutes', () => {
    assert.equal(planForMinutes(0), 'overflow');
    assert.equal(planForMinutes(60), 'overflow');
    assert.equal(planForMinutes(61), 'starter');
    assert.equal(planForMinutes(250), 'growth');
    assert.equal(planForMinutes(1000), 'pro');
    assert.equal(planForMinutes(1800), 'elite');
    assert.equal(planForMinutes(9000), 'elite');
  });

  it('maps plans to bundles and leaves Elite unbundled', () => {
    assert.equal(bundleForPlan('overflow')?.plan, 'starter');
    assert.equal(bundleForPlan('growth')?.plan, 'growth');
    assert.equal(bundleForPlan('pro')?.plan, 'pro');
    assert.equal(bundleForPlan('elite'), null);
  });

  it('runs the arithmetic on the visitor numbers and skips the bundle when the profile is fine', () => {
    const hot = qualify({ callsPerWeek: 40, missedPercent: 25, minutesPerCall: 3, jobValue: 400, oneIn: 3, gbp: 'thin' });
    assert.equal(hot.missedPerWeek, 10);
    assert.equal(hot.minutesPerMonth, 130);
    assert.equal(hot.plan, 'growth');
    assert.equal(hot.bundle?.key, 'local-growth');
    assert.equal(hot.heat, 'hot');
    assert.match(hot.summary, /not a forecast/);
    const noBundle = qualify({ callsPerWeek: 40, missedPercent: 25, minutesPerCall: 3, jobValue: 400, oneIn: 3, gbp: 'good' });
    assert.equal(noBundle.bundle, null);
  });

  it('clamps junk input', () => {
    const r = qualify({ callsPerWeek: Number.NaN, missedPercent: 500, minutesPerCall: -1, jobValue: -5, oneIn: 0, gbp: 'none' });
    assert.equal(r.missedPerWeek, 0);
    assert.equal(r.monthlyExample, 0);
  });
});

describe('GBP bundles', () => {
  it('cost less than buying the plan and care tier separately', () => {
    assert.equal(GBP_PRICES_ARE_PROPOSED, false);
    for (const b of GBP_BUNDLES) {
      assert.equal(b.separateCents, AVA_PLANS[b.plan].monthlyCents + GBP_CARE[b.care].monthlyCents);
      assert.ok(b.monthlyCents < b.separateCents, b.key);
    }
  });
});
