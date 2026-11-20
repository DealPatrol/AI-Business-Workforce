import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import { callCompletedPayload, cleanWebhookUrl, deliverWebhook, signWebhook } from '@/lib/ava/integrations/webhook';

describe('outbound call webhooks', () => {
  it('signs t.body with HMAC-SHA256', () => {
    const sig = signWebhook('{"a":1}', 'whsec_x', 1700000000);
    const expected = createHmac('sha256', 'whsec_x').update('1700000000.{"a":1}').digest('hex');
    assert.equal(sig, `t=1700000000,v1=${expected}`);
  });

  it('builds the call.completed payload', () => {
    const p = callCompletedPayload({
      conversationId: 'conv_1', businessName: 'Ridge', callerName: 'Mark', callerPhone: '2565550148', email: '', address: '1 Main',
      need: 'No cool', urgency: 'normal', callType: 'service', summary: 'AC out', booked: { window: 'Tue 8-10', start_at: 'a', end_at: 'b' },
      deskUrl: 'https://x/desk', occurredAt: '2026-11-20T00:00:00Z',
    });
    assert.equal(p.event, 'call.completed');
    assert.equal(p.caller.email, null);
    assert.equal(p.booking?.window, 'Tue 8-10');
  });

  it('rejects non-https and private targets', () => {
    assert.throws(() => cleanWebhookUrl('http://hooks.zapier.com/x'));
    assert.throws(() => cleanWebhookUrl('https://127.0.0.1/x'));
    assert.equal(cleanWebhookUrl('https://hooks.zapier.com/hooks/catch/1/abc/'), 'https://hooks.zapier.com/hooks/catch/1/abc/');
  });

  it('retries once on 5xx and stops on 4xx', async () => {
    let calls = 0;
    const r1 = await deliverWebhook('https://x.test', 's', {}, async () => (++calls === 1 ? 503 : 200));
    assert.deepEqual([r1.ok, calls], [true, 2]);
    calls = 0;
    const r2 = await deliverWebhook('https://x.test', 's', {}, async () => { calls += 1; return 410; });
    assert.deepEqual([r2.ok, calls], [false, 1]);
  });
});
