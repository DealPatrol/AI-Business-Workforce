import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  decidePostcardSetupCharge,
  normalizePostcardEmail,
  paidPostcardOrderCountsAsSetup,
  postcardSetupWasCharged,
  sanitizeStripeCustomerId,
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
      postcardSetupWasCharged('yardproof', { setup_cents: '38900' }),
      true,
    );
    assert.equal(postcardSetupWasCharged('yardproof', { setup_charged: 'false' }), false);
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

  it('does not waive setup for an anonymous buyer or an unconfirmed email', () => {
    const paid = { customerId: 'cus_owner' };
    assert.deepEqual(decidePostcardSetupCharge({ buyer: null, paidSetup: paid }), {
      includeSetup: true,
      customerId: '',
      customerEmail: '',
    });
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: 'owner@example.com', emailConfirmedAt: null },
        paidSetup: paid,
      }),
      { includeSetup: true, customerId: '', customerEmail: '' },
    );
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: 'owner@example.com', emailConfirmedAt: '   ' },
        paidSetup: paid,
      }),
      { includeSetup: true, customerId: '', customerEmail: '' },
    );
  });

  it('does not waive setup for a verified buyer until a paid setup row exists', () => {
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: 'owner@example.com', emailConfirmedAt: '2026-10-01T00:00:00Z' },
        paidSetup: null,
      }),
      { includeSetup: true, customerId: '', customerEmail: '' },
    );
  });

  it('waives setup for a verified buyer with a webhook-written paid setup row', () => {
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: ' Owner@Example.com ', emailConfirmedAt: '2026-10-01T00:00:00Z' },
        paidSetup: { customerId: 'cus_owner' },
      }),
      { includeSetup: false, customerId: 'cus_owner', customerEmail: '' },
    );
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: 'owner@example.com', emailConfirmedAt: '2026-10-01T00:00:00Z' },
        paidSetup: { customerId: '' },
      }),
      { includeSetup: false, customerId: '', customerEmail: 'owner@example.com' },
    );
    assert.deepEqual(
      decidePostcardSetupCharge({
        buyer: { email: 'owner@example.com', emailConfirmedAt: '2026-10-01T00:00:00Z' },
        paidSetup: { customerId: 'ch_not_a_customer' },
      }),
      { includeSetup: false, customerId: '', customerEmail: 'owner@example.com' },
    );
  });
});
