import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addonCheckoutHref,
  genericHotThanksView,
  hotThanksViewFromSession,
  isHotLeads500Order,
  isPaidCheckoutSession,
  isValidCheckoutSessionId,
  type StripeCheckoutSession,
} from '@/lib/lead-lists/hot-thanks';
import { HOT_LEADS_500_PAYMENT_LINK_ID, LEAD_LIST_LINKS } from '@/lib/lead-lists/offers';

const paidHotSession: StripeCheckoutSession = {
  id: 'cs_live_example',
  status: 'complete',
  payment_status: 'paid',
  payment_link: HOT_LEADS_500_PAYMENT_LINK_ID,
  metadata: { offer: 'hot-leads-500' },
  customer_details: { email: 'buyer@example.com' },
  custom_fields: [
    { key: 'industry', text: { value: ' dentists ' } },
    { key: 'area', text: { value: 'Birmingham, AL' } },
  ],
};

describe('hot leads thank-you verification', () => {
  it('accepts live and test Checkout Session ids and rejects junk', () => {
    assert.equal(isValidCheckoutSessionId('cs_live_abc123'), true);
    assert.equal(isValidCheckoutSessionId('cs_test_abc123'), true);
    assert.equal(isValidCheckoutSessionId('cs_abc123'), false);
    assert.equal(isValidCheckoutSessionId('pi_live_abc123'), false);
    assert.equal(isValidCheckoutSessionId(''), false);
    assert.equal(isValidCheckoutSessionId('../cs_live_abc123'), false);
  });

  it('recognizes a Hot Leads 500 order by payment link or metadata', () => {
    assert.equal(isHotLeads500Order(paidHotSession), true);
    assert.equal(isHotLeads500Order({ metadata: { offer: 'hot-leads-500' } }), true);
    assert.equal(isHotLeads500Order({ payment_link: { id: HOT_LEADS_500_PAYMENT_LINK_ID } }), true);
    assert.equal(isHotLeads500Order({ metadata: { offer: 'hot-leads-addon-1000' } }), false);
    assert.equal(isHotLeads500Order({ payment_link: 'plink_other' }), false);
  });

  it('requires a completed paid session', () => {
    assert.equal(isPaidCheckoutSession(paidHotSession), true);
    assert.equal(isPaidCheckoutSession({ status: 'complete', payment_status: 'unpaid' }), false);
    assert.equal(isPaidCheckoutSession({ status: 'open', payment_status: 'paid' }), false);
  });

  it('shows the add-on only for a paid Hot Leads 500 session when a secret is configured', () => {
    const view = hotThanksViewFromSession(paidHotSession, { secretConfigured: true });
    assert.equal(view.showAddon, true);
    assert.equal(view.industry, 'dentists');
    assert.equal(view.area, 'Birmingham, AL');
    assert.equal(view.email, 'buyer@example.com');
    assert.equal(view.addonHref, addonCheckoutHref(LEAD_LIST_LINKS.hotAddon1000, 'buyer@example.com'));
    assert.ok(view.addonHref.includes('prefilled_email=buyer%40example.com'));
  });

  it('hides the add-on when the secret is missing, even if a matching session is passed in', () => {
    const view = hotThanksViewFromSession(paidHotSession, { secretConfigured: false });
    assert.deepEqual(view, genericHotThanksView());
    assert.equal(view.showAddon, false);
  });

  it('hides the add-on for unpaid sessions and for other offers', () => {
    const unpaid = hotThanksViewFromSession(
      { ...paidHotSession, payment_status: 'unpaid' },
      { secretConfigured: true },
    );
    const otherOffer = hotThanksViewFromSession(
      { ...paidHotSession, payment_link: 'plink_other', metadata: { offer: 'leads-1000' } },
      { secretConfigured: true },
    );
    assert.equal(unpaid.showAddon, false);
    assert.equal(otherOffer.showAddon, false);
  });

  it('leaves the add-on URL unchanged when there is no email to prefill', () => {
    assert.equal(addonCheckoutHref(LEAD_LIST_LINKS.hotAddon1000, ''), LEAD_LIST_LINKS.hotAddon1000);
  });
});
