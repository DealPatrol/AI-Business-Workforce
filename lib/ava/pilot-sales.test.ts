import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PILOT_PLANS, type PilotPlanKey } from '@/lib/ava/pilot-pricing';
import {
  recordPilotSale,
  type PilotLeadContext,
  type PilotSaleDeps,
  type PilotSaleInsert,
  type PilotSaleRow,
  type PilotSubscriptionSnapshot,
} from '@/lib/ava/pilot-sales';
import { renderResultPage } from '@/lib/ava/pilot-sale-page';

const PERIOD_START = 1_800_000_000;

type FakeOptions = {
  plan?: PilotPlanKey;
  status?: string;
  /** Number of createInvoiceItem calls that fail before one succeeds. */
  failInvoiceItems?: number;
  /** Simulates a racing writer: first insert attempt gets a period_seq conflict. */
  seqConflictOnce?: boolean;
};

/** In-memory stand-in for Supabase + Stripe, with the same unique constraints as the migration. */
function fakeDeps(options: FakeOptions = {}) {
  const plan = options.plan ?? 'pilot_97';
  const state = {
    sales: [] as PilotSaleRow[],
    invoiceItems: [] as Array<{ id: string; saleId: string; amount: number; idempotencyKey: string }>,
    createCalls: 0,
    stripeFailuresLeft: options.failInvoiceItems ?? 0,
    seqConflictPending: Boolean(options.seqConflictOnce),
    status: options.status ?? 'active',
    bookedLeads: new Set<string>(),
    periodStartSec: PERIOD_START,
  };
  let idCounter = 0;

  const ctxFor = (leadId: string): PilotLeadContext => ({
    leadId,
    onboardingId: 'onb_1',
    customerId: 'cust_row_1',
    stripeCustomerId: 'cus_1',
    stripeSubscriptionId: 'sub_1',
    plan,
    callerName: 'Pat Caller',
    businessName: 'Shop',
  });

  const deps: PilotSaleDeps = {
    async loadContext(leadId) {
      if (leadId.startsWith('missing')) return { error: 'lead_not_found' as const };
      if (leadId.startsWith('standard')) return { error: 'not_pilot_customer' as const };
      return ctxFor(leadId);
    },
    async loadSubscription(): Promise<PilotSubscriptionSnapshot> {
      return {
        status: state.status,
        planKey: plan,
        periodStartSec: state.periodStartSec,
        periodEndSec: state.periodStartSec + 30 * 86400,
      };
    },
    async findSaleByLead(leadId) {
      return state.sales.find((sale) => sale.lead_id === leadId) ?? null;
    },
    async listPeriodSales(subscriptionId, periodStartIso) {
      return state.sales
        .filter((sale) => sale.stripe_subscription_id === subscriptionId && sale.period_start === periodStartIso)
        .map((sale) => ({ period_seq: sale.period_seq, billed_cents: sale.billed_cents }));
    },
    async insertSale(row: PilotSaleInsert) {
      if (state.seqConflictPending) {
        state.seqConflictPending = false;
        return { ok: false as const, conflict: 'seq' as const };
      }
      if (state.sales.some((sale) => sale.lead_id === row.lead_id)) return { ok: false as const, conflict: 'lead' as const };
      if (
        state.sales.some(
          (sale) =>
            sale.stripe_subscription_id === row.stripe_subscription_id &&
            sale.period_start === row.period_start &&
            sale.period_seq === row.period_seq,
        )
      ) {
        return { ok: false as const, conflict: 'seq' as const };
      }
      idCounter += 1;
      const saved: PilotSaleRow = {
        ...row,
        id: `sale_${idCounter}`,
        stripe_invoice_item_id: null,
        created_at: '2027-01-15T12:00:00.000Z',
      };
      state.sales.push(saved);
      return { ok: true as const, row: saved };
    },
    async createInvoiceItem({ sale }) {
      state.createCalls += 1;
      if (state.stripeFailuresLeft > 0) {
        state.stripeFailuresLeft -= 1;
        throw new Error('stripe down');
      }
      const key = `ava-pilot-sale-${sale.id}`;
      // Stripe Idempotency-Key semantics: the same key returns the same object.
      const prior = state.invoiceItems.find((item) => item.idempotencyKey === key);
      if (prior) return { id: prior.id };
      const item = { id: `ii_${state.invoiceItems.length + 1}`, saleId: sale.id, amount: sale.billed_cents, idempotencyKey: key };
      state.invoiceItems.push(item);
      return { id: item.id };
    },
    async findInvoiceItemForSale(_customer, saleId) {
      return state.invoiceItems.find((item) => item.saleId === saleId)?.id ?? null;
    },
    async markSaleBilled(saleId, invoiceItemId) {
      const sale = state.sales.find((row) => row.id === saleId);
      if (sale) {
        sale.billing_state = 'done';
        sale.stripe_invoice_item_id = invoiceItemId;
      }
    },
    async markLeadBooked(leadId) {
      state.bookedLeads.add(leadId);
    },
    now: () => new Date('2027-01-15T12:00:00.000Z'),
  };
  return { deps, state };
}

