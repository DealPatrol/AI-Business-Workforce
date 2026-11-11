import {
  createGoogleEvent,
  googleBusyRanges,
  isGoogleLinked,
  withDeadline,
  type GoogleEnv,
  type GoogleEventInput,
} from '@/lib/ava/booking/google';
import { sendBookingConfirmation, type BookingSmsEnv, type SmsTransport } from '@/lib/ava/booking/sms-confirm';
import type { BookedRange } from '@/lib/ava/booking/slots';
import type { BookingRow, CalendarRow } from '@/lib/ava/booking/store';

/** How long a live call waits on Google before Ava answers from her own calendar alone. */
export const GOOGLE_BUSY_DEADLINE_MS = 2500;

/** Owner busy time from Google. Fails open (empty) so a Google outage never stalls a caller. */
export async function outsideBusy(
  calendar: CalendarRow,
  fromIso: string,
  toIso: string,
  deps: { busy?: typeof googleBusyRanges; env?: GoogleEnv } = {},
): Promise<BookedRange[]> {
  if (calendar.is_demo || !isGoogleLinked(calendar)) return [];
  const busy = deps.busy ?? googleBusyRanges;
  const result = await withDeadline(
    busy(
      { id: calendar.id, google_refresh_token_enc: calendar.google_refresh_token_enc ?? null, google_calendar_id: calendar.google_calendar_id ?? null },
      fromIso,
      toIso,
      deps.env,
    ),
    GOOGLE_BUSY_DEADLINE_MS,
    [] as BookedRange[],
  );
  if (result.timedOut) console.error('Google busy lookup timed out; offering from the Ava calendar only.');
  if (result.error) console.error('Google busy lookup failed; offering from the Ava calendar only.', result.error);
  return result.value;
}

export type AfterBookDeps = {
  env?: BookingSmsEnv & GoogleEnv;
  businessName: (calendar: CalendarRow) => Promise<string>;
  record: (bookingId: string, patch: Partial<Pick<BookingRow, 'sms_status' | 'sms_sid' | 'google_event_id'>>) => Promise<void>;
  smsTransport?: SmsTransport;
  createEvent?: (calendar: CalendarRow, input: GoogleEventInput) => Promise<string | null>;
};

/**
 * Work that happens after Ava has told the caller they are booked: the caller's text (if allowed) and the
 * owner's Google event (if linked). Each step is independent and never throws.
 */
export async function runAfterBook(calendar: CalendarRow, booking: BookingRow, window: string, deps: AfterBookDeps) {
  const env = deps.env ?? (process.env as BookingSmsEnv & GoogleEnv);
  const patch: Partial<Pick<BookingRow, 'sms_status' | 'sms_sid' | 'google_event_id'>> = {};

  try {
    const sms = await sendBookingConfirmation(
      {
        businessName: await deps.businessName(calendar),
        window,
        callerPhone: booking.caller_phone,
        optIn: booking.sms_opt_in === true,
        isDemo: booking.is_demo || calendar.is_demo,
      },
      env,
      deps.smsTransport,
    );
    patch.sms_status = sms.status;
    if (sms.sid) patch.sms_sid = sms.sid;
  } catch (error) {
    console.error('Booking text step failed', error);
    patch.sms_status = 'failed';
  }

  if (!calendar.is_demo && isGoogleLinked(calendar)) {
    try {
      const create =
        deps.createEvent ??
        ((cal: CalendarRow, input: GoogleEventInput) =>
          createGoogleEvent(
            { id: cal.id, google_refresh_token_enc: cal.google_refresh_token_enc ?? null, google_calendar_id: cal.google_calendar_id ?? null },
            input,
            env,
          ));
      const eventId = await create(calendar, {
        bookingId: booking.id,
        startAt: booking.start_at,
        endAt: booking.end_at,
        timeZone: calendar.timezone || 'America/Chicago',
        callerName: booking.caller_name,
        callerPhone: booking.caller_phone,
        serviceAddress: booking.service_address,
        issue: booking.issue,
      });
      if (eventId) patch.google_event_id = eventId;
    } catch (error) {
      console.error('Google event for booking failed', error instanceof Error ? error.message : error);
    }
  }

  await deps.record(booking.id, patch);
  return patch;
}
