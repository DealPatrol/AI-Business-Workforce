import {
  PILOT_PLANS,
  PILOT_SALE_CENTS,
  decideSaleBilling,
  isPilotPlanKey,
  type PilotPlanKey,
  type SaleBillingOutcome,
} from '@/lib/ava/pilot-pricing';

/**
 * Records a booked job ("sale") for a pilot customer and, when it is billable, adds a $50 pending
 * invoice item to the customer's Stripe subscription so it lands on the next invoice.
 *
 * Rules (see lib/ava/pilot-pricing.ts):
 *  - one sale per lead, ever (idempotent; retries and double clicks never double-bill)
 *  - sales while the subscription is trialing are recorded but billed $0 (free pilot)
 *  - per billing period, base + sale charges never exceed the $397 cap
 *
 * All I/O goes through PilotSaleDeps so the logic is unit tested without Supabase or Stripe.
 */

export type PilotMarkedBy = 'owner_link' | 'admin';
export type PilotBillingState = 'pending' | 'done';

export type PilotLeadContext = {
  leadId: string;
  onboardingId: string | null;
  customerId: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: PilotPlanKey;
  callerName: string;
  businessName: string;
};

export type PilotSubscriptionSnapshot = {
  status: string;
  /** From Stripe subscription metadata[plan], written by our own checkout. */
  planKey: string;
  periodStartSec: number;
  periodEndSec: number | null;
};

export type PilotSaleRow = {
  id: string;
  lead_id: string;
  onboarding_id: string | null;
  customer_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: string;
  period_start: string;
  period_end: string | null;
  period_seq: number;
  base_cents: number;
  list_amount_cents: number;
  billed_cents: number;
  billing_outcome: SaleBillingOutcome;
  billing_state: PilotBillingState;
  stripe_invoice_item_id: string | null;
  marked_by: PilotMarkedBy;
  note: string | null;
  created_at?: string;
};

export type PilotSaleInsert = Omit<PilotSaleRow, 'id' | 'created_at' | 'stripe_invoice_item_id'>;

export type PilotSaleDeps = {
  loadContext(leadId: string): Promise<PilotLeadContext | { error: 'lead_not_found' | 'not_pilot_customer' }>;
  loadSubscription(subscriptionId: string): Promise<PilotSubscriptionSnapshot | null>;
  findSaleByLead(leadId: string): Promise<PilotSaleRow | null>;
  listPeriodSales(
    subscriptionId: string,
    periodStartIso: string,
  ): Promise<Array<{ period_seq: number; billed_cents: number }>>;
  insertSale(row: PilotSaleInsert): Promise<{ ok: true; row: PilotSaleRow } | { ok: false; conflict: 'lead' | 'seq' }>;
  /** Must be idempotent per sale id (Stripe Idempotency-Key). */
  createInvoiceItem(input: {
    sale: PilotSaleRow;
    ctx: PilotLeadContext;
    description: string;
  }): Promise<{ id: string }>;
  findInvoiceItemForSale(stripeCustomerId: string, saleId: string): Promise<string | null>;
  markSaleBilled(saleId: string, invoiceItemId: string): Promise<void>;
  markLeadBooked(leadId: string, saleId: string): Promise<void>;
  now(): Date;
};

export type RecordPilotSaleResult =
  | {
      ok: true;
      duplicate: boolean;
      sale: PilotSaleRow;
      /** True when the sale is saved but the Stripe invoice item is not created yet. Repeating the call finishes it. */
      billingPending: boolean;
    }
  | {
      ok: false;
      code: 'lead_not_found' | 'not_pilot_customer' | 'subscription_unavailable' | 'conflict';
      message: string;
    };

const MAX_SEQ_ATTEMPTS = 6;

export function saleInvoiceDescription(input: {
  callerName: string;
  billedCents: number;
  outcome: SaleBillingOutcome;
  date: Date;
}) {
  const who = input.callerName.trim().slice(0, 60) || 'lead';
  const day = input.date.toISOString().slice(0, 10);
  const base = `Executive Receptionist booked job: ${who} (${day})`;
  return input.outcome === 'partial_cap' ? `${base} — reduced to stay within the monthly cap` : base;
}

