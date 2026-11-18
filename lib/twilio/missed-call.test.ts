import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test, { beforeEach } from 'node:test';
import {
  DEFAULT_MISSED_CALL_TEXT_TEMPLATE,
  escapeXml,
  handleConsentAnswer,
  handleIncomingSms,
  handleIncomingVoice,
  handleVoiceStatus,
  type MissedCallDeps,
  parseTwilioForm,
  requestUrlCandidates,
  type MissedCallEnv,
  type SendSms,
  isTextableCaller,
  missedCallTextBody,
  resetMissedCallLimitsForTests,
} from './missed-call';
import { computeTwilioSignature, validateTwilioSignature } from './signature';
import { isCompliantCallerSms, type SmsConsentRecord } from '../sms/consent';

const TOKEN = 'test-auth-token';
const VOICE_URL = 'https://frontporchgrowth.com/api/twilio/voice';
const STATUS_URL = 'https://frontporchgrowth.com/api/twilio/voice/status';
const SMS_URL = 'https://frontporchgrowth.com/api/twilio/sms';
const CONSENT_URL = 'https://frontporchgrowth.com/api/twilio/voice/consent';

function depsWith(opts: { owner?: boolean; recordOk?: boolean } = {}) {
  const records: SmsConsentRecord[] = [];
  const deps: MissedCallDeps = {
    ownerConsented: async () => opts.owner ?? true,
    recordConsent: async (r) => {
      records.push(r);
      return opts.recordOk === false ? { ok: false, error: 'db down' } : { ok: true, id: `c${records.length}` };
    },
  };
  return { deps, records };
}

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
  const { deps } = depsWith();
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'completed' }), fullEnv, send, deps);
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
  assert.equal(res.outcome?.missed, false);
});

for (const status of ['no-answer', 'busy', 'failed']) {
  test(`status: ${status} asks the caller for consent and texts nobody but a consented owner`, async () => {
    const { sent, send } = recorder();
    const { deps } = depsWith();
    const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: status }), fullEnv, send, deps);
    assert.equal(res.status, 200);
    assert.ok(sent.every((m) => m.to !== '+12565551234'), 'caller must not be texted before saying yes');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, '+12565550188');
    assert.match(sent[0].body, new RegExp(`Missed call from \\+12565551234 \\(${status}\\)`));
    assert.match(res.body, /<Gather input="dtmf speech" numDigits="1"/);
    assert.ok(res.body.includes(`action="${CONSENT_URL}"`));
    assert.match(res.body, /Press 1 or say yes/);
    assert.match(res.body, /Message and data rates may apply/);
    assert.match(res.body, /Reply STOP to opt out, or HELP for help/);
    assert.equal(res.outcome?.consentPrompted, true);
  });
}

test('status: owner alert is skipped without written owner consent', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith({ owner: false });
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'no-answer' }), fullEnv, send, deps);
  assert.equal(sent.length, 0);
  assert.equal(res.outcome?.ownerAlerted?.sent, false);
  assert.match(res.body, /<Gather/);
});

test('consent: press 1 records a keypad yes, then texts a compliant message', async () => {
  const { sent, send } = recorder();
  const { deps, records } = depsWith();
  const res = await handleConsentAnswer(
    signed(CONSENT_URL, { From: '+12565551234', To: '+18553603990', Digits: '1', CallSid: 'CA1' }),
    fullEnv,
    send,
    deps,
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].method, 'keypad');
  assert.equal(records[0].answer, 'yes');
  assert.equal(records[0].call_sid, 'CA1');
  assert.equal(records[0].phone, '+12565551234');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '+12565551234');
  assert.ok(isCompliantCallerSms(sent[0].body), sent[0].body);
  assert.match(sent[0].body, /\(855\) 360-3990/);
  assert.match(res.body, /text you now/);
});

test('consent: spoken yes is recorded as verbal; no and silence never text', async () => {
  const { sent, send } = recorder();
  const { deps, records } = depsWith();
  await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565551234', SpeechResult: 'Yes please.', CallSid: 'CA2' }), fullEnv, send, deps);
  assert.equal(records[0].method, 'verbal');
  assert.equal(sent.length, 1);
  const { sent: s2, send: send2 } = recorder();
  const { deps: d2, records: r2 } = depsWith();
  await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565559999', Digits: '2' }), fullEnv, send2, d2);
  await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565559998', SpeechResult: "no, don't text me" }), fullEnv, send2, d2);
  const silent = await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565559997' }), fullEnv, send2, d2);
  assert.equal(s2.length, 0);
  assert.deepEqual(r2.map((r) => r.answer), ['no', 'no']);
  assert.match(silent.body, /won&apos;t text you/);
});

