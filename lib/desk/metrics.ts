/** Desk dashboard metrics. Pure: no network, no database. */

export const METRIC_RANGES = [7, 30, 90] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];
export const AVG_JOB_MAX_CENTS = 10_000_000; // $100,000

export type MetricCall = { conversation_id: string | null; created_at: string };
export type MetricBooking = {
  conversation_id: string | null;
  created_at: string;
  status: string | null;
  kind?: string | null;
  is_demo?: boolean | null;
};
export type MetricLead = { conversation_id: string | null; status: string | null; called_at?: string | null; booked_at?: string | null };

export type WeekBar = { start: string; calls: number; booked: number };

export type DeskMetrics = {
  rangeDays: MetricRange;
  calls: number;
  /** Appointments Ava put on the calendar during the range (not callbacks, not demo, not canceled). */
  appointments: number;
  /** Leads the owner marked Won during the range. */
  won: number;
  /** Calls that ended in an appointment or a Won lead (each call counted once). */
  bookedCalls: number;
  /** bookedCalls / calls, 0..1, or null with no calls. */
  rate: number | null;
  /** Booked outcomes × average job value; null until the owner sets a value. */
  revenueCents: number | null;
  avgJobValueCents: number | null;
  weeks: WeekBar[];
};

export function metricRange(raw: unknown): MetricRange {
  const n = Number(raw);
  return (METRIC_RANGES as readonly number[]).includes(n) ? (n as MetricRange) : 30;
}

function inRange(iso: string | null | undefined, from: number, to: number) {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= from && t < to;
}

function isAppointment(b: MetricBooking) {
  return b.status === 'booked' && (b.kind ?? 'visit') !== 'callback' && !b.is_demo;
}

/**
 * Calls, bookings, call-to-booking rate and estimated revenue for the last `rangeDays` days.
 * A call counts as booked when its conversation has an appointment or a lead marked Won. Bookings made
 * without a call (for example the online booking page) still count toward appointments and revenue.
 */
export function computeDeskMetrics(input: {
  calls: MetricCall[];
  bookings: MetricBooking[];
  leads: MetricLead[];
  rangeDays: MetricRange;
  avgJobValueCents: number | null;
  now?: Date;
}): DeskMetrics {
  const now = (input.now ?? new Date()).getTime();
  const from = now - input.rangeDays * 86_400_000;
  const calls = input.calls.filter((c) => inRange(c.created_at, from, now + 1));
  const appointments = input.bookings.filter((b) => isAppointment(b) && inRange(b.created_at, from, now + 1));
  const won = input.leads.filter((l) => l.status === 'Booked' && inRange(l.booked_at || l.called_at, from, now + 1));

  const bookedConversations = new Set<string>();
  for (const b of input.bookings) if (isAppointment(b) && b.conversation_id) bookedConversations.add(b.conversation_id);
  for (const l of input.leads) if (l.status === 'Booked' && l.conversation_id) bookedConversations.add(l.conversation_id);
  const bookedCalls = calls.filter((c) => c.conversation_id && bookedConversations.has(c.conversation_id)).length;

  // Outcomes for revenue: every appointment, plus Won leads that did not also book an appointment.
  const apptConversations = new Set(appointments.map((b) => b.conversation_id).filter(Boolean) as string[]);
  const outcomes = appointments.length + won.filter((l) => !l.conversation_id || !apptConversations.has(l.conversation_id)).length;
  const avg = cleanJobValueCents(input.avgJobValueCents);

  const weekCount = input.rangeDays === 7 ? 1 : input.rangeDays === 30 ? 5 : 13;
  const weeks: WeekBar[] = [];
  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const end = now + 1 - i * 7 * 86_400_000;
    const start = end - 7 * 86_400_000;
    const weekCalls = input.calls.filter((c) => inRange(c.created_at, start, end));
    weeks.push({
      start: new Date(start).toISOString(),
      calls: weekCalls.length,
      booked: weekCalls.filter((c) => c.conversation_id && bookedConversations.has(c.conversation_id)).length,
    });
  }

  return {
    rangeDays: input.rangeDays,
    calls: calls.length,
    appointments: appointments.length,
    won: won.length,
    bookedCalls,
    rate: calls.length ? Math.min(1, bookedCalls / calls.length) : null,
    revenueCents: avg === null ? null : outcomes * avg,
    avgJobValueCents: avg,
    weeks,
  };
}

/** Whole cents between $1 and $100,000, or null. */
export function cleanJobValueCents(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 100 || n > AVG_JOB_MAX_CENTS) return null;
  return Math.round(n);
}

/** "$1,250" or "1250.50" typed by an owner → cents. Empty → null (clears it). Invalid → undefined. */
export function parseJobValueInput(raw: unknown): number | null | undefined {
  const text = String(raw ?? '').replace(/[$,\s]/g, '');
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined;
  const cents = cleanJobValueCents(Math.round(Number(text) * 100));
  return cents === null ? undefined : cents;
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(
    cents / 100,
  );
}
