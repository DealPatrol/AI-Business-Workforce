import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';

/**
 * Stripe webhook receiver for Ava / YardProof billing events.
 *
 * Production steps (manual — secrets never committed):
 * 1. Stripe Dashboard → Developers → Webhooks → Add endpoint
 *    URL: https://<your-domain>/api/webhooks/stripe
 * 2. Subscribe at minimum to:
 *    - checkout.session.completed
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - invoice.paid
 *    - invoice.payment_failed
 * 3. Copy the signing secret into Vercel as STRIPE_WEBHOOK_SECRET (whsec_...)
 *
 * This route verifies signatures and acknowledges events. It does not yet mutate
 * onboarding rows or auto-provision agents — Cole/ops still use the runbook and
 * `/api/ava/billing/reconcile` for usage. Expand handlers only after Dashboard
 * endpoint + secret are live.
 */

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};

function readHeader(req: NextRequest, name: string) {
  return req.headers.get(name) || req.headers.get(name.toLowerCase()) || '';
}

function parseStripeSignature(header: string) {
  const parts = header.split(',').map((part) => part.trim());
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value || '';
    if (key === 'v1' && value) signatures.push(value);
  }
  return { timestamp, signatures };
}

function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(header);
  if (!timestamp || signatures.length === 0) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');

  return signatures.some((signature) => {
    const actualBuf = Buffer.from(signature, 'utf8');
    if (actualBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(actualBuf, expectedBuf);
  });
}

function summarizeAvaSession(object: Record<string, unknown> | undefined) {
  if (!object) return null;
  const metadata = (object.metadata || {}) as Record<string, string>;
  if (metadata.product && metadata.product !== 'ava') {
    return { product: metadata.product, skipped: true as const };
  }
  return {
    product: metadata.product || 'unknown',
    plan: metadata.plan || null,
    sessionId: typeof object.id === 'string' ? object.id : null,
    customer: typeof object.customer === 'string' ? object.customer : null,
    subscription:
      typeof object.subscription === 'string'
        ? object.subscription
        : object.subscription && typeof object.subscription === 'object' && 'id' in object.subscription
          ? String((object.subscription as { id?: string }).id || '')
          : null,
    paymentStatus: typeof object.payment_status === 'string' ? object.payment_status : null,
    status: typeof object.status === 'string' ? object.status : null,
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting Stripe webhook.');
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured.' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = readHeader(req, 'stripe-signature');
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const type = event.type || 'unknown';
  const object = event.data?.object;

  switch (type) {
    case 'checkout.session.completed': {
      const summary = summarizeAvaSession(object);
      console.info('stripe.webhook.checkout.session.completed', {
        eventId: event.id,
        apiVersion: STRIPE_API_VERSION,
        summary,
      });
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const metadata = (object?.metadata || {}) as Record<string, string>;
      console.info(`stripe.webhook.${type}`, {
        eventId: event.id,
        objectId: typeof object?.id === 'string' ? object.id : null,
        product: metadata.product || null,
        plan: metadata.plan || null,
        status: typeof object?.status === 'string' ? object.status : null,
      });
      break;
    }
    default: {
      console.info('stripe.webhook.unhandled', { eventId: event.id, type });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
