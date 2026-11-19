/** Server-side glue for the capability tools: real email/SMS senders and the after-hold work. */
import { avaOwnerEmail, escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import { bookingWindowLabel } from '@/lib/ava/booking/event';
import { bookingSmsEnabled, twilioTransport, type BookingSmsEnv } from '@/lib/ava/booking/sms-confirm';
import type { CalendarRow } from '@/lib/ava/booking/store';
import { decideCallbackSms, ownerAlertHtml, ownerAlertSubject, type CallbackDeps, type CallbackRow } from '@/lib/ava/capabilities/callback';
import { runPage, type PageInput, type PagingEnv } from '@/lib/ava/capabilities/paging';
import {
  callbackForConversation,
  capabilityContext,
  conversationAlreadyPaged,
  insertCallback,
  listHeldCallbacks,
  recordCallbackAlert,
  recordPage,
} from '@/lib/ava/capabilities/store';
import { getSiteUrl } from '@/lib/site-url';

/** Owner alert email (deadline = end of the window) and, when allowed, the caller's text. Never throws. */
export async function afterCallbackHold(calendar: CalendarRow, row: CallbackRow, window: string, env = process.env as BookingSmsEnv) {
  if (calendar.is_demo || row.is_demo) {
    await recordCallbackAlert(row.id, { owner_alert_status: 'skipped:demo', sms_status: 'skipped:demo' });
    return;
  }
  const ctx = await capabilityContext(calendar, avaOwnerEmail()).catch(() => null);
  const businessName = ctx?.businessName || calendar.label || 'your business';
  let ownerStatus = 'sent';
  try {
    await sendResendEmail({
      to: ctx?.ownerEmail || avaOwnerEmail(),
      subject: ownerAlertSubject(window, row.caller_name),
      html: ownerAlertHtml({
        businessName,
        window,
        deadlineIso: row.end_at,
        callerName: row.caller_name,
        callerPhone: row.caller_phone,
        issue: row.issue,
        deskUrl: `${getSiteUrl()}/desk`,
        escape: escapeHtml,
      }),
    });
  } catch (error) {
    ownerStatus = 'failed';
    console.error('Callback owner alert failed', error instanceof Error ? error.message : error);
  }
  let smsStatus = 'skipped';
  let smsSid: string | undefined;
  try {
    const decision = decideCallbackSms(
      { businessName, window, callerPhone: row.caller_phone, optIn: row.sms_opt_in === true, isDemo: false },
      env,
    );
    if (!decision.send) smsStatus = `skipped:${decision.reason}`;
    else {
      const res = await twilioTransport(env)({ to: decision.to, from: decision.from, body: decision.body });
      smsStatus = res.error ? 'failed' : 'sent';
      smsSid = res.sid;
    }
  } catch {
    smsStatus = 'failed';
  }
  await recordCallbackAlert(row.id, { owner_alert_status: ownerStatus, sms_status: smsStatus, ...(smsSid ? { sms_sid: smsSid } : {}) });
}

export function callbackDeps(schedule: (work: () => Promise<void>) => void): CallbackDeps {
  return {
    listHeld: listHeldCallbacks,
    findForConversation: callbackForConversation,
    insert: insertCallback,
    label: bookingWindowLabel,
    smsEnabled: bookingSmsEnabled(process.env as BookingSmsEnv),
    afterHold: (calendar, row, window) => schedule(() => afterCallbackHold(calendar as CalendarRow, row, window)),
  };
}

/** Pages the calendar's on-call list for real (or simulates on demo calendars). */
export async function pageOnCall(calendar: CalendarRow, input: Omit<PageInput, 'businessName'>) {
  const ctx = await capabilityContext(calendar, avaOwnerEmail());
  const env = process.env as PagingEnv;
  return runPage({ ...input, businessName: ctx.businessName }, ctx.onCall, env, calendar.is_demo, {
    alreadyPaged: conversationAlreadyPaged,
    sendEmail: async (to, subject, html) => {
      await sendResendEmail({ to, subject, html });
    },
    sendSms: (to, from, body) => twilioTransport(env as BookingSmsEnv)({ to, from, body }),
    record: (entry) => recordPage(calendar.id, entry),
    escape: escapeHtml,
  });
}
