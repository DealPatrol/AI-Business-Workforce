import assert from 'node:assert/strict';
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
});
