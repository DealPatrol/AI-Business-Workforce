import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGbpBundleCheckoutParams, buildGbpCareCheckoutParams } from '@/lib/ava/gbp-checkout';
import { GBP_BUNDLES, gbpBundleFromParam, gbpCareKeyFromParam } from '@/lib/ava/gbp-packages';

const env = {
  STRIPE_GBP_CARE_PRICE_ID: 'price_care',
  STRIPE_GBP_CARE_PLUS_PRICE_ID: 'price_careplus',
  STRIPE_GBP_SETUP_PRICE_ID: 'price_setup',
  STRIPE_BUNDLE_ANSWERED_FOUND_PRICE_ID: 'price_b1',
  STRIPE_BUNDLE_BOOKED_FOUND_PRICE_ID: 'price_b2',
  STRIPE_BUNDLE_FRONT_OF_MAP_PRICE_ID: 'price_b3',
} as unknown as NodeJS.ProcessEnv;

describe('Google profile checkout', () => {
  it('parses offer params', () => {
    assert.equal(gbpCareKeyFromParam('careplus'), 'carePlus');
    assert.equal(gbpCareKeyFromParam('care'), 'care');
    assert.equal(gbpCareKeyFromParam('nope'), null);
    assert.equal(gbpBundleFromParam('LOCAL-GROWTH')?.plan, 'growth');
  });

  it('charges care monthly plus the one-time setup, tagged product=gbp', () => {
    const p = buildGbpCareCheckoutParams({ origin: 'https://frontporchgrowth.com', careKey: 'carePlus', env });
    assert.equal(p.get('mode'), 'subscription');
    assert.equal(p.get('line_items[0][price]'), 'price_careplus');
    assert.equal(p.get('line_items[1][price]'), 'price_setup');
    assert.equal(p.get('metadata[product]'), 'gbp');
    assert.match(p.get('custom_text[submit][message]') || '', /\$278/);
  });

  it('sells each bundle as one Ava subscription so the webhook provisions Ava', () => {
    const ids = ['price_b1', 'price_b2', 'price_b3'];
    GBP_BUNDLES.forEach((bundle, i) => {
      const p = buildGbpBundleCheckoutParams({ origin: 'https://executivereceptionist.com', bundle, env });
      assert.equal(p.get('line_items[0][price]'), ids[i]);
      assert.equal(p.get('line_items[1][price]'), null);
      assert.equal(p.get('metadata[product]'), 'ava');
      assert.equal(p.get('subscription_data[metadata][plan]'), bundle.plan);
      assert.match(p.get('success_url') || '', /\/onboarding\/ava\?/);
    });
  });

  it('refuses to build without price env vars', () => {
    assert.throws(() => buildGbpCareCheckoutParams({ origin: 'x', careKey: 'care', env: {} as NodeJS.ProcessEnv }));
    assert.throws(() => buildGbpBundleCheckoutParams({ origin: 'x', bundle: GBP_BUNDLES[0]!, env: {} as NodeJS.ProcessEnv }));
  });
});
