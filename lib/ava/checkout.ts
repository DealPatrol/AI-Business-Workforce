const STRIPE_API = 'https://api.stripe.com/v1';
const AVA_PLANS = new Set(['starter', 'growth', 'pro']);

type StripeCheckoutSession = {
  metadata?: Record<string, string>;
  payment_link?: string | null;
  payment_status?: string;
  status?: string;
};

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

  const paymentComplete =
    session.status === 'complete' &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
  if (!paymentComplete) {
    return {
      verified: false,
      message: 'Stripe does not report this Checkout Session as paid and complete.',
    };
  }

  const checkoutPlan = session.metadata?.plan?.toLowerCase();
  const avaPaymentLinkId = process.env.AVA_STRIPE_PAYMENT_LINK_ID;
  const recognizedAvaCheckout =
    Boolean(checkoutPlan && AVA_PLANS.has(checkoutPlan)) ||
    Boolean(avaPaymentLinkId && session.payment_link === avaPaymentLinkId);

  if (!recognizedAvaCheckout) {
    return {
      verified: false,
      message:
        'The paid session is not identified as Ava checkout; use Cole’s manual trigger after review.',
    };
  }

  return {
    verified: true,
    message: 'Stripe confirmed a paid Ava Checkout Session.',
  };
}
