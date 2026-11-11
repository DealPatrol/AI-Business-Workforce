import { STORE_PLAN_KEY } from '@/lib/ava/store-pricing';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  countBilledJobsInPeriod,
  planBookedLeadBilling,
  stripeBookedJobPriceConfigured,
} from '@/lib/leads/booked-billing';
import { listBilledLeadsForClient, updateLead } from '@/lib/leads/store';
import type { ErLead, LeadStatus } from '@/lib/leads/types';

const STRIPE_API = 'https://api.stripe.com/v1';

async function billingCustomerForClient(clientId: string | null) {
  if (!clientId) return { stripeCustomerId: null, plan: null };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_customers')
    .select('stripe_customer_id, plan')
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load receptionist client: ${error.message}`);
  return {
    stripeCustomerId: (data?.stripe_customer_id as string | null | undefined)?.trim() || null,
    plan: ((data?.plan as string | null | undefined) || '').toLowerCase() || null,
  };
}

async function postStripeForm(path: string, params: URLSearchParams) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return { ok: false as const, error: 'STRIPE_SECRET_KEY is not set' };
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: params.toString(),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string }; id?: string };
  if (!response.ok) {
    return { ok: false as const, error: data.error?.message || `Stripe returned ${response.status}` };
  }
  return { ok: true as const, id: data.id };
}

export async function sendBookedJobStripeAction(input: {
  action: { type: 'meter' | 'invoice_item' | 'skip'; cents?: number; value?: number };
  stripeCustomerId: string;
  leadId: string;
}) {
  if (input.action.type === 'skip') return { ok: true as const, skipped: true as const };
  if (input.action.type === 'meter') {
    const params = new URLSearchParams();
    params.set('event_name', 'booked_job');
    params.set('payload[stripe_customer_id]', input.stripeCustomerId);
    params.set('payload[value]', String(input.action.value ?? 1));
    params.set('identifier', `er_lead_${input.leadId}`);
    const result = await postStripeForm('/billing/meter_events', params);
    return result.ok ? { ok: true as const, skipped: false as const, id: result.id } : result;
  }
  const params = new URLSearchParams();
  params.set('customer', input.stripeCustomerId);
  params.set('currency', 'usd');
  params.set('amount', String(input.action.cents ?? 2200));
  params.set('description', 'Booked job monthly cap remainder');
  params.set('metadata[lead_id]', input.leadId);
  const result = await postStripeForm('/invoiceitems', params);
  return result.ok ? { ok: true as const, skipped: false as const, id: result.id } : result;
}

export async function applyBookedLead(lead: ErLead) {
  const billed = await listBilledLeadsForClient({
    clientId: lead.client_id,
    ownerId: lead.owner_id,
    businessId: lead.business_id,
  });
  const plan = planBookedLeadBilling({
    lead,
    jobsAlreadyInPeriod: countBilledJobsInPeriod(billed),
    priceConfigured: stripeBookedJobPriceConfigured(),
  });

  if (plan.type === 'already_booked' || plan.type === 'online_booking') {
    if (lead.status === 'Booked' && lead.booked_at) return { lead, billing: plan };
    const now = new Date().toISOString();
    const updated = await updateLead(lead.id, {
      status: 'Booked' as LeadStatus,
      booked_at: lead.booked_at ?? now,
      billing_skipped: true,
      billing_skip_reason: plan.type === 'online_booking' ? 'online_booking' : lead.billing_skip_reason,
    });
    return { lead: updated, billing: plan };
  }

  if (plan.type === 'missing_price_id') {
    console.info(
      'STRIPE_AVA_BOOKED_JOB_PRICE_ID is unset; booked lead %s was not metered.',
      lead.id,
    );
    const now = new Date().toISOString();
    const updated = await updateLead(lead.id, {
      status: 'Booked' as LeadStatus,
      booked_at: lead.booked_at ?? now,
      billing_skipped: true,
      billing_skip_reason: 'missing_price_id',
    });
    return { lead: updated, billing: plan };
  }

  if (plan.action.type === 'skip') {
    const now = new Date().toISOString();
    const updated = await updateLead(lead.id, {
      status: 'Booked' as LeadStatus,
      booked_at: lead.booked_at ?? now,
      billing_skipped: true,
      billing_skip_reason: 'monthly_cap',
    });
    return { lead: updated, billing: plan };
  }

  const billingCustomer = await billingCustomerForClient(lead.client_id);
  // Online Store customers pay $1 per handled call (store_call meter), never $25 per booked job.
  if (billingCustomer.plan === STORE_PLAN_KEY) {
    const now = new Date().toISOString();
    const updated = await updateLead(lead.id, {
      status: 'Booked' as LeadStatus,
      booked_at: lead.booked_at ?? now,
      billing_skipped: true,
      billing_skip_reason: 'store_plan',
    });
    return { lead: updated, billing: { type: 'store_plan' as const, action: plan.action } };
  }
  const stripeCustomerId = billingCustomer.stripeCustomerId;
  if (!stripeCustomerId) {
    console.info('No Stripe customer on file; booked lead %s was not metered.', lead.id);
    const now = new Date().toISOString();
    const updated = await updateLead(lead.id, {
      status: 'Booked' as LeadStatus,
      booked_at: lead.booked_at ?? now,
      billing_skipped: true,
      billing_skip_reason: 'missing_stripe_customer',
    });
    return { lead: updated, billing: { type: 'missing_stripe_customer' as const, action: plan.action } };
  }

  const sent = await sendBookedJobStripeAction({
    action: plan.action,
    stripeCustomerId,
    leadId: lead.id,
  });
  if (!sent.ok) {
    throw new Error(sent.error);
  }

  const now = new Date().toISOString();
  const updated = await updateLead(lead.id, {
    status: 'Booked' as LeadStatus,
    booked_at: lead.booked_at ?? now,
    billed_at: now,
    billing_skipped: false,
    billing_skip_reason: null,
  });
  return { lead: updated, billing: plan };
}

export async function applyLeadPatch(lead: ErLead, patch: { status?: LeadStatus; notes?: string }) {
  if (patch.status === 'Booked') {
    const booked = await applyBookedLead(lead);
    if (patch.notes === undefined) return booked;
    const updated = await updateLead(booked.lead.id, { notes: patch.notes });
    return { lead: updated, billing: booked.billing };
  }

  const next: Record<string, unknown> = {};
  if (patch.status) next.status = patch.status;
  if (patch.notes !== undefined) next.notes = patch.notes;
  const updated = await updateLead(lead.id, next);
  return { lead: updated, billing: null };
}
