/**
 * Callback booking: instead of "someone will call you back", Ava holds a real callback window
 * (for example "Thursday, November 19, 2 to 3 PM"), the owner gets an alert with that deadline,
 * and the caller gets a text confirmation when texting is approved and they said yes.
 *
 * Callback windows use the business hours of the Ava calendar but are tracked separately from
 * visit windows (a held callback never blocks a technician visit, and vice versa).
 */
import { decideBookingSms, type BookingSmsDecision, type BookingSmsEnv, type BookingSmsInput } from '@/lib/ava/booking/sms-confirm';
import { computeOpenSlots, pickSlotsToOffer, type BookedRange, type CalendarSettings, type OpenSlot } from '@/lib/ava/booking/slots';

export const CALLBACK_DEFAULTS = {
  windowMinutes: 60,
  perWindow: 3,
  minNoticeMinutes: 15,
  horizonDays: 3,
};

export type CallbackCalendar = {
  id: string;
  is_demo: boolean;
  timezone: string;
  weekly_hours: CalendarSettings['weeklyHours'];
  blackouts: CalendarSettings['blackouts'];
  callback_minutes?: number | null;
  callback_capacity?: number | null;
};

export type CallbackRow = {
  id: string;
  calendar_id: string;
  start_at: string;
  end_at: string;
  caller_name: string | null;
  caller_phone: string | null;
  issue: string | null;
  conversation_id: string | null;
  is_demo: boolean;
  sms_opt_in?: boolean;
};

export function callbackSettings(calendar: CallbackCalendar): CalendarSettings {
  const minutes = Number(calendar.callback_minutes);
  const capacity = Number(calendar.callback_capacity);
  return {
    timezone: calendar.timezone || 'America/Chicago',
    slotMinutes: Number.isFinite(minutes) && minutes >= 30 && minutes <= 240 ? minutes : CALLBACK_DEFAULTS.windowMinutes,
    slotCapacity: Number.isFinite(capacity) && capacity >= 1 && capacity <= 20 ? capacity : CALLBACK_DEFAULTS.perWindow,
    minNoticeMinutes: CALLBACK_DEFAULTS.minNoticeMinutes,
    horizonDays: CALLBACK_DEFAULTS.horizonDays,
    weeklyHours: calendar.weekly_hours ?? {},
    blackouts: Array.isArray(calendar.blackouts) ? calendar.blackouts : [],
  };
}

/** Open callback windows; ASAP puts the earliest first. At most two are offered on the call. */
export function callbackWindowsToOffer(
  calendar: CallbackCalendar,
  held: BookedRange[],
  now: Date,
  preference: { date?: string; partOfDay?: 'morning' | 'afternoon' | 'any' } = {},
): OpenSlot[] {
  const all = computeOpenSlots(callbackSettings(calendar), held, now);
  if (!preference.date && (!preference.partOfDay || preference.partOfDay === 'any')) return all.slice(0, 2);
  return pickSlotsToOffer(all, preference, 2);
}

/** Owner alert subject: the deadline is the end of the held window. */
export function ownerAlertSubject(window: string, callerName: string | null) {
  return `Callback promised: ${window}${callerName ? ` — ${callerName}` : ''}`;
}

export function ownerAlertHtml(input: {
  businessName: string;
  window: string;
  deadlineIso: string;
  callerName: string | null;
  callerPhone: string | null;
  issue: string | null;
  deskUrl: string;
  escape: (s: string) => string;
}) {
  const e = input.escape;
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b"><h1 style="font-size:20px">Ava promised a callback</h1><p>Ava told this caller someone from ${e(input.businessName)} will call them back <b>${e(input.window)}</b>. Please call before the window ends.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Caller</b></td><td>${e(input.callerName || 'Not provided')}</td></tr><tr><td><b>Phone</b></td><td>${e(input.callerPhone || 'Not provided')}</td></tr><tr><td><b>About</b></td><td>${e(input.issue || 'Not provided')}</td></tr><tr><td><b>Call back by</b></td><td>${e(input.window)}</td></tr></table><p><a href="${e(input.deskUrl)}">Open your Desk</a> to see the full call.</p></div>`;
}

