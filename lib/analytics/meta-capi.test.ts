import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { parseMetaServerEventName, sendMetaServerEvent } from '@/lib/analytics/meta-capi';

describe('meta events', () => {
  it('accepts Lead and StartTrial and rejects other names', () => {
    assert.equal(parseMetaServerEventName('Lead'), 'Lead');
    assert.equal(parseMetaServerEventName('StartTrial'), 'StartTrial');
    assert.equal(parseMetaServerEventName('Purchase'), null);
  });

  it('skips the server call when the token is unset', async () => {
    const previousToken = process.env.META_CAPI_TOKEN;
    const previousPixel = process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_TOKEN;
    delete process.env.META_PIXEL_ID;
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const result = await sendMetaServerEvent({ eventName: 'StartTrial', eventId: 'event-id-1234' });
    assert.deepEqual(result, { sent: false, skipped: true });
    if (previousToken) process.env.META_CAPI_TOKEN = previousToken;
    if (previousPixel) process.env.META_PIXEL_ID = previousPixel;
  });

  it('never sends a phone number, raw or hashed, even if a caller passes one', async () => {
    const saved = {
      token: process.env.META_CAPI_TOKEN,
      pixel: process.env.META_PIXEL_ID,
      fetch: globalThis.fetch,
    };
    process.env.META_CAPI_TOKEN = 'test-token';
    process.env.META_PIXEL_ID = '1234567890';
    let sentBody = '';
    globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
      sentBody = String(init?.body ?? '');
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    try {
      const result = await sendMetaServerEvent({
        eventName: 'Lead',
        eventId: 'event-id-5678',
        email: 'owner@example.com',
        // Not part of the type any more; simulates a stale or hostile client payload.
        ...({ phone: '+12565550142' } as object),
      });
      assert.deepEqual(result, { sent: true, skipped: false });
      const userData = JSON.parse(sentBody).data[0].user_data as Record<string, unknown>;
      assert.ok(Array.isArray(userData.em), 'email hash is still sent');
      assert.equal('ph' in userData, false);
      assert.ok(!sentBody.includes('2565550142'));
      const phoneHash = createHash('sha256').update('12565550142').digest('hex');
      assert.ok(!sentBody.includes(phoneHash));
    } finally {
      globalThis.fetch = saved.fetch;
      if (saved.token === undefined) delete process.env.META_CAPI_TOKEN;
      else process.env.META_CAPI_TOKEN = saved.token;
      if (saved.pixel === undefined) delete process.env.META_PIXEL_ID;
      else process.env.META_PIXEL_ID = saved.pixel;
    }
  });

  it('keeps phone fields out of the browser tracking code and the analytics route', () => {
    const files = [
      'lib/analytics/events.ts',
      'lib/analytics/meta-capi.ts',
      'app/api/analytics/meta/route.ts',
    ];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      assert.ok(!/phone_number|\bph\b\s*[:=]|userData\.ph|metaPhoneDigits|phone:/.test(source), file);
    }
  });
});
