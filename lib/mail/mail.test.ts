import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateCampaignCost, getMailConfig } from '@/lib/mail/config';
import { createPostcard, verifyLobWebhook } from '@/lib/mail/lob';
import {
  postcardEligibility,
  PostcardCampaign,
  PostcardRecipient,
  renderPostcardHtml,
} from '@/lib/mail/postcard';

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
  after_image_url: 'https://example.com/after.jpg',
  review_status: 'approved',
  mail_vendor_job_id: null,
};

afterEach(() => {
  delete process.env.LOB_MODE;
  delete process.env.MAIL_LIVE_ENABLED;
  delete process.env.LOB_API_KEY;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
      postcardEligibility({ ...baseRecipient, review_status: 'pending_review' }, false),
    ).toEqual({ eligible: false, reason: 'Creative needs human approval.' });
  });

  it('blocks Street View printing by default', () => {
    const recipient = { ...baseRecipient, current_image_source: 'street_view' };
    expect(postcardEligibility(recipient, false).eligible).toBe(false);
    expect(postcardEligibility(recipient, true)).toEqual({ eligible: true });
  });

  it('prevents duplicate vendor jobs', () => {
    expect(
      postcardEligibility({ ...baseRecipient, mail_vendor_job_id: 'psc_existing' }, true)
        .eligible,
    ).toBe(false);
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

describe('postcard creation', () => {
  it('uses a stable Lob idempotency key for each recipient and mode', async () => {
    process.env.LOB_API_KEY = 'test_example';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'psc_1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await createPostcard({
      mode: 'test',
      description: 'Test postcard',
      to: {
        name: 'Current Resident',
        address_line1: '1 Main St',
        address_city: 'Huntsville',
        address_state: 'AL',
        address_zip: '35801',
        address_country: 'US',
      },
      from: {
        name: 'YardProof',
        address_line1: '2 Main St',
        address_city: 'Huntsville',
        address_state: 'AL',
        address_zip: '35801',
        address_country: 'US',
      },
      front: '<html>front</html>',
      back: '<html>back</html>',
      size: '4x6',
      recipientId: baseRecipient.id,
    });

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Idempotency-Key')).toBe('postcard-test-recipient-1');
  });
});

describe('postcard layout', () => {
  it('keeps the 4x6 ink-free zone inside the card', async () => {
    const campaign: PostcardCampaign = {
      name: 'Test campaign',
      business_name: 'YardProof',
      business_phone: '555-0100',
      business_email: null,
    };
    const { back } = await renderPostcardHtml({
      recipient: baseRecipient,
      campaign,
      estimateUrl: 'https://example.com/estimate',
      size: '4x6',
    });

    expect(back).toContain(
      'right:.275in;bottom:.25in;width:3.2835in;height:2.375in',
    );
    expect(back).toContain('<section style="width:1.9in;">');
  });
});