export function callbackSmsBody(businessName: string, window: string) {
  const business = String(businessName || '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'your service company';
  const when = String(window || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return `Ava for ${business}: the team will call you back ${when}. Reply HELP for help, STOP to opt out.`;
}

/** Same gate as booking texts (flag, approved sender, not demo, verbal yes), with the callback wording. */
export function decideCallbackSms(input: BookingSmsInput, env: BookingSmsEnv): BookingSmsDecision {
  const decision = decideBookingSms(input, env);
  if (!decision.send) return decision;
  return { ...decision, body: callbackSmsBody(input.businessName, input.window) };
}

function str(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function yes(value: unknown) {
  if (value === true) return true;
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return v === 'true' || v === 'yes';
}

export type CallbackDeps = {
  listHeld: (calendarId: string, fromIso: string, toIso: string) => Promise<BookedRange[]>;
  findForConversation: (conversationId: string) => Promise<CallbackRow | null>;
  insert: (row: Omit<CallbackRow, 'id'>) => Promise<CallbackRow>;
  /** Owner alert + caller text, after Ava has her answer. Must never throw. */
  afterHold?: (calendar: CallbackCalendar, row: CallbackRow, window: string) => void;
  smsEnabled?: boolean;
  /** Demo calendar alerts really go to the operator (AVA_DEMO_ALERT_EMAIL), so Ava can promise the callback. */
  demoAlerts?: boolean;
  label?: (row: Pick<CallbackRow, 'start_at' | 'end_at'>, timeZone: string) => string;
};

/**
 * ElevenLabs webhook tool `book_callback`.
 * Without slot_start: returns up to two windows to offer. With slot_start: holds that window.
 */
export async function handleCallback(calendar: CallbackCalendar, body: Record<string, unknown>, now: Date, deps: CallbackDeps) {
  const conversationId = str(body.conversation_id, 120);
  if (conversationId) {
    const existing = await deps.findForConversation(conversationId);
    if (existing && existing.calendar_id === calendar.id) {
      const window = deps.label ? deps.label(existing, calendar.timezone) : existing.start_at;
      return { held: true, already_held: true, window, message: `A callback is already held for ${window}. Confirm it; do not hold another.` };
    }
  }

  const settings = callbackSettings(calendar);
  const horizonEnd = new Date(now.getTime() + (settings.horizonDays + 1) * 86_400_000).toISOString();
  const held = await deps.listHeld(calendar.id, now.toISOString(), horizonEnd);
  const pref = {
    date: str(body.preferred_date, 10),
    partOfDay: (['morning', 'afternoon'].includes(str(body.part_of_day, 20)) ? str(body.part_of_day, 20) : 'any') as 'morning' | 'afternoon' | 'any',
  };
  const slotStart = str(body.slot_start, 40);

  if (!slotStart) {
    const offer = callbackWindowsToOffer(calendar, held, now, pref);
    if (offer.length === 0) {
      return { held: false, windows: [], message: 'No callback window is open in the next few days. Take the details and say the team will call back as soon as they can. Do not name a time.' };
    }
    return {
      held: false,
      windows: offer.map((s) => ({ slot_start: s.start, say: s.label })),
      message: 'Offer these callback windows using the say phrase. When the caller picks one, call book_callback again with that slot_start.',
    };
  }

  const callerName = str(body.caller_name, 120);
  const callerPhone = str(body.caller_phone, 40);
  if (!callerName || !callerPhone) {
    return { held: false, message: 'Missing caller_name or caller_phone. Ask for what is missing, then try again.' };
  }
  const parsed = new Date(slotStart);
  const all = computeOpenSlots(settings, held, now);
  const slot = Number.isNaN(parsed.getTime()) ? undefined : all.find((s) => s.start === parsed.toISOString());
  if (!slot) {
    return {
      held: false,
      windows: callbackWindowsToOffer(calendar, held, now, pref).map((s) => ({ slot_start: s.start, say: s.label })),
      message: 'That callback window is no longer open. Offer one of these instead.',
    };
  }

  const row = await deps.insert({
    calendar_id: calendar.id,
    start_at: slot.start,
    end_at: slot.end,
    caller_name: callerName,
    caller_phone: callerPhone,
    issue: str(body.issue, 500) || null,
    conversation_id: conversationId || null,
    is_demo: calendar.is_demo,
    sms_opt_in: yes(body.text_ok),
  });
  deps.afterHold?.(calendar, row, slot.label);

  const texting = !calendar.is_demo && row.sms_opt_in === true && deps.smsEnabled === true;
  return {
    held: true,
    window: slot.label,
    deadline: slot.end,
    message: calendar.is_demo && !deps.demoAlerts
      ? `Callback held on the demo calendar for ${slot.label}. Read it back and say this is a demo, so nobody will actually call.`
      : `Callback held for ${slot.label}. Read it back: someone from the team will call them back during that window.${
          texting ? ' Tell them a text confirmation is on its way.' : ''
        }`,
  };
}
