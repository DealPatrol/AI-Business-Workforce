import { normalizeEmail } from '@/lib/analytics/contact';
import { AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';

const STRIPE_API = 'https://api.stripe.com/v1';

type StripeCheckoutSession = {
  metadata?: Record<string, string>;
  payment_link?: string | null;
  payment_status?: string;
  status?: string;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  subscription?: string | { id?: string; status?: string } | null;
};

type AvaCheckoutOutcome =
  | 'missing_session'
  | 'missing_secret'
  | 'stripe_error'
  | 'incomplete'
  | 'unpaid'
  | 'not_ava'
  | 'ok';

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

export type AvaCheckoutIdentity = AvaCheckoutVerification & {
  email: string;
  subscriptionStatus: string;
  recognizedAvaCheckout: boolean;
  outcome: AvaCheckoutOutcome;
};

function checkoutEmail(session: StripeCheckoutSession) {
  return normalizeEmail(session.customer_details?.email || session.customer_email || '');
}

function messageFor(outcome: AvaCheckoutOutcome, subscriptionStatus: string) {
  switch (outcome) {
    case 'missing_session':
      return 'Automatic creation needs a Stripe Checkout Session ID.';
    case 'missing_secret':
      return 'Automatic creation is waiting for Stripe verification credentials.';
    case 'stripe_error':
      return 'Stripe could not verify this Checkout Session.';
    case 'incomplete':
      return 'Stripe does not report this Checkout Session as complete.';
    case 'unpaid':
      return 'Stripe does not report this Checkout Session as paid or trialing.';
    case 'not_ava':
      return 'This session is not identified as Ava checkout; use Cole’s manual trigger after review.';
    case 'ok':
      return subscriptionStatus === 'trialing'
        ? 'Stripe confirmed a trialing Ava Checkout Session.'
        : 'Stripe confirmed a paid Ava Checkout Session.';
    default: {
      const unexpected: never = outcome;
      throw new Error(`Unexpected Ava checkout outcome: ${unexpected}`);
    }
  }
}

function identityFrom(
  outcome: AvaCheckoutOutcome,
  extras?: { email?: string; subscriptionStatus?: string; recognizedAvaCheckout?: boolean },
): AvaCheckoutIdentity {
  const subscriptionStatus = extras?.subscriptionStatus || '';
  return {
    outcome,
    verified: outcome === 'ok',
    message: messageFor(outcome, subscriptionStatus),
    email: extras?.email || '',
    subscriptionStatus,
    recognizedAvaCheckout: Boolean(extras?.recognizedAvaCheckout),
  };
}

export async function readAvaCheckoutIdentity(sessionId: string): Promise<AvaCheckoutIdentity> {
  if (!sessionId) return identityFrom('missing_session');

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return identityFrom('missing_secret');

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
  const email = checkoutEmail(session);

  if (!response.ok) return identityFrom('stripe_error', { email });

  if (session.status !== 'complete') return identityFrom('incomplete', { email });

  const paymentAccepted =
    session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const subscriptionStatus = await readSubscriptionStatus(secret, subscriptionIdOf(session));
  const trialingOrActive = ACCEPTABLE_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  // Trials often complete with payment_status "no_payment_required" or, less often, "unpaid"
  // while the subscription itself is "trialing". Either a collected payment or a live trial counts.
  if (!paymentAccepted && !trialingOrActive) {
    return identityFrom('unpaid', { email, subscriptionStatus });
  }

  const checkoutPlan = session.metadata?.plan?.toLowerCase() || '';
  const avaPaymentLinkId = process.env.AVA_STRIPE_PAYMENT_LINK_ID;
  const recognizedAvaCheckout =
    Boolean(checkoutPlan && isAvaPlanKey(checkoutPlan) && AVA_PLANS[checkoutPlan]) ||
    Boolean(avaPaymentLinkId && session.payment_link === avaPaymentLinkId);

  if (!recognizedAvaCheckout) {
    return identityFrom('not_ava', { email, subscriptionStatus });
  }

  return identityFrom('ok', { email, subscriptionStatus, recognizedAvaCheckout: true });
}

export async function verifyAvaCheckoutSession(
  sessionId: string,
): Promise<AvaCheckoutVerification> {
  const identity = await readAvaCheckoutIdentity(sessionId);
  return { verified: identity.verified, message: identity.message };
}
