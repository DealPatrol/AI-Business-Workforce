import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { calculateCampaignCost, getMailConfig } from '@/lib/mail/config';
import { verifyLobWebhook } from '@/lib/mail/lob';
import { postcardEligibility, PostcardRecipient } from '@/lib/mail/postcard';

const baseRecipient: PostcardRecipient = {
  id: 'recipient-1',
  public_token: 'abcdefghijklmnop',
  homeowner_name: null,
  address_line_1: '1 Main St',
  address_line_2: null,
  city: 'Huntsville',
  state: 'AL',
  postal_code: '35801',
  current_image_url: 'https://example.com/before.jpg',
  current_image_source: 'owner_upload',
  rights_basis: 'homeowner_upload',
  privacy_redaction_status: 'redacted',
  after_image_url: 'https://example.com/after.jpg',
  review_status: 'approved',
  mail_vendor_job_id: null,
  do_not_mail: false,
};

afterEach(() => {
  delete process.env.LOB_MODE;
  delete process.env.MAIL_LIVE_ENABLED;
});

describe('mail safety configuration', () => {
  it('stays in test mode unless live mode and the kill switch are both enabled', () => {
    process.env.LOB_MODE = 'live';
    expect(getMailConfig().mode).toBe('test');
    process.env.MAIL_LIVE_ENABLED = 'true';
    expect(getMailConfig().mode).toBe('live');
  });

  it('uses the configured per-card estimate', () => {
    expect(calculateCampaignCost(25, 135)).toBe(3375);
    expect(calculateCampaignCost(25, null)).toBeNull();
  });

});

describe('postcard eligibility', () => {
  it('requires human creative approval', () => {
    expect(
      postcardEligibility({ ...baseRecipient, review_status: 'pending_review' }),
    ).toEqual({ eligible: false, reason: 'Creative needs human approval.' });
  });

  it('always rejects Google imagery as a postcard source', () => {
    const recipient = { ...baseRecipient, current_image_source: 'street_view' };
    expect(postcardEligibility(recipient).eligible).toBe(false);
  });

  it('prevents duplicate vendor jobs', () => {
    expect(
      postcardEligibility({ ...baseRecipient, mail_vendor_job_id: 'psc_existing' })
        .eligible,
    ).toBe(false);
  });

  it('requires rights, privacy redaction, and no suppression', () => {
    expect(postcardEligibility({ ...baseRecipient, rights_basis: null }).eligible).toBe(false);
    expect(
      postcardEligibility({ ...baseRecipient, privacy_redaction_status: 'pending' }).eligible,
    ).toBe(false);
    expect(postcardEligibility({ ...baseRecipient, do_not_mail: true }).eligible).toBe(false);
  });
});

describe('Lob webhook signatures', () => {
  it('accepts a current HMAC and rejects stale or altered payloads', () => {
    const rawBody = '{"id":"evt_1"}';
    const timestamp = '1000';
    const secret = 'webhook-secret';
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    expect(
      verifyLobWebhook({
        rawBody,
        signature,
        timestamp,
        secret,
        nowSeconds: 1100,
      }),
    ).toBe(true);
    expect(
      verifyLobWebhook({
        rawBody: `${rawBody} `,
        signature,
        timestamp,
        secret,
        nowSeconds: 1100,
      }),
    ).toBe(false);
    expect(
      verifyLobWebhook({
        rawBody,
        signature,
        timestamp,
        secret,
        nowSeconds: 1400,
      }),
    ).toBe(false);
  });
});
