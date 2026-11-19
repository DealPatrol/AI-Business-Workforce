import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bookingToolConfigs } from '@/lib/ava/booking/agent-tools';
import { handleCallback, decideCallbackSms, type CallbackRow } from '@/lib/ava/capabilities/callback';
import { normalizeOnCall, planPage, runPage, pageToolMessage, type PageDeps } from '@/lib/ava/capabilities/paging';
import { cleanPriceSheet, onlyApprovedFigures, priceSheetDocument, pricingPromptSection } from '@/lib/ava/capabilities/price-sheet';
import { acceptTwiml, giveUpTwiml, nextStep, screenTwiml, whisperTwiml, type PendingTransfer } from '@/lib/ava/capabilities/screen';
import { callbackToolConfig, pageOnCallToolConfig, toolHeaders } from '@/lib/ava/capabilities/tools';
import { briefingSentence, liveTransferPromptSection, normalizeTransferRules, spokenDigits, transferToNumberTool } from '@/lib/ava/capabilities/transfer';
import { missingConversations } from '@/lib/ava/lead-safety';
import { buildAvaAgentPrompt, customerBuiltInTools } from '@/lib/ava/provisioning';

const details = {
  businessName: 'Porchlight Heating & Air',
  businessHours: 'Mon-Fri 7:30-5',
  services: 'Heating and AC repair',
  callHandlingRules: 'Take a message.',
  staffName: 'Owner',
  staffContact: 'owner@shop.example',
  calendarPreference: '',
  urgentCallRules: 'No heat with an infant is urgent.',
};

describe('warm transfer', () => {
  it('keeps up to three valid, unique US numbers and accepts the legacy single number', () => {
    const rules = normalizeTransferRules({
      transferRules: [
        { label: 'On-call', phone: '(205) 555-0101', reason: 'emergency' },
        { label: 'Office', phone: '+12055550102', reason: 'person' },
        { label: 'Dup', phone: '2055550102', reason: 'billing' },
        { label: 'Bad', phone: '123', reason: 'person' },
        { label: 'Billing', phone: '12055550103', reason: 'billing' },
        { label: 'Fourth', phone: '2055550104', reason: 'person' },
      ],
    });
    assert.deepEqual(rules.map((r) => r.phone), ['+12055550101', '+12055550102', '+12055550103']);
    assert.equal(normalizeTransferRules({ transferNumber: '+12055550199' })[0].phone, '+12055550199');
    assert.equal(normalizeTransferRules({ transferNumber: '' }).length, 0);
  });

  it('builds per-provider Twilio warm conference rules, one per number', () => {
    const rules = normalizeTransferRules({
      transferRules: [
        { phone: '2055550101', reason: 'emergency' },
        { phone: '2055550102', reason: 'person' },
      ],
    });
    const tool = transferToNumberTool(rules) as { params: { transfers: unknown[]; transfer_rules: Array<{ condition: string; provider_configs: Array<{ type: string; transfer_destination: { destination: string } }> }> } };
    assert.equal(tool.params.transfers.length, 0);
    assert.equal(tool.params.transfer_rules.length, 2);
    assert.equal(tool.params.transfer_rules[0].provider_configs[0].type, 'twilio_warm_conference_transfer');
    assert.equal(tool.params.transfer_rules[0].provider_configs[0].transfer_destination.destination, '+12055550101');
    assert.match(tool.params.transfer_rules[0].condition, /emergency/);
    assert.equal(transferToNumberTool([]), null);
  });

  it('screened mode sends one rule to the screening line, and falls back to warm without a screen number', () => {
    const rules = normalizeTransferRules({ transferNumber: '+12055550199' });
    const screened = transferToNumberTool(rules, { mode: 'screened', screenNumber: '+12055550150' }) as { params: { transfer_rules: Array<{ provider_configs: Array<{ type: string; transfer_destination: { destination: string } }> }> } };
    assert.equal(screened.params.transfer_rules.length, 1);
    assert.equal(screened.params.transfer_rules[0].provider_configs[0].transfer_destination.destination, '+12055550150');
    const fallback = transferToNumberTool(rules, { mode: 'screened', screenNumber: '' }) as { params: { transfer_rules: Array<{ provider_configs: Array<{ type: string }> }> } };
    assert.equal(fallback.params.transfer_rules[0].provider_configs[0].type, 'twilio_warm_conference_transfer');
  });

  it('prompt makes Ava brief the person (agent_message) and fall back to page + callback', () => {
    const section = liveTransferPromptSection(normalizeTransferRules({ transferNumber: '+12055550199' }), { paging: true, callbacks: true });
    assert.match(section, /agent_message: ONE sentence/);
    assert.match(section, /client_message/);
    assert.match(section, /page_on_call/);
    assert.match(section, /book_callback/);
    assert.match(section, /never more than 40 words/);
  });

  it('reads phone numbers as digits in the whisper', () => {
    assert.equal(spokenDigits('2565550100'), '2 5 6, 5 5 5, 0 1 0 0');
    const brief = briefingSentence({ businessName: 'Porchlight', callerName: 'Jane Smith', callerPhone: '2565550100', address: '12 Oak St, Cullman', issue: 'no heat', urgent: true });
    assert.match(brief, /priority caller for Porchlight/);
    assert.match(brief, /callback 2 5 6, 5 5 5, 0 1 0 0/);
  });

  it('provisioning adds the transfer tool and briefing rules only with a valid number', () => {
    assert.equal(customerBuiltInTools(details).transfer_to_number, null);
    assert.ok(customerBuiltInTools({ ...details, transferNumber: '+12055550199' }).transfer_to_number);
    assert.match(buildAvaAgentPrompt({ ...details, transferNumber: '+12055550199' }), /agent_message: ONE sentence/);
  });
});

