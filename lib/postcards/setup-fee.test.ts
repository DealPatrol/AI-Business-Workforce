import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizePostcardEmail,
  paidPostcardOrderCountsAsSetup,
  postcardSetupWasCharged,
  sanitizeStripeCustomerId,
  setupStatusFromStripeData,
} from '@/lib/postcards/setup-fee';

describe('postcard setup fee', () => {
  it('normalizes the email used to recognize a returning customer', () => {
    assert.equal(normalizePostcardEmail('  Owner@Example.com '), 'owner@example.com');
    assert.equal(normalizePostcardEmail('not an email'), '');
    assert.equal(normalizePostcardEmail('owner@example.com" OR'), '');
    assert.equal(sanitizeStripeCustomerId('cus_abc123'), 'cus_abc123');
    assert.equal(sanitizeStripeCustomerId('ch_abc123'), '');
  });

  it('counts a paid yardmailer order that included setup', () => {
    assert.equal(
      paidPostcardOrderCountsAsSetup({
        payment_status: 'paid',
        metadata: { product: 'yardmailer', setup_charged: 'true', setup_cents: '12700' },
      }),
      true,
    );
    assert.equal(
      paidPostcardOrderCountsAsSetup({
        payment_status: 'paid',
        metadata: { product: 'yardmailer', setup_cents: '12700' },
      }),
      true,
    );
    assert.equal(
      postcardSetupWasCharged('yardmailer', { setup_charged: 'false', setup_cents: '0' }),
      false,
    );
  });

  it('does not treat an unpaid or card-only order as setup already paid', () => {
    assert.equal(
      paidPostcardOrderCountsAsSetup({
        payment_status: 'unpaid',
        metadata: { product: 'yardmailer', setup_charged: 'true', setup_cents: '12700' },
      }),
      false,
    );
    assert.equal(
      paidPostcardOrderCountsAsSetup({
        payment_status: 'paid',
        metadata: { product: 'yardmailer', setup_charged: 'false', setup_cents: '0' },
      }),
      false,
    );
    assert.equal(
      paidPostcardOrderCountsAsSetup({
        payment_status: 'paid',
        metadata: { product: 'ava', setup_cents: '0' },
      }),
      false,
    );
  });

  it('counts a paid legacy yardproof setup and ignores a different email', () => {
    const status = setupStatusFromStripeData({
      email: 'owner@example.com',
      customers: [
        { id: 'cus_other', email: 'other@example.com' },
        { id: 'cus_owner', email: 'Owner@Example.com' },
      ],
      sessionsByCustomer: {
        cus_other: [
          {
            id: 'cs_other',
            payment_status: 'paid',
            metadata: { product: 'yardmailer', setup_charged: 'true', setup_cents: '12700' },
          },
        ],
        cus_owner: [
          {
            id: 'cs_cards',
            payment_status: 'paid',
            metadata: { product: 'yardmailer', setup_charged: 'false', setup_cents: '0' },
          },
          {
            id: 'cs_legacy',
            payment_status: 'paid',
            metadata: { product: 'yardproof', setup_cents: '38900' },
          },
        ],
      },
    });
    assert.deepEqual(status, { paid: true, customerId: 'cus_owner' });
  });

  it('returns the Stripe customer without waiving setup when no paid setup exists', () => {
    const status = setupStatusFromStripeData({
      email: 'owner@example.com',
      customers: [{ id: 'cus_owner', email: 'owner@example.com' }],
      sessionsByCustomer: {
        cus_owner: [
          {
            id: 'cs_cards',
            payment_status: 'paid',
            metadata: { product: 'yardmailer', setup_charged: 'false' },
          },
        ],
      },
    });
    assert.deepEqual(status, { paid: false, customerId: 'cus_owner' });
  });
});