async function finishBilling(
  deps: PilotSaleDeps,
  sale: PilotSaleRow,
  ctx: PilotLeadContext,
  isRetry: boolean,
): Promise<{ sale: PilotSaleRow; billingPending: boolean }> {
  if (sale.billing_state === 'done' || sale.billed_cents <= 0) {
    return { sale, billingPending: false };
  }
  try {
    let itemId: string | null = sale.stripe_invoice_item_id;
    if (!itemId && isRetry) itemId = await deps.findInvoiceItemForSale(sale.stripe_customer_id, sale.id);
    if (!itemId) {
      const created = await deps.createInvoiceItem({
        sale,
        ctx,
        description: saleInvoiceDescription({
          callerName: ctx.callerName,
          billedCents: sale.billed_cents,
          outcome: sale.billing_outcome,
          date: new Date(sale.created_at ?? deps.now().toISOString()),
        }),
      });
      itemId = created.id;
    }
    await deps.markSaleBilled(sale.id, itemId);
    return {
      sale: { ...sale, billing_state: 'done', stripe_invoice_item_id: itemId },
      billingPending: false,
    };
  } catch (error) {
    console.error('Pilot sale recorded but Stripe invoice item is not created yet', sale.id, error);
    return { sale, billingPending: true };
  }
}

export async function recordPilotSale(
  deps: PilotSaleDeps,
  input: { leadId: string; markedBy: PilotMarkedBy; note?: string | null },
): Promise<RecordPilotSaleResult> {
  const existing = await deps.findSaleByLead(input.leadId);
  if (existing) return resumeExisting(deps, existing);

  const ctx = await deps.loadContext(input.leadId);
  if ('error' in ctx) {
    return ctx.error === 'lead_not_found'
      ? { ok: false, code: 'lead_not_found', message: 'This lead could not be found.' }
      : { ok: false, code: 'not_pilot_customer', message: 'This lead does not belong to a pilot-billing customer.' };
  }

  const subscription = await deps.loadSubscription(ctx.stripeSubscriptionId);
  if (!subscription || !subscription.periodStartSec) {
    return {
      ok: false,
      code: 'subscription_unavailable',
      message: 'The subscription could not be read from Stripe. Nothing was recorded; try again shortly.',
    };
  }
  if (!isPilotPlanKey(subscription.planKey) || subscription.planKey !== ctx.plan) {
    return { ok: false, code: 'not_pilot_customer', message: 'This subscription is not on pilot billing.' };
  }

  const baseCents = PILOT_PLANS[ctx.plan].baseCents;
  const periodStart = new Date(subscription.periodStartSec * 1000).toISOString();
  const periodEnd = subscription.periodEndSec ? new Date(subscription.periodEndSec * 1000).toISOString() : null;

  for (let attempt = 0; attempt < MAX_SEQ_ATTEMPTS; attempt += 1) {
    const rows = await deps.listPeriodSales(ctx.stripeSubscriptionId, periodStart);
    const nextSeq = rows.reduce((max, row) => Math.max(max, row.period_seq), 0) + 1;
    const billedSoFarCents = rows.reduce((sum, row) => sum + row.billed_cents, 0);
    const decision = decideSaleBilling({
      subscriptionStatus: subscription.status,
      baseCents,
      billedSoFarCents,
    });

    const inserted = await deps.insertSale({
      lead_id: ctx.leadId,
      onboarding_id: ctx.onboardingId,
      customer_id: ctx.customerId,
      stripe_customer_id: ctx.stripeCustomerId,
      stripe_subscription_id: ctx.stripeSubscriptionId,
      plan: ctx.plan,
      period_start: periodStart,
      period_end: periodEnd,
      period_seq: nextSeq,
      base_cents: baseCents,
      list_amount_cents: PILOT_SALE_CENTS,
      billed_cents: decision.billedCents,
      billing_outcome: decision.outcome,
      billing_state: decision.billedCents > 0 ? 'pending' : 'done',
      marked_by: input.markedBy,
      note: input.note?.trim().slice(0, 500) || null,
    });

    if (inserted.ok) {
      const finished = await finishBilling(deps, inserted.row, ctx, false);
      await deps.markLeadBooked(ctx.leadId, inserted.row.id).catch((error) => {
        console.error('Pilot sale saved but the lead was not stamped booked_at', error);
      });
      return { ok: true, duplicate: false, sale: finished.sale, billingPending: finished.billingPending };
    }

    if (inserted.conflict === 'lead') {
      const raced = await deps.findSaleByLead(input.leadId);
      if (raced) return resumeExisting(deps, raced);
    }
    // 'seq' conflict: another sale in this period landed first. Re-read and recompute against it.
  }

  return { ok: false, code: 'conflict', message: 'Several sales were recorded at once. Please try again.' };
}

/** A repeat click / retry. Never creates a second sale; finishes a half-done Stripe write if needed. */
async function resumeExisting(deps: PilotSaleDeps, sale: PilotSaleRow): Promise<RecordPilotSaleResult> {
  if (sale.billing_state === 'done') return { ok: true, duplicate: true, sale, billingPending: false };

  const ctx = await deps.loadContext(sale.lead_id);
  if ('error' in ctx) return { ok: true, duplicate: true, sale, billingPending: sale.billed_cents > 0 };
  const finished = await finishBilling(deps, sale, ctx, true);
  return { ok: true, duplicate: true, sale: finished.sale, billingPending: finished.billingPending };
}
