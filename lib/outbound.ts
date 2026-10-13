import { createAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/ava/mail';
import { sendAvaLeadSms } from '@/lib/ava/sms';
import { toE164 } from '@/lib/analytics/contact';

/**
 * One gate for every customer-facing text or email added in the claims pack
 * (missed-call text-back, review requests, review reminders).
 *
 * Default is TEST MODE: email is redirected to OUTBOUND_TEST_EMAIL
 * (colecollins763@gmail.com) and SMS is only sent to OUTBOUND_TEST_PHONE.
 * Set OUTBOUND_LIVE=true in an environment to deliver to real recipients.
 * Opted-out numbers (STOP) are never texted, live or test.
 */
export const DEFAULT_TEST_EMAIL = 'colecollins763@gmail.com';

export function outboundLive() {
  return process.env.OUTBOUND_LIVE?.trim().toLowerCase() === 'true';
}

export function testEmail() {
  return process.env.OUTBOUND_TEST_EMAIL?.trim() || DEFAULT_TEST_EMAIL;
}

export async function isOptedOut(phone: string) {
  try {
    const { data } = await createAdminClient().from('sms_opt_outs').select('phone').eq('phone', phone).maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export type OutboundResult = { sent: boolean; testMode: boolean; to?: string; error?: string };

export async function sendCustomerEmail(input: { to: string; subject: string; html: string; replyTo?: string }): Promise<OutboundResult> {
  const live = outboundLive();
  const to = live ? input.to : testEmail();
  const subject = live ? input.subject : `[TEST → ${input.to}] ${input.subject}`;
  try {
    await sendResendEmail({ to, subject, html: input.html, replyTo: input.replyTo });
    return { sent: true, testMode: !live, to };
  } catch (error) {
    return { sent: false, testMode: !live, to, error: error instanceof Error ? error.message : 'email failed' };
  }
}

export async function sendCustomerSms(input: { to: string; body: string }): Promise<OutboundResult> {
  const live = outboundLive();
  const real = toE164(input.to);
  if (!real) return { sent: false, testMode: !live, error: 'invalid phone' };
  if (await isOptedOut(real)) return { sent: false, testMode: !live, error: 'opted out' };
  const to = live ? real : toE164(process.env.OUTBOUND_TEST_PHONE || '');
  if (!to) return { sent: false, testMode: true, error: 'test mode: OUTBOUND_TEST_PHONE not set, SMS skipped' };
  const body = `${live ? '' : `[TEST → ${real}] `}${input.body}\nReply STOP to opt out.`;
  const result = await sendAvaLeadSms({ to, body });
  return { sent: result.sent, testMode: !live, to, error: result.error };
}
