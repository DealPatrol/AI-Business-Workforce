import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AVA_PLAN_KEYS, AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';
import { buildAvaCheckoutParams } from '@/lib/stripe-checkout';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('monthly plans', () => {
  it('publishes four plans from $79 to $789', () => {
    assert.deepEqual(AVA_PLAN_KEYS, ['starter', 'growth', 'pro', 'elite']);
    assert.deepEqual(
      AVA_PLAN_KEYS.map((k) => [AVA_PLANS[k].monthlyCents, AVA_PLANS[k].minutes]),
      [[7900, 100], [19700, 300], [39700, 1200], [78900, 2000]],
    );
  });

  it('gives every plan a $1 first month', () => {
    for (const key of AVA_PLAN_KEYS) {
      assert.equal(AVA_PLANS[key].firstMonthCents, 100);
      assert.equal(AVA_PLANS[key].firstMonthLabel, '$1');
      assert.ok(AVA_PLANS[key].couponEnv);
    }
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

  for (const planKey of AVA_PLAN_KEYS) {
    it(`${planKey} applies the first-month coupon, no trial, Executive Receptionist branding`, () => {
      const p = buildAvaCheckoutParams({ origin, planKey, priceId: `price_${planKey}`, firstMonthCouponId: `coupon_${planKey}` });
      assert.equal(p.get('mode'), 'subscription');
      assert.equal(p.get('line_items[0][price]'), `price_${planKey}`);
      assert.equal(p.get('discounts[0][coupon]'), `coupon_${planKey}`);
      assert.equal(p.get('subscription_data[trial_period_days]'), null);
      assert.equal(p.get('branding_settings[display_name]'), 'Executive Receptionist');
      assert.equal(p.get('metadata[product]'), 'ava');
      assert.equal(p.get('metadata[plan]'), planKey);
      assert.equal(p.get('metadata[offer]'), 'first_month_1');
      assert.equal(p.get('subscription_data[metadata][included_minutes]'), String(AVA_PLANS[planKey].minutes));
      assert.match(p.get('success_url') || '', new RegExp(`onboarding/ava\\?session_id=\\{CHECKOUT_SESSION_ID\\}&plan=${planKey}`));
    });

    it(`refuses ${planKey} without its coupon so nobody is charged full price by mistake`, () => {
      assert.throws(() => buildAvaCheckoutParams({ origin, planKey, priceId: `price_${planKey}` }));
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
      'lib/ava/trade-pages.ts', 'lib/seo/pages.ts', 'lib/ava/home-faq.ts', 'public/llms.txt', 'app/start/opengraph-image.tsx',
    ];
    for (const rel of files) {
      const source = readFileSync(path.join(root, rel), 'utf8');
      for (const re of [/14-day pilot/i, /per booked job/i, /\$297/, /first booked job/i, /\$119/]) {
        assert.equal(re.test(source), false, `${rel} matches ${re}`);
      }
    }
  });
});
