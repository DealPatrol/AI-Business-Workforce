export const HOLD_MS = 15 * 60 * 1000;
export const SLOT_STEP_MINUTES = 15;
export const MIN_DEPOSIT_CENTS = 50;

export type WeeklyHour = { weekday: number; startTime: string; endTime: string };
export type Blackout = { startDate: string; endDate: string };
export type ExistingBooking = { startAt: string; endAt: string; status?: string; holdExpiresAt?: string | null };

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function isValidSlug(value: string) {
  return SLUG_PATTERN.test(value) && value.length >= 2 && value.length <= 60;
}

export function depositCents(input: {
  priceCents: number;
  depositCents?: number | null;
  depositPercent?: number | null;
}) {
  const price = Number.isFinite(input.priceCents) ? Math.max(0, Math.round(input.priceCents)) : 0;
  if (input.depositCents != null && Number.isFinite(input.depositCents)) {
    return Math.max(0, Math.round(input.depositCents));
  }
  if (input.depositPercent != null && Number.isFinite(input.depositPercent)) {
    return Math.max(0, Math.round(price * (Number(input.depositPercent) / 100)));
  }
  return 0;
}

export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();
}

export function isHoldActive(input: {
  status: string;
  holdExpiresAt?: string | null;
  now?: Date;
}) {
  if (input.status === 'confirmed') return true;
  if (input.status !== 'held') return false;
  if (!input.holdExpiresAt) return false;
  const expires = new Date(input.holdExpiresAt);
  if (Number.isNaN(expires.getTime())) return false;
  return expires.getTime() > (input.now ?? new Date()).getTime();
}

export function blockingBookings(existing: ExistingBooking[], now = new Date()) {
  return existing.filter((booking) =>
    isHoldActive({
      status: booking.status ?? 'confirmed',
      holdExpiresAt: booking.holdExpiresAt,
      now,
    }),
  );
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? '';
}

/** Convert a wall-clock date+time in a named zone to a UTC Date. */
export function zonedDateTime(date: string, time: string, timeZone: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if ([year, month, day, hour, minute].some((value) => !Number.isFinite(value))) return null;

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcGuess);
  const actual = Date.UTC(
    Number(part(formatted, 'year')),
    Number(part(formatted, 'month')) - 1,
    Number(part(formatted, 'day')),
    Number(part(formatted, 'hour')),
    Number(part(formatted, 'minute')),
    Number(part(formatted, 'second')),
  );
  const intended = Date.UTC(year, month - 1, day, hour, minute, 0);
  return new Date(utcGuess.getTime() - (actual - intended));
}

export function dateInZone(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return formatted;
}

export function weekdayInZone(date: string, timeZone: string) {
  const start = zonedDateTime(date, '12:00', timeZone);
  if (!start) return null;
  const formatted = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(start);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(formatted);
}

export function isBlackedOut(date: string, blackouts: Blackout[]) {
  return blackouts.some((item) => date >= item.startDate && date <= item.endDate);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function timeLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export type OpenSlot = { startAt: string; endAt: string; label: string };

export function generateSlots(input: {
  date: string;
  timeZone: string;
  durationMinutes: number;
  weeklyHours: WeeklyHour[];
  blackouts: Blackout[];
  existing: ExistingBooking[];
  now?: Date;
  stepMinutes?: number;
}): OpenSlot[] {
  const duration = Math.round(input.durationMinutes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(duration) || duration <= 0) return [];
  if (isBlackedOut(input.date, input.blackouts)) return [];

  const weekday = weekdayInZone(input.date, input.timeZone);
  if (weekday == null || weekday < 0) return [];
  const hours = input.weeklyHours.filter((row) => row.weekday === weekday);
  if (hours.length === 0) return [];

  const now = input.now ?? new Date();
  const step = input.stepMinutes ?? SLOT_STEP_MINUTES;
  const blocked = blockingBookings(input.existing, now).map((booking) => ({
    start: new Date(booking.startAt),
    end: new Date(booking.endAt),
  }));

  const slots: OpenSlot[] = [];
  for (const window of hours) {
    const windowStart = zonedDateTime(input.date, window.startTime, input.timeZone);
    const windowEnd = zonedDateTime(input.date, window.endTime, input.timeZone);
    if (!windowStart || !windowEnd || windowEnd <= windowStart) continue;

    for (let cursor = new Date(windowStart); addMinutes(cursor, duration) <= windowEnd; cursor = addMinutes(cursor, step)) {
      const end = addMinutes(cursor, duration);
      if (cursor.getTime() <= now.getTime()) continue;
      const taken = blocked.some((booking) => rangesOverlap(cursor, end, booking.start, booking.end));
      if (taken) continue;
      slots.push({
        startAt: cursor.toISOString(),
        endAt: end.toISOString(),
        label: timeLabel(cursor, input.timeZone),
      });
    }
  }
  return slots;
}

export function holdExpiresAt(now = new Date()) {
  return new Date(now.getTime() + HOLD_MS).toISOString();
}

export function slotStillOpen(input: {
  startAt: string;
  endAt: string;
  existing: ExistingBooking[];
  now?: Date;
}) {
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return !blockingBookings(input.existing, input.now).some((booking) =>
    rangesOverlap(start, end, new Date(booking.startAt), new Date(booking.endAt)),
  );
}
