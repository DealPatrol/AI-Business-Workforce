import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CITATION_SPRINT_PAYMENT_URL,
  FOUND_PAYMENT_URL,
  FOUND_SETUP_WAIVED_PAYMENT_URL,
  paidThankYouMessage,
  RECOMMENDED_PAYMENT_URL,
  RECOMMENDED_SETUP_WAIVED_PAYMENT_URL,
  SPRINT_SETUP_CREDIT_CODE,
} from '@/lib/fpg/aeo-offer';

describe('AEO payment links and thank-you copy', () => {
  it('keeps the live Front Porch Growth Stripe payment links', () => {
    assert.equal(CITATION_SPRINT_PAYMENT_URL, 'https://buy.stripe.com/00wfZj2Vg68l05Hbus0Ba0k');
    assert.equal(FOUND_PAYMENT_URL, 'https://buy.stripe.com/aFaeVf2Vg1S5g4F4200Ba0l');
    assert.equal(RECOMMENDED_PAYMENT_URL, 'https://buy.stripe.com/3cI14p2Vg8gt8CdgOM0Ba0n');
    assert.equal(FOUND_SETUP_WAIVED_PAYMENT_URL, 'https://buy.stripe.com/9B64gBanIfIVaKleGE0Ba0m');
    assert.equal(RECOMMENDED_SETUP_WAIVED_PAYMENT_URL, 'https://buy.stripe.com/dRmfZj1RceER3hT6a80Ba0o');
    assert.equal(SPRINT_SETUP_CREDIT_CODE, 'SPRINT-SETUP-CREDIT');
  });

  it('returns confirmation copy for sprint, found, recommended, and waived setup', () => {
    const sprint = paidThankYouMessage('sprint');
    assert.match(sprint ?? '', /Citation Sprint/);
    assert.match(paidThankYouMessage(['sprint']) ?? '', /Citation Sprint/);

    const found = paidThankYouMessage('found');
    assert.match(found ?? '', /Found plan/);
    assert.match(found ?? '', /\$750 setup fee/);

    const foundWaived = paidThankYouMessage('found', 'waived');
    assert.match(foundWaived ?? '', /setup fee waived/);
    assert.equal(foundWaived?.includes('$750'), false);

    const recommended = paidThankYouMessage('recommended');
    assert.match(recommended ?? '', /Recommended plan/);
    assert.match(recommended ?? '', /\$1,250 setup fee/);

    const recommendedWaived = paidThankYouMessage('recommended', 'waived');
    assert.match(recommendedWaived ?? '', /setup fee waived/);
    assert.equal(paidThankYouMessage('unknown'), null);
    assert.equal(paidThankYouMessage(undefined), null);
  });
});
