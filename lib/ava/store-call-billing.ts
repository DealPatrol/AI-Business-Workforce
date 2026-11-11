import { STORE_CALL_EVENT_NAME, STORE_PLAN_KEY } from '@/lib/ava/store-pricing';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';

/**
 * $1-per-call metering for the Online Store plan.
 *
 * Called from the ElevenLabs post-call webhook (lib/ava/post-call-lead.ts) after a
 * store customer's call is saved. One `store_call` meter event per conversation,
 * with identifier `store_call_<conversation_id>` so webhook retries never double-bill.
 *
 * Billed only when:
 *  - the customer is on plan=store with a Stripe customer id,
 *  - the subscription is active or past_due (trial calls are free; canceled is never billed),
 *  - the caller actually spoke (hang-ups before anyone speaks are not handled calls).
 */
export type StoreCallTurn = { role: string; message: string };

export type StoreCallCustomer = {
  plan: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
};

/** Spam, sales pitches, robocalls and wrong numbers are never billed. */
export function isJunkCallType(callType: string | null | undefined) {
  return /spam|sales|solicit|robo|telemarket|wrong[\s_-]*number/i.test(callType || '');
}

export type StoreCallDecision =
  | { bill: true; stripeCustomerId: string; identifier: string }
  | {
      bill: false;
      reason: 'not_store' | 'no_stripe_customer' | 'trialing' | 'inactive' | 'caller_never_spoke' | 'junk_call' | 'missing_conversation';
    };

const BILLABLE_STATUSES = new Set(['active', 'past_due']);

export function callerSpoke(transcript: StoreCallTurn[]) {
  return transcript.some((turn) => turn.role === 'user' && turn.message.trim().length > 0);
}

export function decideStoreCallMeter(input: {
  customer: StoreCallCustomer | null;
  conversationId: string;
  transcript: StoreCallTurn[];
  callType?: string | null;
}): StoreCallDecision {
  const customer = input.customer;
  if (!customer || (customer.plan || '').toLowerCase() !== STORE_PLAN_KEY) return { bill: false, reason: 'not_store' };
  const conversationId = input.conversationId.trim();
  if (!conversationId) return { bill: false, reason: 'missing_conversation' };
  const stripeCustomerId = customer.stripe_customer_id?.trim() || '';
  if (!stripeCustomerId) return { bill: false, reason: 'no_stripe_customer' };
  const status = (customer.subscription_status || '').toLowerCase();
  if (status === 'trialing') return { bill: false, reason: 'trialing' };
  if (!BILLABLE_STATUSES.has(status)) return { bill: false, reason: 'inactive' };
  if (!callerSpoke(input.transcript)) return { bill: false, reason: 'caller_never_spoke' };
  if (isJunkCallType(input.callType)) return { bill: false, reason: 'junk_call' };
  return { bill: true, stripeCustomerId, identifier: `${STORE_CALL_EVENT_NAME}_${conversationId}`.slice(0, 100) };
}

export function storeCallMeterParams(stripeCustomerId: string, identifier: string, timestampSecs?: number) {
  const params = new URLSearchParams();
  params.set('event_name', STORE_CALL_EVENT_NAME);
  params.set('payload[stripe_customer_id]', stripeCustomerId);
  params.set('payload[value]', '1');
  params.set('identifier', identifier);
  if (timestampSecs) params.set('timestamp', String(Math.floor(timestampSecs)));
  return params;
}

/** Sends one `store_call` meter event. Never throws; a duplicate identifier counts as already billed. */
export async function reportStoreCall(stripeCustomerId: string, identifier: string) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return { ok: false as const, error: 'STRIPE_SECRET_KEY is not set' };
  try {
    const response = await fetch('https://api.stripe.com/v1/billing/meter_events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_API_VERSION,
      },
      body: storeCallMeterParams(stripeCustomerId, identifier).toString(),
      cache: 'no-store',
    });
    if (response.ok) return { ok: true as const, duplicate: false };
    const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    const message = data.error?.message || `Stripe returned ${response.status}`;
    if (/identifier/i.test(message) && /(already|duplicate|exists)/i.test(message)) {
      return { ok: true as const, duplicate: true };
    }
    return { ok: false as const, error: message };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Stripe request failed' };
  }
}

export async function meterStoreCall(input: {
  customer: StoreCallCustomer | null;
  conversationId: string;
  transcript: StoreCallTurn[];
  callType?: string | null;
}) {
  const decision = decideStoreCallMeter(input);
  if (!decision.bill) return { metered: false as const, reason: decision.reason };
  const sent = await reportStoreCall(decision.stripeCustomerId, decision.identifier);
  if (!sent.ok) {
    console.error('Store call meter event failed for %s: %s', input.conversationId, sent.error);
    return { metered: false as const, reason: 'stripe_error' as const };
  }
  return { metered: true as const, duplicate: sent.duplicate };
}