test('consent: no text when the consent record cannot be saved', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith({ recordOk: false });
  const res = await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565551234', Digits: '1', CallSid: 'CA5' }), fullEnv, send, deps);
  assert.equal(sent.length, 0);
  assert.equal(res.outcome?.recorded, false);
});

test('consent: custom template is wrapped with brand, rates, STOP/HELP', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith();
  const env = { ...fullEnv, MISSED_CALL_TEXT_TEMPLATE: 'Custom hello' };
  await handleConsentAnswer(signed(CONSENT_URL, { From: '+12565551234', Digits: '1', CallSid: 'CA3' }), env, send, deps);
  assert.equal(sent[0].body, 'Executive Receptionist: Custom hello Msg & data rates may apply. Reply STOP to opt out, HELP for help.');
});

test('status: anonymous caller gets no prompt; owner still alerted', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith();
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: 'anonymous', DialCallStatus: 'busy' }), fullEnv, send, deps);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '+12565550188');
  assert.doesNotMatch(res.body, /<Gather/);
});

test('status: missing SMS env sends nothing but still answers with TwiML', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith();
  const env = { ...fullEnv, TWILIO_FROM_NUMBER: '' };
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+12565551234', DialCallStatus: 'no-answer' }), env, send, deps);
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
  assert.doesNotMatch(res.body, /<Gather/);
});

test('consent: bad signature is rejected', async () => {
  const { sent, send } = recorder();
  const { deps, records } = depsWith();
  const res = await handleConsentAnswer({ urls: [CONSENT_URL], params: { From: '+12565551234', Digits: '1' }, signature: 'nope' }, fullEnv, send, deps);
  assert.equal(res.status, 403);
  assert.equal(sent.length + records.length, 0);
});

test('sms: forwards caller reply to the owner with empty TwiML', async () => {
  const { sent, send } = recorder();
  const res = await handleIncomingSms(signed(SMS_URL, { From: '+12565551234', Body: 'AC is out' }), fullEnv, send, depsWith().deps);
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

test('caller text always carries brand, rates, and STOP/HELP', () => {
  assert.ok(isCompliantCallerSms(DEFAULT_MISSED_CALL_TEXT_TEMPLATE));
  assert.ok(isCompliantCallerSms(missedCallTextBody({ MISSED_CALL_TEXT_TEMPLATE: 'Hi, text STOP to end' })));
  assert.ok(isCompliantCallerSms(missedCallTextBody({ MISSED_CALL_BUSINESS_NAME: 'Maple Ridge' }, '+12565550100')));
});

test('sms: owner forward needs written owner consent', async () => {
  const { sent, send } = recorder();
  await handleIncomingSms(signed(SMS_URL, { From: '+12565551234', Body: 'AC is out' }), fullEnv, send, depsWith({ owner: false }).deps);
  assert.equal(sent.length, 0);
});

test('only US/Canada callers that are not our own numbers are textable', () => {
  assert.equal(isTextableCaller('+12565551234', fullEnv), true);
  assert.equal(isTextableCaller('+447911123456', fullEnv), false);
  assert.equal(isTextableCaller('+882123456789', fullEnv), false);
  assert.equal(isTextableCaller('+12565550199', fullEnv), false);
  assert.equal(isTextableCaller('+12565550100', fullEnv), false);
  assert.equal(isTextableCaller('anonymous', fullEnv), false);
});

test('consent: same caller is texted at most once per 24h; international never prompted', async () => {
  const { sent, send } = recorder();
  const { deps } = depsWith();
  const p = { From: '+12565554321', Digits: '1', CallSid: 'CA4' };
  await handleConsentAnswer(signed(CONSENT_URL, p), fullEnv, send, deps);
  const second = await handleConsentAnswer(signed(CONSENT_URL, p), fullEnv, send, deps);
  assert.equal(sent.filter((m) => m.to === '+12565554321').length, 1);
  assert.equal(second.outcome?.callerTexted?.sent, false);
  const { sent: s2, send: send2 } = recorder();
  const res = await handleVoiceStatus(signed(STATUS_URL, { From: '+447911123456', DialCallStatus: 'busy' }), fullEnv, send2, deps);
  assert.ok(s2.every((m) => m.to !== '+447911123456'));
  assert.doesNotMatch(res.body, /<Gather/);
});

test('sms: never forwards texts from our own Twilio number and caps forwards per sender', async () => {
  const { sent, send } = recorder();
  await handleIncomingSms(signed(SMS_URL, { From: '+12565550100', Body: 'loop' }), fullEnv, send);
  assert.equal(sent.length, 0);
  for (let i = 0; i < 15; i++) {
    await handleIncomingSms(signed(SMS_URL, { From: '+12565557777', Body: `m${i}` }), fullEnv, send, depsWith().deps);
  }
  assert.equal(sent.length, 10);
});
