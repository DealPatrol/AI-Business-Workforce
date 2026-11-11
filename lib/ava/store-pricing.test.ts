import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideStoreCallMeter, storeCallMeterParams } from '@/lib/ava/store-call-billing';
import { AVA_STORE_OFFER, storeMonthlyEstimateCents } from '@/lib/ava/store-pricing';
import { buildAvaStoreCheckoutParams } from '@/lib/stripe-checkout';

const spoke = [
  { role: 'agent', message: 'Thanks for calling.' },
  { role: 'user', message: 'Where is my order?' },
];

describe('online store checkout', () => {
  it('uses both prices, a 14-day trial, and store metadata', () => {
    const params = buildAvaStoreCheckoutParams({
      origin: 'https://example.com',
      basePriceId: 'price_base',
      callPriceId: 'price_call',
    });
    assert.equal(params.get('mode'), 'subscription');
    assert.equal(params.get('line_items[0][price]'), 'price_base');
    assert.equal(params.get('line_items[0][quantity]'), '1');
    assert.equal(params.get('line_items[1][price]'), 'price_call');
    assert.equal(params.get('line_items[1][quantity]'), null);
    assert.equal(params.get('subscription_data[trial_period_days]'), '14');
    assert.equal(params.get('payment_method_collection'), 'always');
    assert.equal(params.get('metadata[product]'), 'ava');
    assert.equal(params.get('metadata[plan]'), 'store');
    assert.equal(params.get('subscription_data[metadata][plan]'), 'store');
    assert.equal(params.get('subscription_data[metadata][meter_event]'), 'store_call');
    assert.match(params.get('success_url') || '', /plan=store/);
  });

  it('refuses to build without both price IDs', () => {
    assert.throws(() => buildAvaStoreCheckoutParams({ origin: 'https://example.com', basePriceId: 'price_base' }));
  });

  it('prices $119 plus $1 per call', () => {
    assert.equal(AVA_STORE_OFFER.priceLine, '$119/month + $1 per call Ava handles');
    assert.equal(storeMonthlyEstimateCents(0), 11900);
    assert.equal(storeMonthlyEstimateCents(40), 15900);
  });
});

describe('store call metering', () => {
  const active = { plan: 'store', stripe_customer_id: 'cus_1', subscription_status: 'active' };

  it('bills one event per conversation for an active store customer', () => {
    const decision = decideStoreCallMeter({ customer: active, conversationId: 'conv_1', transcript: spoke });
    assert.deepEqual(decision, { bill: true, stripeCustomerId: 'cus_1', identifier: 'store_call_conv_1' });
    const params = storeCallMeterParams('cus_1', 'store_call_conv_1');
    assert.equal(params.get('event_name'), 'store_call');
    assert.equal(params.get('payload[value]'), '1');
    assert.equal(params.get('payload[stripe_customer_id]'), 'cus_1');
  });

  it('never bills home-service, trial, canceled, or silent calls', () => {
    const base = { conversationId: 'conv_1', transcript: spoke };
    assert.deepEqual(decideStoreCallMeter({ ...base, customer: { ...active, plan: 'pilot' } }), { bill: false, reason: 'not_store' });
    assert.deepEqual(decideStoreCallMeter({ ...base, customer: null }), { bill: false, reason: 'not_store' });
    assert.deepEqual(decideStoreCallMeter({ ...base, customer: { ...active, subscription_status: 'trialing' } }), { bill: false, reason: 'trialing' });
    assert.deepEqual(decideStoreCallMeter({ ...base, customer: { ...active, subscription_status: 'canceled' } }), { bill: false, reason: 'inactive' });
    assert.deepEqual(decideStoreCallMeter({ ...base, customer: { ...active, stripe_customer_id: null } }), { bill: false, reason: 'no_stripe_customer' });
    assert.deepEqual(
      decideStoreCallMeter({ customer: active, conversationId: 'conv_1', transcript: [{ role: 'agent', message: 'Hello?' }] }),
      { bill: false, reason: 'caller_never_spoke' },
    );
    assert.deepEqual(decideStoreCallMeter({ customer: active, conversationId: ' ', transcript: spoke }), { bill: false, reason: 'missing_conversation' });
  });
});
