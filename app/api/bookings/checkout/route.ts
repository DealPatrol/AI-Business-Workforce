import { NextRequest, NextResponse } from 'next/server';
import {
  attachCheckoutSession,
  createHold,
  getBusinessBySlug,
  getService,
  listBlockingAppointments,
  releaseHold,
} from '@/lib/bookings/store';
import { depositCents, MIN_DEPOSIT_CENTS, slotStillOpen } from '@/lib/bookings/slots';
import { asTrimmedString } from '@/lib/leads/parse';
import { createRateLimiter } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site-url';
import {
  buildDepositCheckoutParams,
  createWorkforceCheckoutSession,
  stripeExpiresAtUnix,
  workforceStripeSecret,
} from '@/lib/bookings/stripe';

const takeCheckout = createRateLimiter(20, 60_000);

export async function POST(request: NextRequest) {
  const limit = takeCheckout(request.headers.get('x-forwarded-for') || 'booking-checkout');
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (!workforceStripeSecret()) {
    return NextResponse.json({ error: 'Workforce deposit checkout is not configured.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = asTrimmedString(body.slug);
  const serviceId = asTrimmedString(body.serviceId);
  const startAt = asTrimmedString(body.startAt);
  const customerName = asTrimmedString(body.name);
  const customerEmail = asTrimmedString(body.email);
  const customerPhone = asTrimmedString(body.phone);
  if (!slug || !serviceId || !startAt || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Name, email, service, and time are required.' }, { status: 400 });
  }

  try {
    const business = await getBusinessBySlug(slug);
    if (!business) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const service = await getService(serviceId);
    if (!service || service.business_id !== business.id || !service.active) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    const start = new Date(startAt);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: 'That time is not valid.' }, { status: 400 });
    }
    const end = new Date(start.getTime() + service.duration_minutes * 60_000);
    const existing = await listBlockingAppointments(business.id);
    if (!slotStillOpen({ startAt: start.toISOString(), endAt: end.toISOString(), existing })) {
      return NextResponse.json({ error: 'That time was just taken. Pick another slot.' }, { status: 409 });
    }

    const amount = depositCents({
      priceCents: service.price_cents,
      depositCents: service.deposit_cents,
      depositPercent: service.deposit_percent,
    });
    if (amount < MIN_DEPOSIT_CENTS) {
      return NextResponse.json({ error: 'This service does not have a payable deposit yet.' }, { status: 400 });
    }

    const hold = await createHold({
      businessId: business.id,
      serviceId: service.id,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      customerName,
      customerEmail,
      customerPhone,
      depositCents: amount,
    });

    const origin = getSiteUrl().replace(/\/$/, '');
    const session = await createWorkforceCheckoutSession(
      buildDepositCheckoutParams({
        origin,
        slug: business.slug,
        bookingId: hold.id,
        serviceName: service.name,
        businessName: business.name,
        depositCents: amount,
        customerEmail,
        expiresAtUnix: stripeExpiresAtUnix(),
      }),
    );
    if (!session.id || !session.url) {
      await releaseHold(hold.id);
      return NextResponse.json({ error: session.error || 'Could not start deposit checkout.' }, { status: 503 });
    }
    await attachCheckoutSession(hold.id, session.id);
    return NextResponse.json({ url: session.url, bookingId: hold.id });
  } catch (error) {
    console.error('Unable to start booking checkout', error);
    return NextResponse.json({ error: 'Checkout could not be started right now.' }, { status: 503 });
  }
}
