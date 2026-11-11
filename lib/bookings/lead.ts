import type { ErLead } from '@/lib/leads/types';

export function onlineBookingLeadPayload(input: {
  ownerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceName: string;
  businessName: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  depositCents: number;
  appointmentId: string;
}) {
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(input.startAt));
  const deposit = (input.depositCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  return {
    owner_id: input.ownerId,
    client_id: null as string | null,
    business_id: null as string | null,
    caller_name: input.customerName || null,
    caller_phone: input.customerPhone || null,
    job_type: input.serviceName,
    summary: `${input.customerName || 'A customer'} booked ${input.serviceName} at ${input.businessName} for ${when}. Deposit paid: ${deposit}.${input.customerEmail ? ` Email: ${input.customerEmail}.` : ''}`,
    called_at: input.startAt,
    source: 'online booking' as const,
    status: 'Booked' as const,
    notes: '',
    booked_at: new Date().toISOString(),
    billed_at: null as string | null,
    billing_skipped: true,
    billing_skip_reason: 'online_booking',
    conversation_id: `booking:${input.appointmentId}`,
  };
}

export function isReceptionistMeterable(lead: Pick<ErLead, 'source' | 'billing_skip_reason'>) {
  return lead.source !== 'online booking' && lead.billing_skip_reason !== 'online_booking';
}
