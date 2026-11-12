import { AVA_PLANS, isAvaPlanKey, type AvaPlanKey } from '@/lib/ava/pricing';

/** Minutes Ava answered: total call seconds, rounded up to the next whole minute. */
export function minutesFromSeconds(seconds: Array<number | null | undefined>) {
  const total = seconds.reduce<number>((sum, s) => sum + (typeof s === 'number' && Number.isFinite(s) && s > 0 ? s : 0), 0);
  return Math.ceil(total / 60);
}

export type DeskUsage = {
  planKey: AvaPlanKey | null;
  included: number;
  used: number;
  remaining: number;
  percent: number;
  over: boolean;
};

export function deskUsage(plan: string | null | undefined, usedMinutes: number): DeskUsage {
  const planKey = plan && isAvaPlanKey(plan) ? plan : null;
  const included = planKey ? AVA_PLANS[planKey].minutes : 0;
  const used = Math.max(0, Math.floor(usedMinutes));
  return {
    planKey,
    included,
    used,
    remaining: Math.max(0, included - used),
    percent: included ? Math.min(100, Math.round((used / included) * 100)) : 0,
    over: included > 0 && used > included,
  };
}

/** Milliseconds a time zone is ahead of UTC at one instant (negative for the Americas). */
function zoneOffsetMs(timeZone: string, at: Date) {
  const asZone = new Date(at.toLocaleString('en-US', { timeZone }));
  const asUtc = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  return asZone.getTime() - asUtc.getTime();
}

/** First instant of the current calendar month in a time zone (used when there is no Stripe period). */
export function monthStartIn(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const wall = Date.UTC(year, month - 1, 1);
  // Two passes so a daylight-saving change on the 1st uses the offset in force at midnight.
  let instant = wall - zoneOffsetMs(timeZone, new Date(wall));
  instant = wall - zoneOffsetMs(timeZone, new Date(instant));
  return new Date(instant);
}

/** The window usage is counted in: the Stripe billing period when known, otherwise this calendar month. */
export function usageWindow(
  period: { start: number | null; end: number | null } | null,
  timeZone = 'America/Chicago',
  now = new Date(),
) {
  if (period?.start && period.end && period.end * 1000 > now.getTime()) {
    return { start: new Date(period.start * 1000), end: new Date(period.end * 1000), source: 'billing' as const };
  }
  const start = monthStartIn(timeZone, now);
  return { start, end: null, source: 'month' as const };
}
