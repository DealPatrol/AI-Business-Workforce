import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmails } from '@/lib/bookings/mail';
import {
  confirmAppointment,
  getAppointment,
  getAppointmentBySession,
  getBusinessById,
  getService,
  listBlockingAppointments,
  releaseHold,
} from '@/lib/bookings/store';
import { slotStillOpen } from '@/lib/bookings/slots';
import { verifyStripeSignature, workforceWebhookSecret } from '@/lib/bookings/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  const secret = workforceWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Workforce Stripe webhook is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const event = asRecord(JSON.parse(rawBody || '{}'));
  const type = asString(event.type);
  const session = asRecord(asRecord(event.data).object);
  const sessionId = asString(session.id);
  const metadata = asRecord(session.metadata);
  const bookingId = asString(metadata.booking_id) || asString(session.client_reference_id);
  if (asString(metadata.product) && asString(metadata.product) !== 'workforce_booking') {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    if (type === 'checkout.session.expired' && bookingId) {
      await releaseHold(bookingId);
      return NextResponse.json({ received: true });
    }

    if (type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const appointment =
      (bookingId ? await getAppointment(bookingId) : null) ||
      (sessionId ? await getAppointmentBySession(sessionId) : null);
    if (!appointment) return NextResponse.json({ received: true, missing: true });
    if (appointment.status === 'confirmed') return NextResponse.json({ received: true, duplicate: true });

    const business = await getBusinessById(appointment.business_id);
    const service = await getService(appointment.service_id);
    if (!business || !service) return NextResponse.json({ received: true, missing: true });

    const existing = (await listBlockingAppointments(business.id)).filter((row) => row.startAt !== appointment.start_at || row.endAt !== appointment.end_at);
    const stillFree = slotStillOpen({
      startAt: appointment.start_at,
      endAt: appointment.end_at,
      existing,
    });
    if (!stillFree && appointment.status !== 'held') {
      console.error('Paid workforce booking conflicts with another confirmed slot', appointment.id);
      return NextResponse.json({ received: true, conflict: true });
    }

    const paymentIntent = asString(session.payment_intent);
    const confirmed = await confirmAppointment({
      appointment,
      business,
      service,
      paymentIntentId: paymentIntent || null,
    });
    try {
      await sendBookingConfirmationEmails({
        business,
        service,
        appointment: confirmed.appointment,
      });
    } catch (error) {
      console.error('Booking confirmation email failed', error);
    }
    return NextResponse.json({ received: true, leadId: confirmed.leadId });
  } catch (error) {
    console.error('Workforce Stripe webhook failed', error);
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }
}
