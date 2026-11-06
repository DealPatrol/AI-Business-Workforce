import { escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import type { BookingAppointment, BookingBusiness, BookingService } from '@/lib/bookings/store';

export function workforceFromAddress() {
  const raw = process.env.AVA_FROM_EMAIL?.trim() || 'onboarding@resend.dev';
  if (raw.includes('<') && raw.includes('>')) return raw;
  return `Front Porch Growth <${raw}>`;
}

function formatWhen(startAt: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(startAt));
}

function depositLabel(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function bookingConfirmationHtml(input: {
  greeting: string;
  businessName: string;
  serviceName: string;
  when: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deposit: string;
}) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b">
    <p>${escapeHtml(input.greeting)}</p>
    <p><b>${escapeHtml(input.businessName)}</b> — ${escapeHtml(input.serviceName)}</p>
    <p>${escapeHtml(input.when)}</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td><b>Name</b></td><td>${escapeHtml(input.customerName || '—')}</td></tr>
      <tr><td><b>Email</b></td><td>${escapeHtml(input.customerEmail || '—')}</td></tr>
      <tr><td><b>Phone</b></td><td>${escapeHtml(input.customerPhone || '—')}</td></tr>
      <tr><td><b>Deposit paid</b></td><td>${escapeHtml(input.deposit)}</td></tr>
    </table>
  </div>`;
}

export async function sendBookingConfirmationEmails(input: {
  business: BookingBusiness;
  service: BookingService;
  appointment: BookingAppointment;
}) {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.info('TODO: send booking confirmation email (RESEND_API_KEY unset)', {
      bookingId: input.appointment.id,
      customer: input.appointment.customer_email,
      owner: input.business.email,
    });
    return { sent: false, skipped: true as const };
  }

  const when = formatWhen(input.appointment.start_at, input.business.timezone || 'America/Chicago');
  const deposit = depositLabel(input.appointment.deposit_cents);
  const details = {
    businessName: input.business.name,
    serviceName: input.service.name,
    when,
    customerName: input.appointment.customer_name || '',
    customerEmail: input.appointment.customer_email || '',
    customerPhone: input.appointment.customer_phone || '',
    deposit,
  };

  const from = workforceFromAddress();
  if (input.appointment.customer_email) {
    await sendResendEmail({
      from,
      to: input.appointment.customer_email,
      subject: `You're booked at ${input.business.name}`,
      html: bookingConfirmationHtml({
        ...details,
        greeting: `Your appointment is confirmed.`,
      }),
    });
  }
  if (input.business.email) {
    await sendResendEmail({
      from,
      to: input.business.email,
      subject: `New booking — ${input.service.name}`,
      html: bookingConfirmationHtml({
        ...details,
        greeting: `A customer paid a deposit and booked a time.`,
      }),
    });
  }
  return { sent: true, skipped: false as const };
}
