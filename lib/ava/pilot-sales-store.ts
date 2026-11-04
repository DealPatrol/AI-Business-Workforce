import { isPilotPlanKey } from '@/lib/ava/pilot-pricing';
import type {
  PilotLeadContext,
  PilotSaleDeps,
  PilotSaleInsert,
  PilotSaleRow,
  PilotSubscriptionSnapshot,
} from '@/lib/ava/pilot-sales';
import { createAdminClient } from '@/lib/supabase/admin';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';

const STRIPE_API = 'https://api.stripe.com/v1';

function stripeSecret() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not set.');
  return secret;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function num(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

async function loadSubscription(subscriptionId: string): Promise<PilotSubscriptionSnapshot | null> {
  const response = await fetch(`${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${stripeSecret()}`, 'Stripe-Version': STRIPE_API_VERSION },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const sub = asRecord(await response.json().catch(() => ({})));
  const items = asRecord(sub.items);
  const item = asRecord(Array.isArray(items.data) ? items.data[0] : null);
  // Newer API versions put the period on the item; older ones on the subscription.
  const periodStartSec = num(item.current_period_start) || num(sub.current_period_start);
  const periodEndSec = num(item.current_period_end) || num(sub.current_period_end) || null;
  const metadata = asRecord(sub.metadata);
  return {
    status: typeof sub.status === 'string' ? sub.status : '',
    planKey: typeof metadata.plan === 'string' ? metadata.plan : '',
    periodStartSec,
    periodEndSec,
  };
}

async function stripeInvoiceItemCall(path: string, init: RequestInit) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      'Stripe-Version': STRIPE_API_VERSION,
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  });
  const data = asRecord(await response.json().catch(() => ({})));
  return { ok: response.ok, data };
}

