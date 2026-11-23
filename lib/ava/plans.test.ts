import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AVA_PLAN_KEYS, AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';
import { buildAvaCheckoutParams } from '@/lib/stripe-checkout';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('monthly plans', () => {
  it('publishes five plans from $25 to $789, Overflow first', () => {
    assert.deepEqual(AVA_PLAN_KEYS, ['overflow', 'starter', 'growth', 'pro', 'elite']);
    assert.deepEqual(
      AVA_PLAN_KEYS.map((k) => [AVA_PLANS[k].monthlyCents, AVA_PLANS[k].minutes]),
      [[2500, 60], [7900, 100], [19700, 300], [39700, 1200], [78900, 2000]],
    );
  });

  it('Overflow is the only plan with overage: $1/min after 60', () => {
    assert.equal(AVA_PLANS.overflow.overageCentsPerMinute, 100);
    assert.equal(AVA_PLANS.overflow.overageLabel, '$1/min after 60');
    for (const key of ['starter', 'growth', 'pro', 'elite'] as const) assert.equal(AVA_PLANS[key].overageCentsPerMinute, null);
    const copy = AVA_PLANS.overflow.features.join(' ') + ' ' + AVA_PLANS.overflow.description;
    for (const re of [/book/i, /\bsms\b/i, /text/i, /transfer/i, /calendar/i, /in-person/i, /\$59/]) {
      assert.equal(re.test(copy), false, `Overflow copy matches ${re}`);
    }
  });

  it('gives only Starter a $1 first month', () => {
    assert.equal(AVA_PLANS.starter.firstMonthCents, 100);
    for (const key of ['overflow', 'growth', 'pro', 'elite'] as const) assert.equal(AVA_PLANS[key].firstMonthCents, null);
  });

  it('features Pro, with the lowest price per minute', () => {
    const featured = AVA_PLAN_KEYS.filter((k) => AVA_PLANS[k].featured);
    assert.deepEqual(featured, ['pro']);
    const perMinute = (k: (typeof AVA_PLAN_KEYS)[number]) => AVA_PLANS[k].monthlyCents / AVA_PLANS[k].minutes;
    for (const key of AVA_PLAN_KEYS) if (key !== 'pro') assert.ok(perMinute('pro') < perMinute(key), key);
    assert.equal(AVA_PLANS.pro.minutes / AVA_PLANS.growth.minutes, 4);
  });

  it('per-minute labels match the math', () => {
    for (const key of AVA_PLAN_KEYS) {
      const plan = AVA_PLANS[key];
      assert.equal(plan.perMinuteLabel, `$${(plan.monthlyCents / plan.minutes / 100).toFixed(2)}/min`);
    }
  });

  it('no longer accepts the retired pilot or store keys as plans', () => {
    assert.equal(isAvaPlanKey('pilot'), false);
    assert.equal(isAvaPlanKey('store'), false);
    assert.equal(isAvaPlanKey('elite'), true);
  });
});

describe('plan checkout', () => {
  const origin = 'https://executivereceptionist.com';

  it('Starter applies the first-month coupon, no trial, Executive Receptionist branding', () => {
    const p = buildAvaCheckoutParams({ origin, planKey: 'starter', priceId: 'price_starter', firstMonthCouponId: 'coupon1' });
    assert.equal(p.get('mode'), 'subscription');
    assert.equal(p.get('line_items[0][price]'), 'price_starter');
    assert.equal(p.get('discounts[0][coupon]'), 'coupon1');
    assert.equal(p.get('subscription_data[trial_period_days]'), null);
    assert.equal(p.get('branding_settings[display_name]'), 'Executive Receptionist');
    assert.equal(p.get('metadata[product]'), 'ava');
    assert.equal(p.get('metadata[plan]'), 'starter');
    assert.equal(p.get('subscription_data[metadata][included_minutes]'), '100');
    assert.match(p.get('success_url') || '', /onboarding\/ava\?session_id=\{CHECKOUT_SESSION_ID\}&plan=starter/);
  });

  it('refuses Starter without its coupon so nobody is charged $79 by mistake', () => {
    assert.throws(() => buildAvaCheckoutParams({ origin, planKey: 'starter', priceId: 'price_starter' }));
  });

  it('Overflow charges $25 today, no coupon, and discloses $1/min after 60', () => {
    const p = buildAvaCheckoutParams({ origin, planKey: 'overflow', priceId: 'price_overflow', firstMonthCouponId: 'coupon1' });
    assert.equal(p.get('discounts[0][coupon]'), null);
    assert.equal(p.get('line_items[0][price]'), 'price_overflow');
    assert.equal(p.get('line_items[1][price]'), null);
    assert.equal(p.get('metadata[plan]'), 'overflow');
    assert.equal(p.get('metadata[included_minutes]'), '60');
    assert.equal(p.get('subscription_data[metadata][overage_cents]'), '100');
    assert.match(p.get('custom_text[submit][message]') || '', /\$1\/min after 60/);
  });

  it('Overflow adds the metered overage price only when one is configured', () => {
    const p = buildAvaCheckoutParams({ origin, planKey: 'overflow', priceId: 'price_overflow', overagePriceId: 'price_meter' });
    assert.equal(p.get('line_items[1][price]'), 'price_meter');
    assert.equal(p.get('line_items[1][quantity]'), null);
    const s = buildAvaCheckoutParams({ origin, planKey: 'growth', priceId: 'price_growth', overagePriceId: 'price_meter' });
    assert.equal(s.get('line_items[1][price]'), null);
  });

  for (const planKey of ['overflow', 'growth', 'pro', 'elite'] as const) {
    it(`${planKey} charges full price: never a coupon, even if one is passed`, () => {
      const p = buildAvaCheckoutParams({ origin, planKey, priceId: `price_${planKey}`, firstMonthCouponId: 'coupon1' });
      assert.equal(p.get('discounts[0][coupon]'), null);
      assert.equal(p.get('line_items[0][price]'), `price_${planKey}`);
      assert.equal(p.get('metadata[plan]'), planKey);
      assert.equal(p.get('metadata[included_minutes]'), String(AVA_PLANS[planKey].minutes));
    });
  }

  it('refuses to build without a price id', () => {
    assert.throws(() => buildAvaCheckoutParams({ origin, planKey: 'pro' }));
  });
});

describe('public copy', () => {
  it('main pages no longer show the retired free-pilot offer', () => {
    const files = [
      'app/page.tsx', 'app/start/page.tsx', 'app/hvac/page.tsx', 'app/pricing/page.tsx', 'app/ava/page.tsx',
      'app/terms/page.tsx', 'components/ava/OfferPricingLayout.tsx', 'components/receptionist/ReceptionistLanding.tsx',
      'lib/ava/trade-pages.ts', 'lib/seo/pages.ts', 'lib/ava/home-faq.ts', 'lib/seo/llms-txt.ts', 'app/start/opengraph-image.tsx',
    ];
    for (const rel of files) {
      const source = readFileSync(path.join(root, rel), 'utf8');
      for (const re of [/14-day pilot/i, /per booked job/i, /\$297/, /first booked job/i, /\$119/]) {
        assert.equal(re.test(source), false, `${rel} matches ${re}`);
      }
    }
  });
});
