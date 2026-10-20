import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test, { beforeEach } from 'node:test';
import {
  DEFAULT_MISSED_CALL_TEXT_TEMPLATE,
  escapeXml,
  handleIncomingSms,
  handleIncomingVoice,
  handleVoiceStatus,
  parseTwilioForm,
  requestUrlCandidates,
  type MissedCallEnv,
  type SendSms,
  isTextableCaller,
  missedCallTextBody,
  resetMissedCallLimitsForTests,
} from './missed-call';
import { computeTwilioSignature, validateTwilioSignature } from './signature';

const TOKEN = 'test-auth-token';
const VOICE_URL = 'https://frontporchgrowth.com/api/twilio/voice';
const STATUS_URL = 'https://frontporchgrowth.com/api/twilio/voice/status';
const SMS_URL = 'https://frontporchgrowth.com/api/twilio/sms';

const fullEnv: MissedCallEnv = {
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: TOKEN,
  TWILIO_FROM_NUMBER: '+12565550100',
  MISSED_CALL_FORWARD_NUMBER: '+12565550199',
  AVA_LEAD_SMS_TO: '+12565550188',
};

function signed(url: string, params: Record<string, string>, token = TOKEN) {
  return { urls: [url], params, signature: computeTwilioSignature(token, url, params) };
}

beforeEach(() => resetMissedCallLimitsForTests());

function recorder() {
  const sent: { to: string; body: string }[] = [];
  const send: SendSms = async (opts) => {
    sent.push(opts);
    return { sent: true, sid: `SM${sent.length}` };
  };
  return { sent, send };
}

test('computeTwilioSignature matches the documented algorithm', () => {
  const url = 'https://example.com/myapp?foo=1&bar=2';
  const params = { To: '+18005551212', CallSid: 'CA123', From: '+12349013030', Digits: '1234' };
  const expected = createHmac('sha1', 'secret')
    .update(`${url}CallSidCA123Digits1234From+12349013030To+18005551212`)
    .digest('base64');
  assert.equal(computeTwilioSignature('secret', url, params), expected);
});

test('validateTwilioSignature accepts any candidate URL and rejects tampering', () => {
  const params = { From: '+12565551234' };
  const signature = computeTwilioSignature(TOKEN, VOICE_URL, params);
  assert.equal(
    validateTwilioSignature({ authToken: TOKEN, signature, urls: ['http://internal/x', VOICE_URL], params }),
    true,
  );
  assert.equal(
    validateTwilioSignature({ authToken: TOKEN, signature, urls: [VOICE_URL], params: { From: '+19999999999' } }),
    false,
  );
  assert.equal(validateTwilioSignature({ authToken: 'other', signature, urls: [VOICE_URL], params }), false);
  assert.equal(validateTwilioSignature({ authToken: TOKEN, signature: '', urls: [VOICE_URL], params }), false);
});

test('requestUrlCandidates adds the forwarded public host', () => {
  const headers = new Map([
    ['x-forwarded-host', 'frontporchgrowth.com'],
    ['x-forwarded-proto', 'https'],
  ]);
  const urls = requestUrlCandidates('http://localhost:3000/api/twilio/voice?x=1', {
    get: (name: string) => headers.get(name) ?? null,
  });
  assert.deepEqual(urls, ['http://localhost:3000/api/twilio/voice?x=1', 'https://frontporchgrowth.com/api/twilio/voice?x=1']);
});

test('parseTwilioForm and escapeXml', () => {
  assert.deepEqual(parseTwilioForm('From=%2B12565551234&Body=hi+there'), { From: '+12565551234', Body: 'hi there' });
  assert.equal(escapeXml(`<a&"'>`), '&lt;a&amp;&quot;&apos;&gt;');
});

test('voice: missing TWILIO_AUTH_TOKEN fails closed with 503', () => {
  const res = handleIncomingVoice(signed(VOICE_URL, { From: '+12565551234' }), { ...fullEnv, TWILIO_AUTH_TOKEN: '' }, STATUS_URL);
  assert.equal(res.status, 503);
  assert.doesNotMatch(res.body, /<Dial/);
});

test('voice: bad signature is rejected with 403', () => {
  const req = { urls: [VOICE_URL], params: { From: '+12565551234' }, signature: 'bogus' };
  const res = handleIncomingVoice(req, fullEnv, STATUS_URL);
  assert.equal(res.status, 403);
});

test('voice: dials the forwarding number with timeout and action callback', () => {
  const res = handleIncomingVoice(signed(VOICE_URL, { From: '+12565551234', To: '+12565550100' }), fullEnv, STATUS_URL);
  assert.equal(res.status, 200);
  assert.match(res.body, /<Dial timeout="20"/);
  assert.match(res.body, new RegExp(`action="${STATUS_URL}" method="POST"`));
  assert.match(res.body, /callerId="\+12565551234"/);
  assert.match(res.body, /<Number>\+12565550199<\/Number>/);
});

test('voice: missing forward number plays an apology instead of dialing', () => {
  const res = handleIncomingVoice(
    signed(VOICE_URL, { From: '+12565551234' }),
    { ...fullEnv, MISSED_CALL_FORWARD_NUMBER: '' },
    STATUS_URL,
  );
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.body, /<Dial/);
  assert.match(res.body, /<Hangup\/>/);
});

