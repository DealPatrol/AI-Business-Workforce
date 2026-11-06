import { createAdminClient } from '@/lib/supabase/admin';
import { onlineBookingLeadPayload } from '@/lib/bookings/lead';
import { blockingBookings, generateSlots, holdExpiresAt } from '@/lib/bookings/slots';

export type BookingBusiness = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  email: string | null;
  timezone: string;
  published: boolean;
};

export type BookingService = {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number | null;
  deposit_percent: number | null;
  active: boolean;
};

export type BookingAppointment = {
  id: string;
  business_id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  status: string;
  hold_expires_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  deposit_cents: number;
  stripe_checkout_session_id: string | null;
  lead_id: string | null;
};

export async function getBusinessBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_businesses')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw new Error(`Unable to load booking page: ${error.message}`);
  return (data as BookingBusiness | null) ?? null;
}

export async function getBusinessById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('booking_businesses').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load booking business: ${error.message}`);
  return (data as BookingBusiness | null) ?? null;
}

export async function listBusinessesForOwner(ownerId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Unable to list booking pages: ${error.message}`);
  return (data ?? []) as BookingBusiness[];
}

export async function listServices(businessId: string, activeOnly = false) {
  const supabase = createAdminClient();
  let query = supabase.from('booking_services').select('*').eq('business_id', businessId).order('created_at');
  if (activeOnly) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to list services: ${error.message}`);
  return (data ?? []) as BookingService[];
}

export async function getService(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('booking_services').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load service: ${error.message}`);
  return (data as BookingService | null) ?? null;
}

export async function listHours(businessId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_weekly_hours')
    .select('*')
    .eq('business_id', businessId)
    .order('weekday');
  if (error) throw new Error(`Unable to load hours: ${error.message}`);
  return (data ?? []) as Array<{ weekday: number; start_time: string; end_time: string }>;
}

export async function listBlackouts(businessId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_blackouts')
    .select('*')
    .eq('business_id', businessId)
    .order('start_date');
  if (error) throw new Error(`Unable to load blackouts: ${error.message}`);
  return (data ?? []) as Array<{ id: string; start_date: string; end_date: string; note: string | null }>;
}

export async function listAppointments(businessId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select('*')
    .eq('business_id', businessId)
    .order('start_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(`Unable to load appointments: ${error.message}`);
  return (data ?? []) as BookingAppointment[];
}

export async function expireStaleHolds(businessId: string, now = new Date()) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('booking_appointments')
    .update({ status: 'expired', updated_at: now.toISOString() })
    .eq('business_id', businessId)
    .eq('status', 'held')
    .lt('hold_expires_at', now.toISOString());
  if (error) throw new Error(`Unable to expire booking holds: ${error.message}`);
}

export async function listBlockingAppointments(businessId: string, now = new Date()) {
  await expireStaleHolds(businessId, now);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select('start_at, end_at, status, hold_expires_at')
    .eq('business_id', businessId)
    .in('status', ['held', 'confirmed']);
  if (error) throw new Error(`Unable to load booked slots: ${error.message}`);
  return blockingBookings(
    (data ?? []).map((row) => ({
      startAt: row.start_at as string,
      endAt: row.end_at as string,
      status: row.status as string,
      holdExpiresAt: (row.hold_expires_at as string | null) ?? null,
    })),
    now,
  );
}

export async function openSlotsForDate(input: {
  business: BookingBusiness;
  service: BookingService;
  date: string;
  now?: Date;
}) {
  const [hours, blackouts, existing] = await Promise.all([
    listHours(input.business.id),
    listBlackouts(input.business.id),
    listBlockingAppointments(input.business.id, input.now),
  ]);
  return generateSlots({
    date: input.date,
    timeZone: input.business.timezone || 'America/Chicago',
    durationMinutes: input.service.duration_minutes,
    weeklyHours: hours.map((row) => ({
      weekday: row.weekday,
      startTime: String(row.start_time).slice(0, 5),
      endTime: String(row.end_time).slice(0, 5),
    })),
    blackouts: blackouts.map((row) => ({ startDate: row.start_date, endDate: row.end_date })),
    existing,
    now: input.now,
  });
}

export async function createHold(input: {
  businessId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  depositCents: number;
}) {
  const supabase = createAdminClient();
  const now = new Date();
  const { data, error } = await supabase
    .from('booking_appointments')
    .insert({
      business_id: input.businessId,
      service_id: input.serviceId,
      start_at: input.startAt,
      end_at: input.endAt,
      status: 'held',
      hold_expires_at: holdExpiresAt(now),
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      deposit_cents: input.depositCents,
      updated_at: now.toISOString(),
    })
    .select('*')
    .single();
  if (error) throw new Error(`Unable to hold the time slot: ${error.message}`);
  return data as BookingAppointment;
}

export async function attachCheckoutSession(appointmentId: string, sessionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('booking_appointments')
    .update({ stripe_checkout_session_id: sessionId, updated_at: new Date().toISOString() })
    .eq('id', appointmentId);
  if (error) throw new Error(`Unable to save checkout session: ${error.message}`);
}

export async function releaseHold(appointmentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('booking_appointments')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('status', 'held');
  if (error) throw new Error(`Unable to release booking hold: ${error.message}`);
}

export async function getAppointment(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('booking_appointments').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load appointment: ${error.message}`);
  return (data as BookingAppointment | null) ?? null;
}

export async function getAppointmentBySession(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('booking_appointments')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load appointment: ${error.message}`);
  return (data as BookingAppointment | null) ?? null;
}

export async function confirmAppointment(input: {
  appointment: BookingAppointment;
  business: BookingBusiness;
  service: BookingService;
  paymentIntentId?: string | null;
}) {
  const supabase = createAdminClient();
  const payload = onlineBookingLeadPayload({
    ownerId: input.business.owner_id,
    customerName: input.appointment.customer_name,
    customerPhone: input.appointment.customer_phone,
    customerEmail: input.appointment.customer_email,
    serviceName: input.service.name,
    businessName: input.business.name,
    startAt: input.appointment.start_at,
    endAt: input.appointment.end_at,
    timeZone: input.business.timezone || 'America/Chicago',
    depositCents: input.appointment.deposit_cents,
    appointmentId: input.appointment.id,
  });

  let leadId = input.appointment.lead_id;
  if (!leadId) {
    const { data: lead, error: leadError } = await supabase.from('er_leads').insert(payload).select('id').single();
    if (leadError && /duplicate|unique/i.test(leadError.message)) {
      const { data: existing } = await supabase
        .from('er_leads')
        .select('id')
        .eq('conversation_id', payload.conversation_id)
        .maybeSingle();
      if (!existing?.id) throw new Error(`Unable to save booking lead: ${leadError.message}`);
      leadId = existing.id as string;
    } else if (leadError) {
      throw new Error(`Unable to save booking lead: ${leadError.message}`);
    } else {
      leadId = lead.id as string;
    }
  }

  const { data, error } = await supabase
    .from('booking_appointments')
    .update({
      status: 'confirmed',
      lead_id: leadId,
      stripe_payment_intent_id: input.paymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.appointment.id)
    .select('*')
    .single();
  if (error) throw new Error(`Unable to confirm booking: ${error.message}`);
  return { appointment: data as BookingAppointment, leadId };
}
