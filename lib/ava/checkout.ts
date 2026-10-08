import { AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';

const STRIPE_API = 'https://api.stripe.com/v1';

type StripeCheckoutSession = {
  metadata?: Record<string, string>;
  payment_link?: string | null;
  payment_status?: string;
  status?: string;
  subscription?: string | { id?: string; status?: string } | null;
};

const ACCEPTABLE_SUBSCRIPTION_STATUSES = new Set(['trialing', 'active']);

function subscriptionIdOf(session: StripeCheckoutSession) {
  if (typeof session.subscription === 'string') return session.subscription;
  if (session.subscription && typeof session.subscription.id === 'string') return session.subscription.id;
  return '';
}

async function readSubscriptionStatus(secret: string, subscriptionId: string) {
  if (!subscriptionId) return '';
  const response = await fetch(
    `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': '2026-07-29.dahlia',
      },
      cache: 'no-store',
    },
  );
  const subscription = (await response.json().catch(() => ({}))) as { status?: string };
  if (!response.ok) return '';
  return subscription.status || '';
}

export type AvaCheckoutVerification = {
  verified: boolean;
  message: string;
};

export async function verifyAvaCheckoutSession(
  sessionId: string,
): Promise<AvaCheckoutVerification> {
  if (!sessionId) {
    return {
      verified: false,
      message: 'Automatic creation needs a Stripe Checkout Session ID.',
    };
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      verified: false,
      message: 'Automatic creation is waiting for Stripe verification credentials.',
    };
  }

  const response = await fetch(
    `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': '2026-07-29.dahlia',
      },
      cache: 'no-store',
    },
  );
  const session = (await response.json().catch(() => ({}))) as StripeCheckoutSession;

  if (!response.ok) {
    return {
      verified: false,
      message: 'Stripe could not verify this Checkout Session.',
    };
  }

  if (session.status !== 'complete') {
    return {
      verified: false,
      message: 'Stripe does not report this Checkout Session as complete.',
    };
  }

  const paymentAccepted =
    session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const subscriptionStatus = await readSubscriptionStatus(secret, subscriptionIdOf(session));
  const trialingOrActive = ACCEPTABLE_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  // Trials often complete with payment_status "no_payment_required" or, less often, "unpaid"
  // while the subscription itself is "trialing". Either a collected payment or a live trial counts.
  if (!paymentAccepted && !trialingOrActive) {
    return {
      verified: false,
      message: 'Stripe does not report this Checkout Session as paid or trialing.',
    };
  }

  const checkoutPlan = session.metadata?.plan?.toLowerCase() || '';
  const avaPaymentLinkId = process.env.AVA_STRIPE_PAYMENT_LINK_ID;
  const recognizedAvaCheckout =
    Boolean(checkoutPlan && isAvaPlanKey(checkoutPlan) && AVA_PLANS[checkoutPlan]) ||
    Boolean(avaPaymentLinkId && session.payment_link === avaPaymentLinkId);

  if (!recognizedAvaCheckout) {
    return {
      verified: false,
      message:
        'This session is not identified as Ava checkout; use Cole’s manual trigger after review.',
    };
  }

  return {
    verified: true,
    message:
      subscriptionStatus === 'trialing'
        ? 'Stripe confirmed a trialing Ava Checkout Session.'
        : 'Stripe confirmed a paid Ava Checkout Session.',
  };
}
