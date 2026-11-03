import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { decidePostCallGate, planPostCallEffects } from '@/lib/ava/post-call-gate';
import {
  SMS_CONSENT_TEXT,
  decideOwnerSms,
  operatorSmsConsented,
  parseSmsConsent,
} from '@/lib/ava/sms-consent';
import { extractPostCallLead, savePostCallLead } from '@/lib/ava/post-call-lead';
import { saveAvaOnboarding } from '@/lib/ava/onboarding-store';

describe('SMS consent gate (pure)', () => {
  it('parses the checkbox value, defaulting to no consent', () => {
    assert.equal(parseSmsConsent('on'), true);
    assert.equal(parseSmsConsent('true'), true);
    assert.equal(parseSmsConsent(true), true);
    for (const value of [undefined, null, '', 'off', 'false', '0', 'no', 0, 1, {}, []]) {
      assert.equal(parseSmsConsent(value), false, String(value));
    }
  });

  it('sends only when consent is exactly true and a phone is on file', () => {
    assert.deepEqual(decideOwnerSms({ smsConsent: true, phone: '+12565550142' }), {
      send: true,
      to: '+12565550142',
    });
    assert.deepEqual(decideOwnerSms({ smsConsent: false, phone: '+12565550142' }), {
      send: false,
      reason: 'no_consent',
    });
    assert.deepEqual(decideOwnerSms({ smsConsent: null, phone: '+12565550142' }), {
      send: false,
      reason: 'no_consent',
    });
    assert.deepEqual(decideOwnerSms({ smsConsent: undefined, phone: '+12565550142' }), {
      send: false,
      reason: 'no_consent',
    });
    assert.deepEqual(decideOwnerSms({ smsConsent: true, phone: '' }), { send: false, reason: 'no_phone' });
    assert.deepEqual(decideOwnerSms({ smsConsent: true, phone: '   ' }), { send: false, reason: 'no_phone' });
    // A truthy non-boolean must not count as consent.
    assert.equal(decideOwnerSms({ smsConsent: 'true' as unknown as boolean, phone: '+12565550142' }).send, false);
  });

  it('keeps email on while the text needs consent', () => {
    const decision = decidePostCallGate({
      agentId: 'agent_customer',
      onboardingAgentId: 'agent_customer',
      customerProduct: 'ava',
      subscriptionStatus: 'trialing',
    });
    assert.deepEqual(planPostCallEffects(decision), { saveLead: true, sendEmail: true, sendSms: false });
    assert.deepEqual(planPostCallEffects(decision, { smsAllowed: false }), {
      saveLead: true,
      sendEmail: true,
      sendSms: false,
    });
    assert.deepEqual(planPostCallEffects(decision, { smsAllowed: true }), {
      saveLead: true,
      sendEmail: true,
      sendSms: true,
    });
  });

  it('never texts for an ignored agent even with consent', () => {
    const decision = decidePostCallGate({
      agentId: 'agent_demo',
      onboardingAgentId: 'agent_customer',
      customerProduct: 'ava',
      subscriptionStatus: 'active',
    });
    assert.deepEqual(planPostCallEffects(decision, { smsAllowed: true }), {
      saveLead: false,
      sendEmail: false,
      sendSms: false,
    });
  });

  it('operator-number texts are off unless AVA_OPERATOR_SMS_CONSENT is exactly true', () => {
    assert.equal(operatorSmsConsented({}), false);
    assert.equal(operatorSmsConsented({ AVA_OPERATOR_SMS_CONSENT: '' }), false);
    assert.equal(operatorSmsConsented({ AVA_OPERATOR_SMS_CONSENT: 'yes' }), false);
    assert.equal(operatorSmsConsented({ AVA_OPERATOR_SMS_CONSENT: 'true' }), true);
  });

  it('stored consent wording includes the required disclosures', () => {
    for (const phrase of ['Msg & data rates may apply', 'Reply STOP to opt out', 'HELP', 'not a condition of purchase']) {
      assert.ok(SMS_CONSENT_TEXT.includes(phrase), phrase);
    }
  });
});

type Call = { method: string; url: string; body: string };