describe('voicemail-safe transfer screen', () => {
  const urls = { whisper: 'https://x.test/api/twilio/transfer/whisper', accept: 'https://x.test/api/twilio/transfer/accept', next: 'https://x.test/api/twilio/transfer/next' };
  const t: PendingTransfer = { id: '00000000-0000-0000-0000-000000000001', numbers: ['+12055550101', '+12055550102'], brief: 'Ava from Executive Receptionist has a caller.', status: 'pending', urgent: true };

  it('dials the first number with a whisper that requires pressing 1', () => {
    const xml = screenTwiml(t, urls);
    assert.match(xml, /<Dial timeout="20"/);
    assert.match(xml, /<Number url="https:\/\/x.test\/api\/twilio\/transfer\/whisper\?t=0000/);
    assert.match(xml, /\+12055550101<\/Number>/);
    const whisper = whisperTwiml(t, urls);
    assert.match(whisper, /<Gather numDigits="1"/);
    assert.match(whisper, /Press 1 to take this call/);
    assert.match(whisper, /<\/Gather><Hangup\/>/, 'no key press hangs up the callee leg, so voicemail never gets the caller');
  });

  it('only "1" accepts', () => {
    assert.equal(acceptTwiml('1').accepted, true);
    assert.equal(acceptTwiml('').accepted, false);
    assert.equal(acceptTwiml('2').accepted, false);
  });

  it('tries the next number, stops when accepted, and gives up with a real next step', () => {
    assert.deepEqual(nextStep(t, 0), { kind: 'dial', index: 1 });
    assert.deepEqual(nextStep(t, 1), { kind: 'give_up' });
    assert.deepEqual(nextStep({ ...t, status: 'accepted' }, 0), { kind: 'done' });
    const xml = giveUpTwiml({ paged: true, callbackWindow: 'Thursday, November 19, 2 to 3 PM' });
    assert.match(xml, /paged the on-call team/);
    assert.match(xml, /held a callback for Thursday, November 19, 2 to 3 PM/);
    assert.match(xml, /call 9 1 1/);
  });

  it('never leaves a dead line when no transfer is pending', () => {
    assert.match(screenTwiml(null, urls), /couldn&apos;t connect you/);
  });
});

describe('callback booking', () => {
  const calendar = {
    id: 'cal-1',
    is_demo: false,
    timezone: 'America/Chicago',
    weekly_hours: { '1': [['08:00', '17:00']] as Array<[string, string]>, '4': [['08:00', '17:00']] as Array<[string, string]> },
    blackouts: [],
  };
  // Thursday Nov 19, 2026, 1:00 PM Central.
  const now = new Date('2026-11-19T19:00:00Z');

  function deps(held: CallbackRow[] = []) {
    const inserted: CallbackRow[] = [];
    const after: string[] = [];
    return {
      inserted,
      after,
      d: {
        listHeld: async () => held.map((h) => ({ start_at: h.start_at, end_at: h.end_at })),
        findForConversation: async (id: string) => held.find((h) => h.conversation_id === id) ?? null,
        insert: async (row: Omit<CallbackRow, 'id'>) => {
          const saved = { ...row, id: `cb-${inserted.length + 1}` };
          inserted.push(saved);
          return saved;
        },
        afterHold: (_c: unknown, _r: CallbackRow, window: string) => void after.push(window),
        smsEnabled: false,
      },
    };
  }

  it('offers the next real windows (ASAP first) without holding anything', async () => {
    const { d, inserted } = deps();
    const r = (await handleCallback(calendar, {}, now, d)) as { held: boolean; windows: Array<{ slot_start: string; say: string }> };
    assert.equal(r.held, false);
    assert.equal(r.windows.length, 2);
    assert.equal(r.windows[0].say, 'Thursday, November 19, 2 to 3 PM');
    assert.equal(inserted.length, 0);
  });

  it('holds the chosen window, alerts the owner, and returns the deadline', async () => {
    const { d, inserted, after } = deps();
    const offer = (await handleCallback(calendar, {}, now, d)) as { windows: Array<{ slot_start: string }> };
    const r = (await handleCallback(calendar, { slot_start: offer.windows[0].slot_start, caller_name: 'Jane Smith', caller_phone: '2565550100', issue: 'wants a quote', conversation_id: 'conv-1' }, now, d)) as { held: boolean; window: string; deadline: string; message: string };
    assert.equal(r.held, true);
    assert.equal(r.window, 'Thursday, November 19, 2 to 3 PM');
    assert.equal(r.deadline, '2026-11-19T21:00:00.000Z');
    assert.equal(inserted.length, 1);
    assert.deepEqual(after, ['Thursday, November 19, 2 to 3 PM']);
    assert.doesNotMatch(r.message, /text/i, 'no text promised while texting is off');
  });

  it('refuses a made-up window and needs name and number', async () => {
    const { d } = deps();
    const bad = (await handleCallback(calendar, { slot_start: '2026-11-19T23:30:00Z', caller_name: 'J', caller_phone: '1' }, now, d)) as { held: boolean };
    assert.equal(bad.held, false);
    const missing = (await handleCallback(calendar, { slot_start: '2026-11-19T20:00:00Z' }, now, d)) as { held: boolean; message: string };
    assert.equal(missing.held, false);
    assert.match(missing.message, /Missing/);
  });

  it('full windows are skipped, and a second hold on the same call is refused', async () => {
    const full: CallbackRow[] = [1, 2, 3].map((n) => ({ id: `h${n}`, calendar_id: 'cal-1', start_at: '2026-11-19T20:00:00.000Z', end_at: '2026-11-19T21:00:00.000Z', caller_name: null, caller_phone: null, issue: null, conversation_id: `c${n}`, is_demo: false }));
    const { d } = deps(full);
    const r = (await handleCallback(calendar, {}, now, d)) as { windows: Array<{ say: string }> };
    assert.equal(r.windows[0].say, 'Thursday, November 19, 3 to 4 PM');
    const again = (await handleCallback(calendar, { conversation_id: 'c1' }, now, d)) as { already_held: boolean };
    assert.equal(again.already_held, true);
  });

  it('caller text stays behind the same gate as booking texts', () => {
    const input = { businessName: 'Porchlight', window: 'Thursday, November 19, 2 to 3 PM', callerPhone: '2565550100', optIn: true, isDemo: false };
    assert.deepEqual(decideCallbackSms(input, {}), { send: false, reason: 'disabled' });
    const on = { AVA_BOOKING_SMS_ENABLED: 'true', AVA_BOOKING_SMS_FROM: '+18555550100', TWILIO_ACCOUNT_SID: 'AC_test', TWILIO_AUTH_TOKEN: 'test' };
    const yes = decideCallbackSms(input, on);
    assert.equal(yes.send, true);
    if (yes.send) assert.match(yes.body, /call you back Thursday, November 19, 2 to 3 PM\. Reply HELP for help, STOP to opt out\./);
    assert.deepEqual(decideCallbackSms({ ...input, optIn: false }, on), { send: false, reason: 'no_opt_in' });
  });
});

describe('emergency paging', () => {
  const contacts = normalizeOnCall([
    { name: 'Tech A', email: 'a@shop.example', phone: '2055550101', smsConsent: true },
    { name: 'Tech B', phone: '2055550102' },
    { name: 'Bad' },
  ]);
  const input = { businessName: 'Porchlight', callerName: 'Jane', callerPhone: '2565550100', address: '12 Oak St', issue: 'no heat, infant at home', reason: 'transfer_unanswered' as const, conversationId: 'conv-9' };

  it('emails always; texts only when enabled, configured and consented', () => {
    assert.equal(contacts.length, 2);
    const off = planPage(contacts, {}, false);
    assert.deepEqual(off.emails, ['a@shop.example']);
    assert.equal(off.texts.length, 0);
    const on = planPage(contacts, { AVA_PAGING_SMS_ENABLED: 'true', AVA_BOOKING_SMS_FROM: '+18555550100', TWILIO_ACCOUNT_SID: 'AC', TWILIO_AUTH_TOKEN: 't' }, false);
    assert.deepEqual(on.texts.map((t) => t.to), ['+12055550101']);
    assert.deepEqual(on.skippedTexts, [{ to: '+12055550102', reason: 'no_consent' }]);
    assert.equal(planPage(contacts, {}, true).demo, true);
  });

  function fakeDeps(opts: { fail?: boolean; paged?: boolean } = {}) {
    const sent: string[][] = [];
    const deps: PageDeps = {
      alreadyPaged: async () => Boolean(opts.paged),
      sendEmail: async (to) => {
        if (opts.fail) throw new Error('resend down');
        sent.push(to);
      },
      sendSms: async () => ({ sid: 'SM1' }),
      record: async () => undefined,
      escape: (s) => s,
    };
    return { deps, sent };
  }

  it('says "paged" only when something was actually delivered', async () => {
    const ok = fakeDeps();
    const r = await runPage(input, contacts, {}, false, ok.deps);
    assert.equal(r.paged, true);
    assert.equal(ok.sent.length, 1);
    assert.match(r.message, /paged the on-call team/);
    const failed = await runPage(input, contacts, {}, false, fakeDeps({ fail: true }).deps);
    assert.equal(failed.paged, false);
    assert.match(failed.message, /Do not say anyone was paged/);
    const demo = await runPage(input, contacts, {}, true, ok.deps);
    assert.equal(demo.demo, true);
    assert.match(demo.message, /on a real line/);
    const dup = await runPage(input, contacts, {}, false, fakeDeps({ paged: true }).deps);
    assert.equal(dup.duplicate, true);
  });

  it('never promises an arrival time', () => {
    for (const r of [{ paged: true, delivered: { email: 1, sms: 0 }, failed: 0 }, { paged: false, delivered: { email: 0, sms: 0 }, failed: 1 }]) {
      assert.doesNotMatch(pageToolMessage(r), /minutes|on the way|arrive by/i);
    }
  });
});

describe('price and FAQ sheet', () => {
  const raw = {
    businessName: 'Porchlight Heating & Air',
    approvedBy: 'Owner',
    approvedOn: '2026-11-19',
    prices: [
      { service: 'Diagnostic visit', price: '$89', note: 'waived if you go ahead with the repair' },
      { service: 'Tune-up', price: '$129' },
      { service: 'Bad row', price: 'cheap' },
    ],
    faqs: [{ q: 'Do you offer financing?', a: 'Yes, through the office, with approved credit.' }],
    serviceArea: 'Cullman, Hanceville, Huntsville, Decatur',
  };

  it('requires owner approval and drops rows that are not real prices', () => {
    assert.equal(cleanPriceSheet({ ...raw, approvedBy: '' }).ok, false);
    const parsed = cleanPriceSheet(raw);
    assert.ok(parsed.ok);
    if (!parsed.ok) return;
    assert.equal(parsed.sheet.prices.length, 2);
    const doc = priceSheetDocument(parsed.sheet);
    assert.match(doc, /- Diagnostic visit: \$89 \(waived if you go ahead with the repair\)/);
    assert.match(doc, /ONLY prices/);
  });

  it('prompt allows only figures from the sheet, and none without one', () => {
    assert.match(pricingPromptSection(false), /Never say any dollar figure/);
    assert.match(pricingPromptSection(true), /ONLY if that exact service and dollar figure is written in the sheet/);
    const parsed = cleanPriceSheet(raw);
    if (!parsed.ok) throw new Error('sheet');
    assert.equal(onlyApprovedFigures('Our diagnostic visit is $89.', parsed.sheet), true);
    assert.equal(onlyApprovedFigures('A new system is about $6,000.', parsed.sheet), false);
    assert.equal(onlyApprovedFigures('It is $89.', null), false);
    assert.match(buildAvaAgentPrompt({ ...details, priceSheet: parsed.sheet }), /PRICES AND FAQ \(approved sheet\)/);
    assert.match(buildAvaAgentPrompt(details), /no approved price sheet/);
  });
});

describe('tool secrets', () => {
  it('references ElevenLabs secret storage instead of a plain-text header value', () => {
    const ref = { secret_id: 'sec_test' };
    assert.deepEqual(toolHeaders(ref)['x-ava-tool-secret'], { secret_id: 'sec_test' });
    for (const config of [...bookingToolConfigs('https://x.test', ref), callbackToolConfig('https://x.test', ref), pageOnCallToolConfig('https://x.test', ref)]) {
      const headers = (config.tool_config.api_schema as { request_headers: Record<string, unknown> }).request_headers;
      assert.deepEqual(headers['x-ava-tool-secret'], { secret_id: 'sec_test' });
    }
  });
});

describe('no lost leads', () => {
  it('replays only finished, unsaved calls older than 10 minutes', () => {
    const now = 1_800_000_000;
    const listed = [
      { conversation_id: 'saved', agent_id: 'a', status: 'done', start_time_unix_secs: now - 3600, call_duration_secs: 120 },
      { conversation_id: 'lost', agent_id: 'a', status: 'done', start_time_unix_secs: now - 3600, call_duration_secs: 120 },
      { conversation_id: 'fresh', agent_id: 'a', status: 'done', start_time_unix_secs: now - 300, call_duration_secs: 60 },
      { conversation_id: 'live', agent_id: 'a', status: 'in-progress', start_time_unix_secs: now - 3600, call_duration_secs: 0 },
      { conversation_id: 'blip', agent_id: 'a', status: 'done', start_time_unix_secs: now - 3600, call_duration_secs: 2 },
    ];
    assert.deepEqual(missingConversations(listed, new Set(['saved']), now).map((c) => c.conversation_id), ['lost']);
  });
});
