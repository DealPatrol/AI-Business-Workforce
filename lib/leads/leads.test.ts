import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextBookedJobBillingAction } from '@/lib/ava/booked-job-billing';
import {
  countBilledJobsInPeriod,
  isInCurrentBillingPeriod,
  planBookedLeadBilling,
  yearMonthInZone,
} from '@/lib/leads/booked-billing';
import { matchesLeadSearch, parseIngestPayload, parseLeadPatch } from '@/lib/leads/parse';
import { authorizeIngestRequest } from '@/lib/leads/secret';
import { smsHref, telHref } from '@/lib/leads/sms';
import { ownerCanAccessLead } from '@/lib/leads/access';
import type { ErLead } from '@/lib/leads/types';

function lead(overrides: Partial<ErLead> = {}): ErLead {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    client_id: '22222222-2222-4222-8222-222222222222',
    business_id: null,
    owner_id: '33333333-3333-4333-8333-333333333333',
    caller_name: 'Jane Caller',
    caller_phone: '2565550100',
    job_type: 'AC repair',
    summary: 'Caller needs a same-day AC repair.',
    called_at: '2026-11-06T16:00:00.000Z',
    source: 'receptionist call',
    status: 'New',
    notes: '',
    booked_at: null,
    billed_at: null,
    billing_skipped: false,
    billing_skip_reason: null,
    conversation_id: 'conv_1',
    created_at: '2026-11-06T16:00:00.000Z',
    updated_at: '2026-11-06T16:00:00.000Z',
    ...overrides,
  };
}

describe('lead ingest parsing', () => {
  it('requires a summary', () => {
    const parsed = parseIngestPayload({ callerName: 'Jane' });
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.error, /summary/i);
  });

  it('accepts a flat receptionist payload', () => {
    const parsed = parseIngestPayload({
      clientId: '22222222-2222-4222-8222-222222222222',
      callerName: 'Jane Caller',
      callerPhone: '256-555-0100',
      jobType: 'AC repair',
      summary: 'Needs a same-day visit.',
      source: 'receptionist call',
      conversationId: 'conv_123',
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.callerName, 'Jane Caller');
    assert.equal(parsed.value.jobType, 'AC repair');
    assert.equal(parsed.value.source, 'receptionist call');
    assert.equal(parsed.value.conversationId, 'conv_123');
  });

  it('reads ElevenLabs-shaped nested fields', () => {
    const parsed = parseIngestPayload({
      data: {
        conversation_id: 'conv_nested',
        agent_id: 'agent_abc',
        analysis: {
          transcript_summary: 'Homeowner asked about a leaking water heater.',
          data_collection_results: {
            caller_name: 'Sam Owner',
            phone: '2565550199',
            need: 'Water heater',
          },
        },
      },
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.summary, 'Homeowner asked about a leaking water heater.');
    assert.equal(parsed.value.callerName, 'Sam Owner');
    assert.equal(parsed.value.callerPhone, '2565550199');
    assert.equal(parsed.value.jobType, 'Water heater');
    assert.equal(parsed.value.conversationId, 'conv_nested');
    assert.equal(parsed.value.agentId, 'agent_abc');
    assert.equal(parsed.value.source, 'receptionist call');
  });

  it('accepts an online booking source', () => {
    const parsed = parseIngestPayload({ summary: 'Deposit paid for a haircut.', source: 'online booking' });
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.value.source, 'online booking');
  });

  it('rejects an invalid source', () => {
    const parsed = parseIngestPayload({ summary: 'Hello', source: 'outbound dialer' });
    assert.equal(parsed.ok, false);
  });
});

describe('lead status updates', () => {
  it('accepts the four CRM statuses', () => {
    for (const status of ['New', 'Contacted', 'Booked', 'Not a fit']) {
      const parsed = parseLeadPatch({ status });
      assert.equal(parsed.ok, true);
      if (parsed.ok) assert.equal(parsed.status, status);
    }
  });

  it('rejects an unknown status', () => {
    const parsed = parseLeadPatch({ status: 'Won' });
    assert.equal(parsed.ok, false);
  });
});

