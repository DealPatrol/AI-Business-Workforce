import { createHmac, timingSafeEqual } from 'crypto';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';

const STRIPE_API = 'https://api.stripe.com/v1';

export function workforceStripeSecret() {
  return process.env.STRIPE_WORKFORCE_SECRET_KEY?.trim() || '';
}

export function workforceWebhookSecret() {
  return process.env.STRIPE_WORKFORCE_WEBHOOK_SECRET?.trim() || '';
}

export function parseStripeSignature(header: string) {
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

export function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(header);
  if (!timestamp || signatures.length === 0 || !secret) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  return signatures.some((signature) => {
    const actualBuf = Buffer.from(signature, 'utf8');
    return actualBuf.length === expectedBuf.length && timingSafeEqual(actualBuf, expectedBuf);
  });
}

export function buildDepositCheckoutParams(input: {
  origin: string;
  slug: string;
  bookingId: string;
  serviceName: string;
  businessName: string;
  depositCents: number;
  customerEmail?: string;
  expiresAtUnix: number;
}) {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${input.origin}/book/${input.slug}/confirmed?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${input.origin}/book/${input.slug}?canceled=1`);
  params.set('expires_at', String(input.expiresAtUnix));
  params.set('client_reference_id', input.bookingId);
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(input.depositCents));
  params.set('line_items[0][price_data][product_data][name]', `Deposit — ${input.serviceName}`);
  params.set(
    'line_items[0][price_data][product_data][description]',
    `Appointment deposit for ${input.businessName}`,
  );
  params.set('metadata[product]', 'workforce_booking');
  params.set('metadata[booking_id]', input.bookingId);
  params.set('metadata[slug]', input.slug);
  params.set('payment_intent_data[metadata][product]', 'workforce_booking');
  params.set('payment_intent_data[metadata][booking_id]', input.bookingId);
  if (input.customerEmail) params.set('customer_email', input.customerEmail);
  return params;
}

export async function createWorkforceCheckoutSession(params: URLSearchParams) {
  const secret = workforceStripeSecret();
  if (!secret) return { error: 'Workforce Stripe is not configured.' };
  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: params.toString(),
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as { url?: string; id?: string; error?: { message?: string } };
  if (!response.ok || !data.url || !data.id) {
    return { error: data.error?.message || 'Could not start deposit checkout.' };
  }
  return { url: data.url, id: data.id };
}

/** Stripe Checkout expires_at must be at least 30 minutes from creation. */
export function stripeExpiresAtUnix(now = new Date()) {
  return Math.floor(now.getTime() / 1000) + 30 * 60;
}
