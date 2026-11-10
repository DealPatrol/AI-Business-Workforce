/**
 * Pure slot math for Ava's in-call booking. No I/O so it is easy to test.
 * All "local" values are wall-clock times in the calendar's IANA time zone.
 */

export type WeeklyHours = Record<string, Array<[string, string]>>;
export type Blackout = { start: string; end: string; note?: string };

export type CalendarSettings = {
  timezone: string;
  slotMinutes: number;
  slotCapacity: number;
  minNoticeMinutes: number;
  horizonDays: number;
  weeklyHours: WeeklyHours;
  blackouts: Blackout[];
};

export type BookedRange = { start_at: string; end_at: string };
export type OpenSlot = { start: string; end: string; label: string; localDate: string; localStart: string };

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  '1': [['08:00', '17:00']],
  '2': [['08:00', '17:00']],
  '3': [['08:00', '17:00']],
  '4': [['08:00', '17:00']],
  '5': [['08:00', '17:00']],
};

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

function minutesOf(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function zoneOffsetMs(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - instant.getTime();
}

/** Converts a local wall-clock "YYYY-MM-DD" + "HH:MM" in `timeZone` to a UTC Date (DST-safe). */
export function localToUtc(date: string, time: string, timeZone: string) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let utc = guess - zoneOffsetMs(new Date(guess), timeZone);
  utc = guess - zoneOffsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

/** Local calendar date (YYYY-MM-DD) and weekday (0=Sunday) of an instant in `timeZone`. */
export function localDateOf(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { date: `${get('year')}-${get('month')}-${get('day')}`, weekday };
}

function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function weekdayOf(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function spokenTime(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { text: m ? `${h12}:${pad(m)}` : `${h12}`, suffix };
}

/** "Tuesday, November 10, 8 to 10 AM" — written to be read aloud. */
export function slotLabel(date: string, startMin: number, endMin: number) {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
  const a = spokenTime(startMin);
  const b = spokenTime(endMin);
  if (endMin === 12 * 60) return `${day}, ${a.text} to noon`;
  if (startMin === 12 * 60) return `${day}, noon to ${b.text} ${b.suffix}`;
  return a.suffix === b.suffix ? `${day}, ${a.text} to ${b.text} ${b.suffix}` : `${day}, ${a.text} ${a.suffix} to ${b.text} ${b.suffix}`;
}

/** Blackout as a UTC range. Date-only values cover whole local days (end date inclusive). */
export function blackoutRange(blackout: Blackout, timeZone: string) {
  const start = DATE.test(blackout.start)
    ? localToUtc(blackout.start, '00:00', timeZone)
    : DATE_TIME.test(blackout.start)
      ? localToUtc(blackout.start.slice(0, 10), blackout.start.slice(11, 16), timeZone)
      : null;
  const end = DATE.test(blackout.end)
    ? localToUtc(addDays(blackout.end, 1), '00:00', timeZone)
    : DATE_TIME.test(blackout.end)
      ? localToUtc(blackout.end.slice(0, 10), blackout.end.slice(11, 16), timeZone)
      : null;
  if (!start || !end || end <= start) return null;
  return { start: start.getTime(), end: end.getTime() };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/** Every open slot from `now` through the horizon, in order. */
export function computeOpenSlots(settings: CalendarSettings, booked: BookedRange[], now: Date): OpenSlot[] {
  const tz = settings.timezone;
  const slot = settings.slotMinutes;
  const earliest = now.getTime() + settings.minNoticeMinutes * 60_000;
  const blackouts = settings.blackouts
    .map((b) => blackoutRange(b, tz))
    .filter((b): b is { start: number; end: number } => Boolean(b));
  const bookedMs = booked.map((b) => ({ start: Date.parse(b.start_at), end: Date.parse(b.end_at) }));
  const today = localDateOf(now, tz).date;
  const out: OpenSlot[] = [];

  for (let offset = 0; offset <= settings.horizonDays; offset += 1) {
    const date = addDays(today, offset);
    const ranges = settings.weeklyHours[String(weekdayOf(date))] ?? [];
    for (const [open, close] of ranges) {
      if (!TIME.test(open) || !TIME.test(close)) continue;
      const openMin = minutesOf(open);
      const closeMin = minutesOf(close);
      for (let startMin = openMin; startMin + slot <= closeMin; startMin += slot) {
        const startLocal = `${pad(Math.floor(startMin / 60))}:${pad(startMin % 60)}`;
        const endMinTotal = startMin + slot;
        const endLocal = `${pad(Math.floor(endMinTotal / 60))}:${pad(endMinTotal % 60)}`;
        const start = localToUtc(date, startLocal, tz).getTime();
        const end = localToUtc(date, endLocal, tz).getTime();
        if (start < earliest) continue;
        if (blackouts.some((b) => overlaps(start, end, b.start, b.end))) continue;
        const taken = bookedMs.filter((b) => overlaps(start, end, b.start, b.end)).length;
        if (taken >= settings.slotCapacity) continue;
        out.push({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          label: slotLabel(date, startMin, endMinTotal),
          localDate: date,
          localStart: startLocal,
        });
      }
    }
  }
  return out;
}

export type SlotPreference = { date?: string; partOfDay?: 'morning' | 'afternoon' | 'any' };

/** A short list Ava can read out: the caller's preferred day/part first, at most `limit` slots over 2 days. */
export function pickSlotsToOffer(slots: OpenSlot[], preference: SlotPreference, limit = 4): OpenSlot[] {
  const part = preference.partOfDay ?? 'any';
  const fitsPart = (s: OpenSlot) =>
    part === 'any' ? true : part === 'morning' ? minutesOf(s.localStart) < 12 * 60 : minutesOf(s.localStart) >= 12 * 60;
  let pool = slots;
  if (preference.date && DATE.test(preference.date)) {
    const sameDay = slots.filter((s) => s.localDate === preference.date);
    const later = slots.filter((s) => s.localDate > preference.date!);
    pool = sameDay.length ? [...sameDay, ...later] : later.length ? later : slots;
  }
  const preferred = pool.filter(fitsPart);
  const chosen = (preferred.length ? preferred : pool).slice();
  const days: string[] = [];
  const result: OpenSlot[] = [];
  for (const s of chosen) {
    if (!days.includes(s.localDate)) {
      if (days.length >= 2) break;
      days.push(s.localDate);
    }
    result.push(s);
    if (result.length >= limit) break;
  }
  return result;
}

/** Validates settings coming from the Desk form. Returns cleaned settings or an error message. */
export function cleanSettingsInput(raw: unknown):
  | { ok: true; value: Omit<CalendarSettings, 'timezone'> & { enabled: boolean } }
  | { ok: false; error: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const int = (v: unknown, min: number, max: number, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  const weeklyHours: WeeklyHours = {};
  const hours = (body.weeklyHours && typeof body.weeklyHours === 'object' ? body.weeklyHours : {}) as Record<string, unknown>;
  for (let day = 0; day <= 6; day += 1) {
    const ranges = Array.isArray(hours[String(day)]) ? (hours[String(day)] as unknown[]) : [];
    const clean: Array<[string, string]> = [];
    for (const range of ranges.slice(0, 3)) {
      if (!Array.isArray(range) || range.length !== 2) continue;
      const [open, close] = range.map(String);
      if (!TIME.test(open) || !TIME.test(close)) return { ok: false, error: 'Hours must look like 08:00.' };
      if (minutesOf(close) <= minutesOf(open)) return { ok: false, error: 'Closing time must be after opening time.' };
      clean.push([open, close]);
    }
    if (clean.length) weeklyHours[String(day)] = clean;
  }
  const blackouts: Blackout[] = [];
  for (const item of (Array.isArray(body.blackouts) ? body.blackouts : []).slice(0, 50)) {
    const b = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const start = String(b.start ?? '').trim();
    const end = String(b.end ?? start).trim() || start;
    const valid = (v: string) => DATE.test(v) || DATE_TIME.test(v);
    if (!valid(start) || !valid(end)) return { ok: false, error: 'Blocked times must be a date or a date and time.' };
    if (!blackoutRange({ start, end }, 'UTC')) return { ok: false, error: 'A blocked time ends before it starts.' };
    blackouts.push({ start, end, note: String(b.note ?? '').slice(0, 80) });
  }
  return {
    ok: true,
    value: {
      enabled: body.enabled === true || body.enabled === 'true' || body.enabled === 'on',
      slotMinutes: int(body.slotMinutes, 15, 480, 120),
      slotCapacity: int(body.slotCapacity, 1, 20, 1),
      minNoticeMinutes: int(body.minNoticeMinutes, 0, 10080, 120),
      horizonDays: int(body.horizonDays, 1, 60, 14),
      weeklyHours,
      blackouts,
    },
  };
}