const lead = (n: number) => `lead-${n}`;
const mark = (deps: PilotSaleDeps, leadId: string, markedBy: 'owner_link' | 'admin' = 'owner_link') =>
  recordPilotSale(deps, { leadId, markedBy });

describe('recordPilotSale', () => {
  it('adds one $50 invoice item for a billable sale and stamps the lead', async () => {
    const { deps, state } = fakeDeps();
    const result = await mark(deps, lead(1));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.duplicate, false);
    assert.equal(result.billingPending, false);
    assert.equal(result.sale.billing_outcome, 'billed');
    assert.equal(result.sale.billed_cents, 5000);
    assert.equal(result.sale.base_cents, PILOT_PLANS.pilot_97.baseCents);
    assert.equal(result.sale.billing_state, 'done');
    assert.deepEqual(state.invoiceItems.map((item) => item.amount), [5000]);
    assert.ok(state.bookedLeads.has(lead(1)));
  });

  it('records trial sales but creates no invoice item', async () => {
    const { deps, state } = fakeDeps({ status: 'trialing' });
    for (const n of [1, 2, 3]) {
      const result = await mark(deps, lead(n));
      assert.equal(result.ok && result.sale.billing_outcome, 'trial');
      assert.equal(result.ok && result.sale.billed_cents, 0);
      assert.equal(result.ok && result.billingPending, false);
    }
    assert.equal(state.sales.length, 3);
    assert.equal(state.createCalls, 0);
    assert.equal(state.invoiceItems.length, 0);
  });

  it('is idempotent per lead: repeat clicks and admin retries never double-bill', async () => {
    const { deps, state } = fakeDeps();
    const first = await mark(deps, lead(1));
    const again = await mark(deps, lead(1));
    const viaAdmin = await mark(deps, lead(1), 'admin');
    assert.equal(first.ok && first.duplicate, false);
    assert.equal(again.ok && again.duplicate, true);
    assert.equal(viaAdmin.ok && viaAdmin.duplicate, true);
    assert.equal(state.sales.length, 1);
    assert.equal(state.invoiceItems.length, 1);
    assert.equal(state.createCalls, 1);
    assert.equal(state.sales[0].marked_by, 'owner_link');
  });

  it('survives truly concurrent clicks on the same lead', async () => {
    const { deps, state } = fakeDeps();
    const results = await Promise.all([mark(deps, lead(1)), mark(deps, lead(1)), mark(deps, lead(1))]);
    assert.ok(results.every((result) => result.ok));
    assert.equal(state.sales.length, 1);
    assert.equal(state.invoiceItems.length, 1);
  });

  it('stops billing at the $397 cap: 6 full sales on the $97 tier, then $0', async () => {
    const { deps, state } = fakeDeps({ plan: 'pilot_97' });
    const billed: number[] = [];
    for (let n = 1; n <= 9; n += 1) {
      const result = await mark(deps, lead(n));
      assert.ok(result.ok);
      if (result.ok) billed.push(result.sale.billed_cents);
    }
    assert.deepEqual(billed, [5000, 5000, 5000, 5000, 5000, 5000, 0, 0, 0]);
    assert.equal(state.sales[6].billing_outcome, 'capped');
    assert.equal(state.sales.length, 9, 'capped sales are still recorded');
    assert.equal(state.invoiceItems.length, 6);
    const total = PILOT_PLANS.pilot_97.baseCents + state.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    assert.equal(total, 39700);
  });

  it('caps each tier at the same $397 total', async () => {
    for (const plan of ['pilot_147', 'pilot_197'] as const) {
      const { deps, state } = fakeDeps({ plan });
      for (let n = 1; n <= 10; n += 1) await mark(deps, lead(n));
      const total = PILOT_PLANS[plan].baseCents + state.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
      assert.equal(total, 39700, plan);
    }
  });

  it('starts a fresh cap in the next billing period', async () => {
    const { deps, state } = fakeDeps({ plan: 'pilot_197' });
    for (let n = 1; n <= 6; n += 1) await mark(deps, lead(n));
    assert.equal(state.invoiceItems.length, 4);
    state.periodStartSec += 30 * 86400;
    const next = await mark(deps, lead(7));
    assert.equal(next.ok && next.sale.billed_cents, 5000);
    assert.equal(next.ok && next.sale.period_seq, 1);
  });

  it('recomputes against a racing sale when the period sequence number collides', async () => {
    const { deps, state } = fakeDeps({ seqConflictOnce: true });
    const result = await mark(deps, lead(1));
    assert.equal(result.ok && result.sale.period_seq, 1);
    assert.equal(state.invoiceItems.length, 1);
  });

  it('keeps the sale and finishes billing on retry when Stripe fails the first time', async () => {
    const { deps, state } = fakeDeps({ failInvoiceItems: 1 });
    const silence = console.error;
    console.error = () => {};
    let first;
    try {
      first = await mark(deps, lead(1));
    } finally {
      console.error = silence;
    }
    assert.ok(first.ok);
    assert.equal(first.ok && first.billingPending, true);
    assert.equal(state.sales[0].billing_state, 'pending');
    assert.equal(state.invoiceItems.length, 0);

    const retry = await mark(deps, lead(1));
    assert.equal(retry.ok && retry.duplicate, true);
    assert.equal(retry.ok && retry.billingPending, false);
    assert.equal(state.sales.length, 1);
    assert.equal(state.invoiceItems.length, 1);
    assert.equal(state.sales[0].stripe_invoice_item_id, 'ii_1');

    // a further click does nothing
    await mark(deps, lead(1));
    assert.equal(state.invoiceItems.length, 1);
  });

  it('reuses an invoice item that Stripe already created when only the DB write was lost', async () => {
    const { deps, state } = fakeDeps();
    const first = await mark(deps, lead(1));
    assert.ok(first.ok);
    // simulate: Stripe item exists, but the sale row was never flipped to done
    state.sales[0].billing_state = 'pending';
    state.sales[0].stripe_invoice_item_id = null;
    const retry = await mark(deps, lead(1));
    assert.equal(retry.ok && retry.billingPending, false);
    assert.equal(state.invoiceItems.length, 1);
  });

  it('records but does not bill inactive subscriptions', async () => {
    const { deps, state } = fakeDeps({ status: 'canceled' });
    const result = await mark(deps, lead(1));
    assert.equal(result.ok && result.sale.billing_outcome, 'inactive');
    assert.equal(state.invoiceItems.length, 0);
  });

  it('rejects unknown leads, standard-plan customers, and plan mismatches without recording anything', async () => {
    const { deps, state } = fakeDeps();
    const missing = await mark(deps, 'missing-1');
    const standard = await mark(deps, 'standard-1');
    assert.equal(missing.ok === false && missing.code, 'lead_not_found');
    assert.equal(standard.ok === false && standard.code, 'not_pilot_customer');

    const mismatch = fakeDeps();
    mismatch.deps.loadSubscription = async () => ({ status: 'active', planKey: 'growth', periodStartSec: PERIOD_START, periodEndSec: null });
    const rejected = await mark(mismatch.deps, lead(1));
    assert.equal(rejected.ok === false && rejected.code, 'not_pilot_customer');

    const down = fakeDeps();
    down.deps.loadSubscription = async () => null;
    const unavailable = await mark(down.deps, lead(1));
    assert.equal(unavailable.ok === false && unavailable.code, 'subscription_unavailable');

    for (const fake of [state, mismatch.state, down.state]) {
      assert.equal(fake.sales.length, 0);
      assert.equal(fake.invoiceItems.length, 0);
    }
  });
});

describe('owner confirmation page copy', () => {
  it('tells the owner what happened for each outcome', async () => {
    const trial = await mark(fakeDeps({ status: 'trialing' }).deps, lead(1));
    assert.match(renderResultPage(trial), /no charge/i);

    const billed = await mark(fakeDeps().deps, lead(1));
    assert.match(renderResultPage(billed), /\$50 was added to your next invoice/);

    const capped = fakeDeps({ plan: 'pilot_197' });
    for (let n = 1; n <= 4; n += 1) await mark(capped.deps, lead(n));
    const over = await mark(capped.deps, lead(5));
    assert.match(renderResultPage(over), /\$397 monthly maximum/);

    const duplicate = await mark(capped.deps, lead(5));
    assert.match(renderResultPage(duplicate), /not be charged twice/);
  });
});