test('status: answered call sends nothing', async () => {
  const { sent, send } = recorder();
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'completed' }), fullEnv, send);
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
  assert.equal(res.outcome?.missed, false);
});

for (const status of ['no-answer', 'busy', 'failed']) {
  test(`status: ${status} texts the caller (default template) and alerts the owner`, async () => {
    const { sent, send } = recorder();
    const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: status }), fullEnv, send);
    assert.equal(res.status, 200);
    assert.equal(sent.length, 2);
    assert.deepEqual(sent[0], { to: '+12565551234', body: DEFAULT_MISSED_CALL_TEXT_TEMPLATE });
    assert.equal(sent[1].to, '+12565550188');
    assert.match(sent[1].body, new RegExp(`Missed call from \\+12565551234 \\(${status}\\)`));
  });
}

test('status: custom template is used; owner falls back to forward number', async () => {
  const { sent, send } = recorder();
  const env = { ...fullEnv, AVA_LEAD_SMS_TO: '', MISSED_CALL_TEXT_TEMPLATE: 'Custom hello' };
  await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'no-answer' }), env, send);
  assert.equal(sent[0].body, 'Custom hello Reply STOP to opt out.');
  assert.equal(sent[1].to, '+12565550199');
});

test('status: anonymous caller is not texted, owner still alerted', async () => {
  const { sent, send } = recorder();
  await handleVoiceStatus(signed(STATUS_URL, { From: 'anonymous', DialCallStatus: 'busy' }), fullEnv, send);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '+12565550188');
  assert.match(sent[0].body, /NOT texted/);
});

test('status: missing SMS env sends nothing but still answers with TwiML', async () => {
  const { sent, send } = recorder();
  const env = { ...fullEnv, TWILIO_FROM_NUMBER: '' };
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'no-answer' }), env, send);
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
});

test('sms: forwards caller reply to the owner with empty TwiML', async () => {
  const { sent, send } = recorder();
  const res = await handleIncomingSms(signed(SMS_URL, { From: '+12565551234', Body: 'AC is out' }), fullEnv, send);
  assert.equal(res.status, 200);
  assert.equal(res.body, '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  assert.deepEqual(sent, [{ to: '+12565550188', body: 'Text from +12565551234: AC is out' }]);
});

test('sms: does not forward the owner’s own texts or unsigned requests', async () => {
  const { sent, send } = recorder();
  await handleIncomingSms(signed(SMS_URL, { From: '+12565550188', Body: 'hi' }), fullEnv, send);
  const bad = await handleIncomingSms({ urls: [SMS_URL], params: { From: '+1256', Body: 'x' }, signature: 'nope' }, fullEnv, send);
  assert.equal(bad.status, 403);
  assert.equal(sent.length, 0);
});

test('opt-out wording is always present', () => {
  assert.match(DEFAULT_MISSED_CALL_TEXT_TEMPLATE, /Reply STOP to opt out/);
  assert.equal(missedCallTextBody({ MISSED_CALL_TEXT_TEMPLATE: 'Hi, text STOP to end' }), 'Hi, text STOP to end');
});

test('only US/Canada callers that are not our own numbers are textable', () => {
  assert.equal(isTextableCaller('+12565551234', fullEnv), true);
  assert.equal(isTextableCaller('+447911123456', fullEnv), false);
  assert.equal(isTextableCaller('+882123456789', fullEnv), false);
  assert.equal(isTextableCaller('+12565550199', fullEnv), false);
  assert.equal(isTextableCaller('+12565550100', fullEnv), false);
  assert.equal(isTextableCaller('anonymous', fullEnv), false);
});

test('status: same caller is auto-texted at most once per 24h; international not texted', async () => {
  const { sent, send } = recorder();
  const p = { From: '+12565554321', DialCallStatus: 'no-answer' };
  await handleVoiceStatus(signed(STATUS_URL, p), fullEnv, send);
  const second = await handleVoiceStatus(signed(STATUS_URL, p), fullEnv, send);
  assert.equal(sent.filter((m) => m.to === '+12565554321').length, 1);
  assert.equal(second.outcome?.callerTexted?.sent, false);
  assert.doesNotMatch(second.body, /text you/);
  const { sent: s2, send: send2 } = recorder();
  await handleVoiceStatus(signed(STATUS_URL, { From: '+447911123456', DialCallStatus: 'busy' }), fullEnv, send2);
  assert.ok(s2.every((m) => m.to !== '+447911123456'));
});

test('sms: never forwards texts from our own Twilio number and caps forwards per sender', async () => {
  const { sent, send } = recorder();
  await handleIncomingSms(signed(SMS_URL, { From: '+12565550100', Body: 'loop' }), fullEnv, send);
  assert.equal(sent.length, 0);
  for (let i = 0; i < 15; i++) {
    await handleIncomingSms(signed(SMS_URL, { From: '+12565557777', Body: `m${i}` }), fullEnv, send);
  }
  assert.equal(sent.length, 10);
});