describe('savePostCallLead owner text consent (end to end with a fake Supabase, Resend, and Twilio)', () => {
  const realFetch = globalThis.fetch;
  const saved: Record<string, string | undefined> = {};
  const envKeys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER',
    'AVA_LEAD_SMS_TO',
  ];
  let calls: Call[] = [];
  let onboardingRow: Record<string, unknown>;

  beforeEach(() => {
    for (const key of envKeys) saved[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.test';
    process.env.SUPABASE_SECRET_KEY = 'fake-secret';
    process.env.RESEND_API_KEY = 'fake-resend';
    process.env.TWILIO_ACCOUNT_SID = 'ACfake';
    process.env.TWILIO_AUTH_TOKEN = 'fake-token';
    process.env.TWILIO_FROM_NUMBER = '+15555550100';
    process.env.AVA_LEAD_SMS_TO = '+15555550199'; // operator number: must never receive a customer's lead text
    calls = [];
    onboardingRow = {
      id: '11111111-1111-4111-8111-111111111111',
      business_name: 'Porchlight Heating & Air',
      staff_name: 'Cole',
      staff_contact: '+12565550142 / owner@shop.example',
      staff_email: 'owner@shop.example',
      staff_phone: '+12565550142',
      elevenlabs_agent_id: 'agent_customer',
      stripe_session_id: null,
    };
    globalThis.fetch = (async (input: unknown, init?: { method?: string; body?: unknown }) => {
      const url = typeof input === 'string' ? input : String((input as { url?: string }).url ?? input);
      const method = (init?.method || 'GET').toUpperCase();
      calls.push({ method, url, body: String(init?.body ?? '') });
      const json = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
      if (url.startsWith('https://api.resend.com')) return json({ id: 'email_1' });
      if (url.startsWith('https://api.twilio.com')) return json({ sid: 'SM1' });
      if (url.includes('/rest/v1/ava_onboardings')) return json([onboardingRow]);
      if (url.includes('/rest/v1/ava_customers')) {
        return json([{ id: 'c1', product: 'ava', subscription_status: 'trialing' }]);
      }
      if (url.includes('/rest/v1/ava_call_leads')) {
        if (method === 'PATCH') return new Response(null, { status: 204 });
        return json({ id: 'lead_1', notified_at: null, conversation_id: 'conv_1' });
      }
      return json({}, 404);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    for (const key of envKeys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  const lead = () =>
    extractPostCallLead({
      type: 'post_call_transcription',
      data: {
        conversation_id: 'conv_1',
        agent_id: 'agent_customer',
        analysis: {
          transcript_summary: 'No heat at the house.',
          data_collection_results: {
            caller_name: { value: 'Dana Whitfield' },
            caller_phone: { value: '(256) 555-0199' },
            need: { value: 'No heat' },
          },
        },
        transcript: [],
        metadata: {},
      },
    })!;

  const sent = (host: string) => calls.filter((call) => call.method === 'POST' && call.url.startsWith(host));

  it('emails but does NOT text when sms_consent is false', async () => {
    onboardingRow.sms_consent = false;
    const result = await savePostCallLead(lead());
    assert.equal(result.skipped, false);
    assert.equal(sent('https://api.resend.com').length, 1, 'email still goes out');
    assert.equal(sent('https://api.twilio.com').length, 0, 'no SMS without consent');
  });

  it('emails but does NOT text when sms_consent is absent, as before the migration (fails closed)', async () => {
    delete onboardingRow.sms_consent;
    const result = await savePostCallLead(lead());
    assert.equal(result.skipped, false);
    assert.equal(sent('https://api.resend.com').length, 1);
    assert.equal(sent('https://api.twilio.com').length, 0);
  });

  it('texts the opted-in staff phone, in GSM-7 with the opt-out, never the operator number', async () => {
    onboardingRow.sms_consent = true;
    const result = await savePostCallLead(lead());
    assert.equal(result.skipped, false);
    assert.equal(sent('https://api.resend.com').length, 1);
    const texts = sent('https://api.twilio.com');
    assert.equal(texts.length, 1);
    const params = new URLSearchParams(texts[0].body);
    assert.equal(params.get('To'), '+12565550142');
    assert.notEqual(params.get('To'), '+15555550199');
    assert.ok(params.get('Body')?.endsWith('Reply STOP to opt out.'));
  });

  it('does not text when consent is true but no staff phone is on file (no fallback to the operator number)', async () => {
    onboardingRow.sms_consent = true;
    onboardingRow.staff_phone = null;
    onboardingRow.staff_contact = 'owner@shop.example';
    await savePostCallLead(lead());
    assert.equal(sent('https://api.resend.com').length, 1);
    assert.equal(sent('https://api.twilio.com').length, 0);
  });
});

describe('saveAvaOnboarding stores SMS consent', () => {
  const realFetch = globalThis.fetch;
  const saved: Record<string, string | undefined> = {};
  let patches: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY']) saved[key] = process.env[key];
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.test';
    process.env.SUPABASE_SECRET_KEY = 'fake-secret';
    patches = [];
    globalThis.fetch = (async (input: unknown, init?: { method?: string; body?: unknown }) => {
      const url = typeof input === 'string' ? input : String((input as { url?: string }).url ?? input);
      const method = (init?.method || 'GET').toUpperCase();
      const json = (data: unknown) =>
        new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (url.includes('/rest/v1/ava_onboardings')) {
        if (method === 'PATCH') {
          patches.push(JSON.parse(String(init?.body)));
          return new Response(null, { status: 204 });
        }
        return json({ id: '22222222-2222-4222-8222-222222222222', business_name: 'Shop' });
      }
      return json([]);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  const base = {
    businessName: 'Shop',
    businessHours: '9-5',
    services: 'HVAC',
    callHandlingRules: 'Take a message',
    staffName: 'Sam',
    staffContact: '+12565550142 / sam@shop.example',
    staffEmail: 'sam@shop.example',
    staffPhone: '+12565550142',
    calendarPreference: 'none',
    urgentCallRules: 'none',
    sessionId: '',
    plan: 'starter',
  };

  const consentPatch = () => patches.find((patch) => 'sms_consent' in patch);

  it('records consent, the time, the exact wording, and the IP when the box is ticked', async () => {
    await saveAvaOnboarding({ ...base, smsConsent: true, smsConsentIp: '203.0.113.9' });
    const patch = consentPatch();
    assert.ok(patch);
    assert.equal(patch.sms_consent, true);
    assert.equal(patch.sms_consent_text, SMS_CONSENT_TEXT);
    assert.equal(patch.sms_consent_ip, '203.0.113.9');
    assert.ok(!Number.isNaN(Date.parse(String(patch.sms_consent_at))));
  });

  it('writes nothing for consent when the box is unchecked (column default false applies)', async () => {
    await saveAvaOnboarding({ ...base, smsConsent: false });
    assert.equal(consentPatch(), undefined);
    await saveAvaOnboarding({ ...base });
    assert.equal(consentPatch(), undefined);
  });

  it('ignores consent when there is no staff phone', async () => {
    await saveAvaOnboarding({ ...base, staffPhone: '', smsConsent: true });
    assert.equal(consentPatch(), undefined);
  });
});