describe('booked-job billing on a lead', () => {
  it('is a no-op when the Stripe booked-job price is unset', () => {
    const plan = planBookedLeadBilling({
      lead: lead(),
      jobsAlreadyInPeriod: 0,
      priceConfigured: false,
    });
    assert.equal(plan.type, 'missing_price_id');
    assert.deepEqual(plan.action, { type: 'skip', cents: 0 });
  });

  it('does not bill a lead that was already booked', () => {
    const plan = planBookedLeadBilling({
      lead: lead({ booked_at: '2026-11-01T12:00:00.000Z', status: 'Booked' }),
      jobsAlreadyInPeriod: 3,
      priceConfigured: true,
    });
    assert.equal(plan.type, 'already_booked');
    assert.deepEqual(plan.action, { type: 'skip', cents: 0 });
  });

  it('meters a first booked lead when the price is configured', () => {
    const plan = planBookedLeadBilling({
      lead: lead(),
      jobsAlreadyInPeriod: 0,
      priceConfigured: true,
    });
    assert.equal(plan.type, 'bill');
    assert.deepEqual(plan.action, nextBookedJobBillingAction(0));
  });

  it('uses the $297 cap helper for later jobs in the period', () => {
    const twelfth = planBookedLeadBilling({
      lead: lead(),
      jobsAlreadyInPeriod: 11,
      priceConfigured: true,
    });
    assert.deepEqual(twelfth.action, nextBookedJobBillingAction(11));
    const afterCap = planBookedLeadBilling({
      lead: lead(),
      jobsAlreadyInPeriod: 12,
      priceConfigured: true,
    });
    assert.deepEqual(afterCap.action, nextBookedJobBillingAction(12));
  });

  it('counts only billed jobs in the current Chicago month', () => {
    const now = new Date('2026-11-15T18:00:00.000Z');
    const count = countBilledJobsInPeriod(
      [
        { billed_at: '2026-11-02T12:00:00.000Z' },
        { billed_at: '2026-10-30T12:00:00.000Z' },
        { billed_at: null },
      ],
      now,
    );
    assert.equal(count, 1);
    assert.equal(isInCurrentBillingPeriod('2026-11-06T12:00:00.000Z', now), true);
    assert.equal(yearMonthInZone(new Date('2026-11-06T06:00:00.000Z')), '2026-11');
  });
});

describe('lead access and search', () => {
  it('lets an owner see their own lead or a matching client id', () => {
    const owned = lead({ owner_id: '33333333-3333-4333-8333-333333333333', client_id: null });
    const byClient = lead({ owner_id: null, client_id: '22222222-2222-4222-8222-222222222222' });
    const other = lead({ owner_id: null, client_id: '44444444-4444-4444-8444-444444444444' });
    const ownerId = '33333333-3333-4333-8333-333333333333';
    const clientIds = ['22222222-2222-4222-8222-222222222222'];
    assert.equal(ownerCanAccessLead(owned, ownerId, clientIds), true);
    assert.equal(ownerCanAccessLead(byClient, ownerId, clientIds), true);
    assert.equal(ownerCanAccessLead(other, ownerId, clientIds), false);
  });

  it('filters list search across name, phone, job, and summary', () => {
    const row = lead();
    assert.equal(matchesLeadSearch(row, 'jane'), true);
    assert.equal(matchesLeadSearch(row, '2565550100'), true);
    assert.equal(matchesLeadSearch(row, 'ac repair'), true);
    assert.equal(matchesLeadSearch(row, 'plumber'), false);
  });
});

describe('text-us sms link', () => {
  it('builds a customer-initiated sms: link and never a send API', () => {
    assert.equal(smsHref('(256) 555-0100'), 'sms:+12565550100');
    assert.equal(smsHref('+12565550100'), 'sms:+12565550100');
    assert.equal(telHref('2565550100'), 'tel:+12565550100');
    assert.equal(smsHref(''), '');
  });
});

describe('ingest secret', () => {
  it('rejects a request when the secret is unset', () => {
    const previous = process.env.LEADS_INGEST_SECRET;
    delete process.env.LEADS_INGEST_SECRET;
    try {
      const result = authorizeIngestRequest('Bearer test');
      assert.equal(result.configured, false);
      assert.equal(result.ok, false);
    } finally {
      if (previous === undefined) delete process.env.LEADS_INGEST_SECRET;
      else process.env.LEADS_INGEST_SECRET = previous;
    }
  });

  it('accepts a matching bearer secret', () => {
    const previous = process.env.LEADS_INGEST_SECRET;
    process.env.LEADS_INGEST_SECRET = 'unit-test-secret';
    try {
      assert.equal(authorizeIngestRequest('Bearer unit-test-secret').ok, true);
      assert.equal(authorizeIngestRequest('Bearer wrong').ok, false);
      assert.equal(authorizeIngestRequest(null).ok, false);
    } finally {
      if (previous === undefined) delete process.env.LEADS_INGEST_SECRET;
      else process.env.LEADS_INGEST_SECRET = previous;
    }
  });
});
