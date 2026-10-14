import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  POSTCARD_MAX_QUANTITY,
  POSTCARD_MIN_QUANTITY,
  POSTCARD_SETUP_CENTS,
  formatPostcardMoney,
  parsePostcardQuantity,
  postcardCheckoutHref,
  postcardOrderCents,
  postcardPackageRows,
} from '@/lib/postcards/pricing';
import {
  buildPostcardCheckoutParams,
  isPostcardCheckoutProduct,
} from '@/lib/stripe-checkout';

describe('postcard package prices', () => {
  it('includes the one-time setup fee in the published packages', () => {
    assert.equal(POSTCARD_SETUP_CENTS, 12700);
    const rows = postcardPackageRows();
    assert.deepEqual(
      rows.map((row) => [row.quantity, row.fourBySixLabel, row.sixByNineLabel]),
      [
        [100, '$481', '$622'],
        [250, '$1,012', '$1,364.50'],
        [500, '$1,897', '$2,602'],
      ],
    );
    assert.equal(postcardOrderCents('4x6', 100).totalCents, 48100);
    assert.equal(postcardOrderCents('6x9', 100).totalCents, 62200);
    assert.equal(postcardOrderCents('4x6', 250).totalCents, 101200);
    assert.equal(postcardOrderCents('6x9', 250).totalCents, 136450);
    assert.equal(postcardOrderCents('4x6', 500).totalCents, 189700);
    assert.equal(postcardOrderCents('6x9', 500).totalCents, 260200);
  });

  it('prices a custom quantity from the per-card amount', () => {
    assert.equal(formatPostcardMoney(postcardOrderCents('4x6', 175).totalCents), '$746.50');
    assert.equal(formatPostcardMoney(postcardOrderCents('6x9', 175).totalCents), '$993.25');
    assert.equal(parsePostcardQuantity(100), 100);
    assert.equal(parsePostcardQuantity('250'), 250);
    assert.equal(parsePostcardQuantity(POSTCARD_MAX_QUANTITY), POSTCARD_MAX_QUANTITY);
    assert.equal(parsePostcardQuantity(POSTCARD_MIN_QUANTITY - 1), null);
    assert.equal(parsePostcardQuantity(POSTCARD_MAX_QUANTITY + 1), null);
    assert.equal(parsePostcardQuantity(100.5), null);
    assert.equal(parsePostcardQuantity('100.5'), null);
    assert.equal(parsePostcardQuantity('abc'), null);
  });
});

describe('postcard checkout session', () => {
  it('builds a one-time payment with setup and per-card line items', () => {
    const params = buildPostcardCheckoutParams({
      origin: 'https://frontporchgrowth.com',
      cancelPath: '/postcards#packages',
      size: '6x9',
      quantity: 250,
    });
    const body = params.toString();
    assert.equal(params.get('mode'), 'payment');
    assert.equal(body.includes('recurring'), false);
    assert.equal(body.includes('subscription_data'), false);
    assert.equal(params.get('line_items[0][quantity]'), '1');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '12700');
    assert.equal(params.get('line_items[0][price]'), null);
    assert.equal(params.get('line_items[1][quantity]'), '250');
    assert.equal(params.get('line_items[1][price_data][unit_amount]'), '495');
    assert.equal(params.get('line_items[1][price_data][currency]'), 'usd');
    assert.equal(params.get('metadata[product]'), 'yardmailer');
    assert.equal(params.get('metadata[size]'), '6x9');
    assert.equal(params.get('metadata[quantity]'), '250');
    assert.equal(params.get('payment_intent_data[metadata][product]'), 'yardmailer');
    assert.equal(params.get('cancel_url'), 'https://frontporchgrowth.com/postcards#packages');
  });

  it('uses optional Stripe price ids when they are set', () => {
    const params = buildPostcardCheckoutParams({
      origin: 'https://frontporchgrowth.com',
      cancelPath: '/',
      size: '4x6',
      quantity: 100,
      setupPriceId: 'price_setup127',
      cardPriceId: 'price_card4x6',
    });
    assert.equal(params.get('line_items[0][price]'), 'price_setup127');
    assert.equal(params.get('line_items[0][quantity]'), '1');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), null);
    assert.equal(params.get('line_items[1][price]'), 'price_card4x6');
    assert.equal(params.get('line_items[1][quantity]'), '100');
    assert.equal(params.get('line_items[1][price_data][unit_amount]'), null);
    assert.equal(params.get('metadata[product]'), 'yardmailer');
    assert.equal(params.get('metadata[size]'), '4x6');
    assert.equal(params.get('metadata[quantity]'), '100');
  });

  it('treats legacy yardproof sessions the same as yardmailer', () => {
    assert.equal(isPostcardCheckoutProduct('yardmailer'), true);
    assert.equal(isPostcardCheckoutProduct('yardproof'), true);
    assert.equal(isPostcardCheckoutProduct('ava'), false);
    assert.equal(isPostcardCheckoutProduct(''), false);
    assert.equal(isPostcardCheckoutProduct(undefined), false);
  });

  it('builds a checkout path with size and quantity', () => {
    assert.equal(
      postcardCheckoutHref({ size: '4x6', quantity: 500, cancelPath: '/pricing' }),
      '/api/checkout?offer=postcard&size=4x6&quantity=500&cancel=%2Fpricing',
    );
  });
});
