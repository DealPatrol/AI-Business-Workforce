import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AVA_VERBAL_CONSENT_SCRIPT,
  brandedCallerSms,
  isCompliantCallerSms,
  parseConsentAnswer,
  verbalConfirmationSms,
  type SmsConsentRecord,
} from './consent';
import { SAY_NO, SAY_YES_NO_TEXT, SAY_YES_WITH_TEXT, consentSecretMatches, consentToolConfig, handleConsentTool } from './ava-consent-tool';

test('consent answers: keypad, speech, booleans; unclear is null', () => {
  assert.equal(parseConsentAnswer('1'), 'yes');
  assert.equal(parseConsentAnswer('2'), 'no');
  assert.equal(parseConsentAnswer('Yes please.'), 'yes');
  assert.equal(parseConsentAnswer('sure'), null);
  assert.equal(parseConsentAnswer('yes I need a plumber'), null);
  assert.equal(parseConsentAnswer("no, don't text me"), 'no');
  assert.equal(parseConsentAnswer('I do not want texts'), 'no');
  assert.equal(parseConsentAnswer(true), 'yes');
  assert.equal(parseConsentAnswer(''), null);
  assert.equal(parseConsentAnswer('what?'), null);
});

test('caller texts always carry the brand, rates and STOP/HELP', () => {
  assert.ok(isCompliantCallerSms(brandedCallerSms('Hello there')));
  const long = brandedCallerSms('x'.repeat(900));
  assert.ok(long.length <= 600);
  assert.ok(isCompliantCallerSms(long));
  assert.ok(isCompliantCallerSms(verbalConfirmationSms('Maple Ridge')));
  assert.match(verbalConfirmationSms('Maple Ridge'), /^Executive Receptionist: You're opted in for texts about your call to Maple Ridge/);
});

test('the published verbal script has the required disclosures', () => {
  for (const phrase of ['Executive Receptionist', 'Message and data rates may apply', 'STOP', 'HELP', 'Please say yes or no', 'optional']) {
    assert.ok(AVA_VERBAL_CONSENT_SCRIPT.includes(phrase), phrase);
  }
});

function fakes(recordOk = true) {
  const records: SmsConsentRecord[] = [];
  const texts: Array<{ to: string; from: string; body: string }> = [];
  return {
    records,
    texts,
    deps: {
      record: async (r: SmsConsentRecord) => {
        records.push(r);
        return recordOk ? { ok: true as const, id: 'c1' } : { ok: false as const, error: 'db' };
      },
      findAgent: async (id: string) => (id === 'agent_real' ? { onboardingId: '00000000-0000-0000-0000-000000000001', businessName: 'Maple Ridge' } : null),
      sendText: async (m: { to: string; from: string; body: string }) => {
        texts.push(m);
        return { sid: 'SM1' };
      },
    },
  };
}

const onEnv = { AVA_BOOKING_SMS_ENABLED: 'true', AVA_BOOKING_SMS_FROM: '+18553603990', TWILIO_ACCOUNT_SID: 'AC', TWILIO_AUTH_TOKEN: 't' };

test('tool: a yes on a real agent is recorded, then one compliant confirmation text', async () => {
  const f = fakes();
  const res = await handleConsentTool({ answer: 'yes', caller_phone: '+12565551234', agent_id: 'agent_real', conversation_id: 'conv_1' }, onEnv, f.deps);
  assert.equal(f.records.length, 1);
  assert.equal(f.records[0].method, 'verbal');
  assert.equal(f.records[0].conversation_id, 'conv_1');
  assert.match(f.records[0].consent_text, /helping Maple Ridge/);
  assert.equal(f.texts.length, 1);
  assert.ok(isCompliantCallerSms(f.texts[0].body));
  assert.equal(res.say, SAY_YES_WITH_TEXT);
});

test('tool: demo agents, texting off, or a failed record never text', async () => {
  const demo = fakes();
  const r1 = await handleConsentTool({ answer: 'yes', caller_phone: '+12565551234', agent_id: 'agent_demo' }, onEnv, demo.deps);
  assert.equal(demo.records.length, 1);
  assert.equal(demo.texts.length, 0);
  assert.equal(r1.say, SAY_YES_NO_TEXT);
  const off = fakes();
  await handleConsentTool({ answer: 'yes', caller_phone: '+12565551234', agent_id: 'agent_real' }, {}, off.deps);
  assert.equal(off.texts.length, 0);
  const failed = fakes(false);
  const r3 = await handleConsentTool({ answer: 'yes', caller_phone: '+12565551234', agent_id: 'agent_real' }, onEnv, failed.deps);
  assert.equal(failed.texts.length, 0);
  assert.equal(r3.recorded, false);
});

test('tool: a no is recorded and never texts; unclear answers record nothing', async () => {
  const f = fakes();
  const r = await handleConsentTool({ answer: 'no', caller_phone: '+12565551234', agent_id: 'agent_real' }, onEnv, f.deps);
  assert.equal(r.say, SAY_NO);
  assert.equal(f.records[0].answer, 'no');
  const u = await handleConsentTool({ answer: 'maybe' }, onEnv, f.deps);
  assert.equal(u.recorded, false);
  assert.equal(f.records.length, 1);
  assert.equal(f.texts.length, 0);
});

test('tool: secret check and tool definition', () => {
  assert.equal(consentSecretMatches('abc', { AVA_CONSENT_TOOL_SECRET: 'abc' }), true);
  assert.equal(consentSecretMatches('abd', { AVA_CONSENT_TOOL_SECRET: 'abc' }), false);
  assert.equal(consentSecretMatches('', {}), false);
  const cfg = consentToolConfig('https://executivereceptionist.com', 's');
  assert.equal(cfg.tool_config.name, 'record_sms_consent');
  assert.equal(cfg.tool_config.api_schema.url, 'https://executivereceptionist.com/api/ava/sms-consent');
  assert.equal(cfg.tool_config.api_schema.request_body_schema.properties.caller_phone.dynamic_variable, 'system__caller_id');
});

test('tool: demo agents record the business they voice, and send nothing', async () => {
  const f = fakes();
  await handleConsentTool({ answer: 'yes', caller_phone: '+12565551234', agent_id: 'agent_7401m6jkzsstf0evm2www8r46kj6', conversation_id: 'conv_d' }, onEnv, f.deps);
  assert.match(f.records[0].consent_text, /helping Porchlight Heating & Air/);
  assert.equal(f.texts.length, 0);
});
