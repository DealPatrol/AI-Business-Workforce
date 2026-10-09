import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FOUNDING_MONTHLY_CENTS } from '@/lib/stripe-checkout';
import { getSiteUrl } from '@/lib/site-url';
import {
  LIST_UNSUBSCRIBE_POST,
  coldEmailEnabled,
  createColdEmailTransport,
  listUnsubscribeHeaders,
} from '@/lib/prospector/transport';
import { ProspectorSetupError } from '@/lib/prospector/errors';

describe('cold email stays off and unsent', () => {
  it('treats a missing flag as off', () => {
    const previous = process.env.COLD_EMAIL_ENABLED;
    delete process.env.COLD_EMAIL_ENABLED;
    assert.equal(coldEmailEnabled(), false);
    if (previous === undefined) delete process.env.COLD_EMAIL_ENABLED;
    else process.env.COLD_EMAIL_ENABLED = previous;
  });

  it('builds one-click unsubscribe headers and the stub does not send', async () => {
    const headers = listUnsubscribeHeaders('https://frontporchgrowth.com/prospector/unsubscribe?token=abc');
    assert.equal(headers['List-Unsubscribe'], '<https://frontporchgrowth.com/prospector/unsubscribe?token=abc>');
    assert.equal(headers['List-Unsubscribe-Post'], LIST_UNSUBSCRIBE_POST);
    assert.equal(LIST_UNSUBSCRIBE_POST, 'List-Unsubscribe=One-Click');

    const previousEnabled = process.env.COLD_EMAIL_ENABLED;
    const previousTransport = process.env.COLD_EMAIL_TRANSPORT;
    process.env.COLD_EMAIL_ENABLED = 'true';
    process.env.COLD_EMAIL_TRANSPORT = 'instantly';
    const transport = createColdEmailTransport();
    await assert.rejects(
      () => transport.send({
        from: 'Cole <cole@example.com>',
        to: 'owner@example.com',
        subject: 'Hello',
        text: 'Hello',
        html: '<p>Hello</p>',
        headers,
      }),
      (error: unknown) => error instanceof ProspectorSetupError && /Nothing was sent/.test(error.message),
    );
    if (previousEnabled === undefined) delete process.env.COLD_EMAIL_ENABLED;
    else process.env.COLD_EMAIL_ENABLED = previousEnabled;
    if (previousTransport === undefined) delete process.env.COLD_EMAIL_TRANSPORT;
    else process.env.COLD_EMAIL_TRANSPORT = previousTransport;
  });
});

describe('public site url', () => {
  it('falls back to frontporchgrowth.com', () => {
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
    const previousApp = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    assert.equal(getSiteUrl(), 'https://frontporchgrowth.com');
    assert.equal(FOUNDING_MONTHLY_CENTS, 9900);
    if (previousSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    if (previousApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousApp;
  });
});
