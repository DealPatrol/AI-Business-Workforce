import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deskJobType, deskLeadNotes, extractPostCallLead, normalizeUrgency } from '@/lib/ava/post-call-lead';
import { decideStoreCallMeter, isJunkCallType } from '@/lib/ava/store-call-billing';
import { buildAvaAgentPrompt, firstMessage } from '@/lib/ava/provisioning';

function event(collected: Record<string, unknown>) {
  return {
    type: 'post_call_transcription',
    data: {
      conversation_id: 'conv_1',
      agent_id: 'agent_1',
      analysis: { transcript_summary: 'Caller needs help.', data_collection_results: collected },
      transcript: [{ role: 'user', message: 'Hi', time_in_call_secs: 1 }],
    },
  };
}

describe('post-call field mapping across agent templates', () => {
  it('reads the issue field as the need and a yes/no emergency flag as urgency', () => {
    const lead = extractPostCallLead(
      event({
        name: { value: 'Dana' },
        phone: { value: '205-555-0134' },
        address: { value: '12 Oak St' },
        issue: { value: 'No heat' },
        emergency: { value: true },
      }),
    );
    assert.ok(lead);
    assert.equal(lead.callerName, 'Dana');
    assert.equal(lead.need, 'No heat');
    assert.equal(lead.address, '12 Oak St');
    assert.equal(lead.urgency, 'emergency');
  });

  it('keeps an urgency word and reads store fields', () => {
    const lead = extractPostCallLead(
      event({
        name: { value: 'Sam' },
        issue: { value: 'Where is my order' },
        urgency: { value: 'soon' },
        order_number: { value: '1042' },
        email: { value: 'sam@example.com' },
        escalation_reason: { value: 'Marked delivered, not received' },
        call_type: { value: 'order_status' },
      }),
    );
    assert.ok(lead);
    assert.equal(lead.urgency, 'soon');
    assert.equal(lead.orderNumber, '1042');
    assert.equal(lead.email, 'sam@example.com');
    assert.equal(deskJobType(lead), 'Where is my order (order 1042)');
    assert.match(deskLeadNotes(lead), /Needs a person: Marked delivered/);
  });

  it('normalizes urgency flags', () => {
    assert.equal(normalizeUrgency('', 'no'), 'not an emergency');
    assert.equal(normalizeUrgency('routine', 'true'), 'routine');
    assert.equal(normalizeUrgency('', ''), '');
  });
});

describe('junk calls', () => {
  it('detects spam, sales and wrong numbers', () => {
    assert.ok(isJunkCallType('spam_or_sales'));
    assert.ok(isJunkCallType('wrong number'));
    assert.ok(!isJunkCallType('new_service_request'));
    assert.ok(!isJunkCallType(''));
  });

  it('never bills a store customer for a spam call', () => {
    const decision = decideStoreCallMeter({
      customer: { plan: 'store', stripe_customer_id: 'cus_1', subscription_status: 'active' },
      conversationId: 'conv_1',
      transcript: [{ role: 'user', message: 'We can boost your SEO' }],
      callType: 'spam_or_sales',
    });
    assert.deepEqual(decision, { bill: false, reason: 'junk_call' });
  });
});

describe('provisioned agent prompts', () => {
  const base = {
    businessName: 'Trailhead Supply',
    businessHours: 'Mon-Fri 9-5',
    services: 'Outdoor gear. Returns within 30 days.',
    callHandlingRules: 'Help with orders.',
    staffName: 'Sam',
    staffContact: 'sam@example.com',
    calendarPreference: 'Email me.',
    urgentCallRules: 'Damaged items.',
  };

  it('builds a store prompt that cannot invent order status', () => {
    const prompt = buildAvaAgentPrompt({ ...base, plan: 'store' });
    assert.match(prompt, /online store/);
    assert.match(prompt, /Never invent an order status/);
    assert.match(prompt, /Never take card numbers/);
    assert.match(firstMessage('Trailhead Supply', 'store'), /AI assistant/);
  });

  it('home-service agents disclose they are AI and keep the handoff rules', () => {
    const prompt = buildAvaAgentPrompt(base);
    assert.match(prompt, /You are Ava, the AI phone receptionist/);
    assert.ok(prompt.includes('Never promise the caller a text message'));
    assert.match(firstMessage('Trailhead Supply'), /AI receptionist/);
  });
});
