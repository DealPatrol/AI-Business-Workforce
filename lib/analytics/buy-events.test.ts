import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { buyLinkEventSourceUrl, trackBuyLinkCheckout } from '@/lib/analytics/buy-events';

describe('buy link ad events', () => {
  const saved = {
    token: process.env.META_CAPI_TOKEN,
    pixel: process.env.META_PIXEL_ID,
    publicPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    globalThis.fetch = saved.fetch;
    for (const [name, value] of [
      ['META_CAPI_TOKEN', saved.token],
      ['META_PIXEL_ID', saved.pixel],
      ['NEXT_PUBLIC_META_PIXEL_ID', saved.publicPixel],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('builds the /buy/{plan} event source URL', () => {
    assert.equal(buyLinkEventSourceUrl('https://executivereceptionist.com', 'starter'), 'https://executivereceptionist.com/buy/starter');
    assert.equal(buyLinkEventSourceUrl('https://executivereceptionist.com/', 'pro'), 'https://executivereceptionist.com/buy/pro');
  });

  it('does not call Meta when the pixel and token are unset', async () => {
    delete process.env.META_CAPI_TOKEN;
    delete process.env.META_PIXEL_ID;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    let called = 0;
    globalThis.fetch = (async () => {
      called += 1;
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    await trackBuyLinkCheckout({ origin: 'https://executivereceptionist.com', planKey: 'starter' });
    assert.equal(called, 0);
  });

  it('sends InitiateCheckout and Lead with distinct event ids for a successful buy-link start', async () => {
    process.env.META_CAPI_TOKEN = 'test-token';
    process.env.META_PIXEL_ID = '1234567890';
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
      bodies.push(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>);
      return new Response('{}', { status: 200 });
    }) as typeof fetch;

    await trackBuyLinkCheckout({
      origin: 'https://executivereceptionist.com',
      planKey: 'growth',
      userAgent: 'Mozilla/5.0',
      forwardedFor: '203.0.113.10',
      fbp: 'fb.1.1234567890.111',
      fbc: 'fb.1.1234567890.AbCd',
    });

    assert.equal(bodies.length, 2);
    const events = bodies.map((body) => (body.data as Array<Record<string, unknown>>)[0]);
    const names = events.map((event) => event.event_name).sort();
    assert.deepEqual(names, ['InitiateCheckout', 'Lead']);
    assert.notEqual(events[0].event_id, events[1].event_id);
    for (const event of events) {
      assert.equal(event.event_source_url, 'https://executivereceptionist.com/buy/growth');
      assert.equal(event.action_source, 'website');
      const userData = event.user_data as Record<string, string>;
      assert.equal(userData.client_ip_address, '203.0.113.10');
      assert.equal(userData.client_user_agent, 'Mozilla/5.0');
      assert.equal(userData.fbp, 'fb.1.1234567890.111');
      assert.equal(userData.fbc, 'fb.1.1234567890.AbCd');
    }
  });
});
