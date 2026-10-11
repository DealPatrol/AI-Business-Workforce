import { createAdminClient } from '@/lib/supabase/admin';

export type AvaCustomerRecord = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  email: string | null;
  name: string | null;
  business_name: string | null;
  plan: string | null;
  included_minutes: number | null;
  overage_cents: number | null;
  subscription_status: string;
  product: string;
  onboarding_id: string | null;
  buyer_onboarding_email_sent_at: string | null;
  owner_checkout_email_sent_at: string | null;
};

export type AvaCustomerWrite = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  email?: string;
  name?: string;
  businessName?: string;
  plan?: string;
  includedMinutes?: number | null;
  overageCents?: number | null;
  subscriptionStatus?: string;
  product?: string;
};

type CustomerPatch = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_checkout_session_id?: string | null;
  email?: string | null;
  name?: string | null;
  business_name?: string | null;
  plan?: string | null;
  included_minutes?: number | null;
  overage_cents?: number | null;
  subscription_status?: string;
  product?: string;
};

function clean(value: string | undefined) {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

function preferText(next: string | undefined, current: string | null | undefined) {
  return clean(next) ?? current ?? null;
}

async function findExistingCustomer(input: AvaCustomerWrite) {
  const supabase = createAdminClient();
  const clauses = [
    input.stripeCheckoutSessionId
      ? `stripe_checkout_session_id.eq.${input.stripeCheckoutSessionId}`
      : '',
    input.stripeSubscriptionId ? `stripe_subscription_id.eq.${input.stripeSubscriptionId}` : '',
    input.stripeCustomerId ? `stripe_customer_id.eq.${input.stripeCustomerId}` : '',
  ].filter(Boolean);

  if (clauses.length === 0) return null;

  const { data, error } = await supabase
    .from('ava_customers')
    .select('*')
    .or(clauses.join(','))
    .limit(1);
  if (error) throw new Error(`Unable to load Ava customer: ${error.message}`);
  return ((data && data[0]) as AvaCustomerRecord | undefined) ?? null;
}

function buildPatch(input: AvaCustomerWrite, existing: AvaCustomerRecord | null): CustomerPatch {
  const patch: CustomerPatch = {
    stripe_customer_id: preferText(input.stripeCustomerId, existing?.stripe_customer_id),
    stripe_subscription_id: preferText(input.stripeSubscriptionId, existing?.stripe_subscription_id),
    stripe_checkout_session_id: preferText(
      input.stripeCheckoutSessionId,
      existing?.stripe_checkout_session_id,
    ),
    email: preferText(input.email, existing?.email),
    name: preferText(input.name, existing?.name),
    business_name: preferText(input.businessName, existing?.business_name),
    plan: preferText(input.plan, existing?.plan),
    product: preferText(input.product, existing?.product) || 'ava',
    subscription_status:
      clean(input.subscriptionStatus) || existing?.subscription_status || 'incomplete',
  };

  if (typeof input.includedMinutes === 'number' && Number.isFinite(input.includedMinutes)) {
    patch.included_minutes = Math.round(input.includedMinutes);
  } else if (!existing) {
    patch.included_minutes = null;
  }

  if (typeof input.overageCents === 'number' && Number.isFinite(input.overageCents)) {
    patch.overage_cents = Math.round(input.overageCents);
  } else if (!existing) {
    patch.overage_cents = null;
  }

  return patch;
}

export async function upsertAvaCustomer(input: AvaCustomerWrite) {
  const supabase = createAdminClient();
  const existing = await findExistingCustomer(input);
  const patch = buildPatch(input, existing);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from('ava_customers')
      .update({ ...patch, updated_at: now })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error(`Unable to update Ava customer: ${error.message}`);
    return data as AvaCustomerRecord;
  }

  const { data, error } = await supabase
    .from('ava_customers')
    .insert({ ...patch, updated_at: now })
    .select('*')
    .single();

  if (error && error.code === '23505') {
    const raced = await findExistingCustomer(input);
    if (!raced) throw new Error(`Unable to save Ava customer: ${error.message}`);
    const { data: updated, error: updateError } = await supabase
      .from('ava_customers')
      .update({ ...buildPatch(input, raced), updated_at: now })
      .eq('id', raced.id)
      .select('*')
      .single();
    if (updateError) throw new Error(`Unable to update Ava customer: ${updateError.message}`);
    return updated as AvaCustomerRecord;
  }

  if (error) throw new Error(`Unable to save Ava customer: ${error.message}`);
  return data as AvaCustomerRecord;
}

/** Status sync for a subscription we already stored. Does not create founding-plan rows. */
export async function syncExistingAvaSubscription(input: AvaCustomerWrite) {
  const existing = await findExistingCustomer(input);
  if (!existing || (existing.product && existing.product !== 'ava')) return null;
  return upsertAvaCustomer(input);
}

export async function markAvaCustomerNotified(
  id: string,
  column: 'buyer_onboarding_email_sent_at' | 'owner_checkout_email_sent_at',
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('ava_customers')
    .update({ [column]: now, updated_at: now })
    .eq('id', id);
  if (error) throw new Error(`Unable to record Ava customer notification: ${error.message}`);
}

/** Best-effort link so a missing migration does not block the onboarding form. */
export async function linkAvaCustomerToOnboarding(input: {
  sessionId: string;
  onboardingId: string;
  businessName: string;
}) {
  if (!input.sessionId) return;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('ava_customers')
      .update({
        onboarding_id: input.onboardingId,
        business_name: input.businessName,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', input.sessionId);
    if (error) {
      console.error('Unable to link Ava customer to onboarding', error.message);
    }
  } catch (error) {
    console.error('Unable to link Ava customer to onboarding', error);
  }
}

export async function webhookEventProcessed(source: string, eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_webhook_events')
    .select('id')
    .eq('id', `${source}:${eventId}`)
    .maybeSingle();
  if (error) throw new Error(`Unable to read webhook event: ${error.message}`);
  return Boolean(data);
}

export async function recordWebhookEvent(source: string, eventId: string, eventType: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_webhook_events').upsert({
    id: `${source}:${eventId}`,
    source,
    event_type: eventType,
  });
  if (error) throw new Error(`Unable to record webhook event: ${error.message}`);
}
