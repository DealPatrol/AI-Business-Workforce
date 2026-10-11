import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { AVA_PLANS, isAvaPlanKey } from '@/lib/ava/pricing';
import {
  markAvaCustomerNotified,
  recordWebhookEvent,
  syncExistingAvaSubscription,
  upsertAvaCustomer,
  webhookEventProcessed,
  type AvaCustomerRecord,
} from '@/lib/ava/customers';
import {
  avaOnboardingUrl,
  avaOwnerEmail,
  escapeHtml,
  sendResendEmail,
} from '@/lib/ava/mail';
import { STRIPE_API_VERSION } from '@/lib/stripe-checkout';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function stripeId(value: unknown) {
  if (typeof value === 'string') return value;
  return asString(asRecord(value).id);
}

function asMetadata(value: unknown) {
  const record = asRecord(value);
  const metadata: Record<string, string> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === 'string') metadata[key] = entry;
    else if (typeof entry === 'number' && Number.isFinite(entry)) metadata[key] = String(entry);
  }
  return metadata;
}

function readCount(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

function customerEmail(object: Record<string, unknown>) {
  const details = asRecord(object.customer_details);
  return asString(details.email) || asString(object.customer_email);
}

function customerName(object: Record<string, unknown>) {
  const details = asRecord(object.customer_details);
  return asString(details.name);
}

async function notifyCheckout(customer: AvaCustomerRecord, sessionId: string) {
  const planKey = customer.plan && isAvaPlanKey(customer.plan) ? customer.plan : null;
  const plan = planKey ? AVA_PLANS[planKey] : null;
  const link = avaOnboardingUrl(sessionId, customer.plan || undefined);
  const planLabel = plan?.label || customer.plan || 'Ava';
  const priceLabel = plan?.monthlyLabel || '';
  const minutes = customer.included_minutes ?? plan?.minutes;

  if (customer.email && !customer.buyer_onboarding_email_sent_at) {
    await sendResendEmail({
      to: customer.email,
      subject: `Finish setting up Ava ${planLabel}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b"><h1>Your Ava trial is started</h1><p>Thanks for starting Ava ${escapeHtml(planLabel)}${priceLabel ? ` (${escapeHtml(priceLabel)}/mo after the 7-day trial)` : ''}. Setup fee is $0.</p><p><a href="${escapeHtml(link)}">Finish setup</a> so we can build your receptionist from your hours, services, and call rules.</p><p>Cole attaches the phone number after you submit the form. Ava is not answering your business line until that number is connected and you pass a test call.</p></div>`,
    });
    await markAvaCustomerNotified(customer.id, 'buyer_onboarding_email_sent_at');
    customer.buyer_onboarding_email_sent_at = new Date().toISOString();
  } else if (!customer.email && !customer.buyer_onboarding_email_sent_at) {
    await markAvaCustomerNotified(customer.id, 'buyer_onboarding_email_sent_at');
    customer.buyer_onboarding_email_sent_at = new Date().toISOString();
  }

  if (!customer.owner_checkout_email_sent_at) {
    await sendResendEmail({
      to: avaOwnerEmail(),
      replyTo: customer.email || undefined,
      subject: `New Ava checkout — ${planLabel}${customer.email ? ` — ${customer.email}` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b"><h1>New Ava checkout</h1><table style="border-collapse:collapse;width:100%"><tr><td><b>Plan</b></td><td>${escapeHtml(planLabel)}</td></tr><tr><td><b>Status</b></td><td>${escapeHtml(customer.subscription_status)}</td></tr><tr><td><b>Included minutes</b></td><td>${escapeHtml(minutes == null ? 'Not on the session' : String(minutes))}</td></tr><tr><td><b>Buyer</b></td><td>${escapeHtml(customer.email || 'No email on the Checkout Session')}</td></tr><tr><td><b>Name</b></td><td>${escapeHtml(customer.name || 'Not provided')}</td></tr><tr><td><b>Session</b></td><td>${escapeHtml(sessionId)}</td></tr></table><p><a href="${escapeHtml(link)}">Onboarding link</a></p><p>Phone setup stays manual. Use <a href="https://github.com/DealPatrol/AI-Business-Workforce/blob/main/docs/AVA_PHONE_SETUP_RUNBOOK.md">docs/AVA_PHONE_SETUP_RUNBOOK.md</a> after they submit the form.</p></div>`,
    });
    await markAvaCustomerNotified(customer.id, 'owner_checkout_email_sent_at');
  }
}

async function handleCheckoutCompleted(object: Record<string, unknown>) {
  const metadata = asMetadata(object.metadata);
  if (metadata.product !== 'ava') {
    return { skipped: true as const };
  }

  const sessionId = asString(object.id);
  const fallbackStatus =
    object.payment_status === 'paid'
      ? 'active'
      : object.payment_status === 'no_payment_required'
        ? 'trialing'
        : 'incomplete';
  const subscriptionStatus = await readSubscriptionStatus(
    stripeId(object.subscription),
    fallbackStatus,
  );

  const customer = await upsertAvaCustomer({
    stripeCustomerId: stripeId(object.customer),
    stripeSubscriptionId: stripeId(object.subscription),
    stripeCheckoutSessionId: sessionId,
    email: customerEmail(object),
    name: customerName(object),
    plan: metadata.plan,
    includedMinutes: readCount(metadata.included_minutes),
    overageCents: readCount(metadata.overage_cents),
    subscriptionStatus,
    product: 'ava',
  });

  await notifyCheckout(customer, sessionId);
  return { skipped: false as const, customerId: customer.id };
}

async function readSubscriptionStatus(subscriptionId: string, fallback: string) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !subscriptionId) return fallback;
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': STRIPE_API_VERSION,
      },
      cache: 'no-store',
    },
  );
  const data = (await response.json().catch(() => ({}))) as { status?: string };
  if (!response.ok || !data.status) return fallback;
  return data.status;
}

async function handleSubscriptionChange(object: Record<string, unknown>, deleted: boolean) {
  const metadata = asMetadata(object.metadata);
  if (metadata.product && metadata.product !== 'ava') {
    return { skipped: true as const };
  }

  const subscriptionId = asString(object.id);
  const customerId = stripeId(object.customer);
  if (!subscriptionId && !customerId) return { skipped: true as const };

  const write = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan: metadata.plan,
    includedMinutes: readCount(metadata.included_minutes),
    overageCents: readCount(metadata.overage_cents),
    subscriptionStatus: deleted ? 'canceled' : asString(object.status) || 'incomplete',
    product: 'ava' as const,
  };

  const customer =
    metadata.product === 'ava'
      ? await upsertAvaCustomer(write)
      : await syncExistingAvaSubscription(write);
  if (!customer) return { skipped: true as const };
  return { skipped: false as const, customerId: customer.id };
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting Stripe webhook.');
    return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 503 });
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
  const eventId = event.id || '';
  const object = asRecord(event.data?.object);

  try {
    if (eventId && (await webhookEventProcessed('stripe', eventId))) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionChange(object, false);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(object, true);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed':
        break;
      default:
        break;
    }

    if (eventId) await recordWebhookEvent('stripe', eventId, type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler failed', error);
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }
}