export function createPilotSaleDeps(): PilotSaleDeps {
  const supabase = createAdminClient();

  return {
    async loadContext(leadId) {
      const leadResult = await supabase
        .from('ava_call_leads')
        .select('id, onboarding_id, caller_name, business_name')
        .eq('id', leadId)
        .maybeSingle();
      if (leadResult.error) throw new Error(`Unable to load lead: ${leadResult.error.message}`);
      const lead = leadResult.data as {
        id: string;
        onboarding_id: string | null;
        caller_name: string | null;
        business_name: string | null;
      } | null;
      if (!lead) return { error: 'lead_not_found' as const };
      if (!lead.onboarding_id) return { error: 'not_pilot_customer' as const };

      const onboardingResult = await supabase
        .from('ava_onboardings')
        .select('id, business_name, stripe_session_id')
        .eq('id', lead.onboarding_id)
        .maybeSingle();
      if (onboardingResult.error) throw new Error(`Unable to load onboarding: ${onboardingResult.error.message}`);
      const onboarding = onboardingResult.data as {
        id: string;
        business_name: string | null;
        stripe_session_id: string | null;
      } | null;
      if (!onboarding) return { error: 'not_pilot_customer' as const };

      const columns = 'id, plan, product, stripe_customer_id, stripe_subscription_id';
      const byOnboarding = await supabase.from('ava_customers').select(columns).eq('onboarding_id', onboarding.id).limit(5);
      if (byOnboarding.error) throw new Error(`Unable to load customer: ${byOnboarding.error.message}`);
      const candidates = [...((byOnboarding.data ?? []) as CustomerRow[])];
      if (onboarding.stripe_session_id) {
        const bySession = await supabase
          .from('ava_customers')
          .select(columns)
          .eq('stripe_checkout_session_id', onboarding.stripe_session_id)
          .limit(5);
        if (bySession.error) throw new Error(`Unable to load customer: ${bySession.error.message}`);
        candidates.push(...((bySession.data ?? []) as CustomerRow[]));
      }

      const customer = candidates.find(
        (row) =>
          isPilotPlanKey(row.plan) &&
          (row.product || 'ava') === 'ava' &&
          row.stripe_customer_id &&
          row.stripe_subscription_id,
      );
      if (!customer || !isPilotPlanKey(customer.plan)) return { error: 'not_pilot_customer' as const };

      const ctx: PilotLeadContext = {
        leadId: lead.id,
        onboardingId: onboarding.id,
        customerId: customer.id,
        stripeCustomerId: customer.stripe_customer_id as string,
        stripeSubscriptionId: customer.stripe_subscription_id as string,
        plan: customer.plan,
        callerName: lead.caller_name || '',
        businessName: lead.business_name || onboarding.business_name || '',
      };
      return ctx;
    },

    loadSubscription,

    async findSaleByLead(leadId) {
      const { data, error } = await supabase.from('ava_sales').select('*').eq('lead_id', leadId).maybeSingle();
      if (error) throw new Error(`Unable to read sale: ${error.message}`);
      return (data as PilotSaleRow | null) ?? null;
    },

    async listPeriodSales(subscriptionId, periodStartIso) {
      const { data, error } = await supabase
        .from('ava_sales')
        .select('period_seq, billed_cents')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('period_start', periodStartIso);
      if (error) throw new Error(`Unable to read period sales: ${error.message}`);
      return (data ?? []) as Array<{ period_seq: number; billed_cents: number }>;
    },

    async insertSale(row: PilotSaleInsert) {
      const { data, error } = await supabase.from('ava_sales').insert(row).select('*').single();
      if (!error && data) return { ok: true as const, row: data as PilotSaleRow };
      if (error?.code === '23505') {
        // Unique violation: either this lead already has a sale, or the period sequence number was taken.
        const text = `${error.message} ${error.details ?? ''}`;
        return { ok: false as const, conflict: /ava_sales_lead_unique|\(lead_id\)/.test(text) ? ('lead' as const) : ('seq' as const) };
      }
      throw new Error(`Unable to record sale: ${error?.message ?? 'unknown error'}`);
    },

    async createInvoiceItem({ sale, ctx, description }) {
      const params = new URLSearchParams();
      params.set('customer', sale.stripe_customer_id);
      params.set('subscription', sale.stripe_subscription_id);
      params.set('amount', String(sale.billed_cents));
      params.set('currency', 'usd');
      params.set('description', description);
      params.set('metadata[kind]', 'ava_pilot_sale');
      params.set('metadata[ava_sale_id]', sale.id);
      params.set('metadata[ava_lead_id]', ctx.leadId);
      params.set('metadata[period_start]', sale.period_start);
      params.set('metadata[period_seq]', String(sale.period_seq));
      params.set('metadata[list_amount_cents]', String(sale.list_amount_cents));
      const result = await stripeInvoiceItemCall('/invoiceitems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': `ava-pilot-sale-${sale.id}`,
        },
        body: params.toString(),
      });
      const id = typeof result.data.id === 'string' ? result.data.id : '';
      if (!result.ok || !id) {
        const message = asRecord(result.data.error).message;
        throw new Error(typeof message === 'string' ? message : 'Stripe did not create the invoice item.');
      }
      return { id };
    },

    async findInvoiceItemForSale(stripeCustomerId, saleId) {
      const result = await stripeInvoiceItemCall(
        `/invoiceitems?customer=${encodeURIComponent(stripeCustomerId)}&pending=true&limit=100`,
        { method: 'GET' },
      );
      if (!result.ok) throw new Error('Stripe invoice item lookup failed.');
      const rows = Array.isArray(result.data.data) ? (result.data.data as unknown[]) : [];
      const match = rows.map(asRecord).find((item) => asRecord(item.metadata).ava_sale_id === saleId);
      return match && typeof match.id === 'string' ? match.id : null;
    },

    async markSaleBilled(saleId, invoiceItemId) {
      const { error } = await supabase
        .from('ava_sales')
        .update({ billing_state: 'done', stripe_invoice_item_id: invoiceItemId, billed_at: new Date().toISOString() })
        .eq('id', saleId);
      if (error) throw new Error(`Unable to mark sale billed: ${error.message}`);
    },

    async markLeadBooked(leadId, saleId) {
      const { error } = await supabase
        .from('ava_call_leads')
        .update({ booked_at: new Date().toISOString(), sale_id: saleId })
        .eq('id', leadId)
        .is('booked_at', null);
      if (error) throw new Error(error.message);
    },

    now: () => new Date(),
  };
}

type CustomerRow = {
  id: string;
  plan: string | null;
  product: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};
