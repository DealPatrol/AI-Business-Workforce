import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEAD_LIST_LINKS } from '@/lib/lead-lists/offers';
import { withUtmParams } from '@/lib/lead-lists/utm';

const CHECKOUT = LEAD_LIST_LINKS.hotLeads500;

describe('withUtmParams', () => {
  it('copies utm_* params onto a Stripe payment link', () => {
    const href = withUtmParams(
      CHECKOUT,
      'utm_source=facebook&utm_medium=paid&utm_campaign=hot-leads&utm_content=ad1&utm_term=leads&utm_id=123',
    );
    const url = new URL(href);
    assert.equal(url.origin + url.pathname, CHECKOUT);
    assert.equal(url.searchParams.get('utm_source'), 'facebook');
    assert.equal(url.searchParams.get('utm_medium'), 'paid');
    assert.equal(url.searchParams.get('utm_campaign'), 'hot-leads');
    assert.equal(url.searchParams.get('utm_content'), 'ad1');
    assert.equal(url.searchParams.get('utm_term'), 'leads');
    assert.equal(url.searchParams.get('utm_id'), '123');
  });

  it('ignores non-utm query params and leaves the link unchanged when none are present', () => {
    assert.equal(withUtmParams(CHECKOUT, '?fbclid=abc&session_id=xyz'), CHECKOUT);
    assert.equal(withUtmParams(CHECKOUT, ''), CHECKOUT);
  });
});
