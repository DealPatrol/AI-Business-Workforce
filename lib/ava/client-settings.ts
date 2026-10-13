import { createAdminClient } from '@/lib/supabase/admin';
import { sendCustomerSms } from '@/lib/outbound';
import { toE164 } from '@/lib/analytics/contact';

export type AvaClientSettings = {
  onboarding_id: string;
  missed_call_textback: boolean;
  textback_message: string | null;
  booking_url: string | null;
  transfer_enabled: boolean;
  transfer_number: string | null;
  transfer_rule: string | null;
  email_summaries: boolean;
};

export function defaultSettings(onboardingId: string): AvaClientSettings {
  return {
    onboarding_id: onboardingId,
    missed_call_textback: false,
    textback_message: null,
    booking_url: null,
    transfer_enabled: false,
    transfer_number: null,
    transfer_rule: null,
    email_summaries: true,
  };
}

export async function loadClientSettings(onboardingId: string): Promise<AvaClientSettings> {
  try {
    const { data, error } = await createAdminClient()
      .from('ava_client_settings')
      .select('*')
      .eq('onboarding_id', onboardingId)
      .maybeSingle();
    if (error || !data) return defaultSettings(onboardingId);
    return { ...defaultSettings(onboardingId), ...(data as Partial<AvaClientSettings>) };
  } catch {
    return defaultSettings(onboardingId);
  }
}

export function safeHttpsUrl(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

/** A call counts as "missed" when Ava could not capture a usable lead (hang-up, very short call). */
export function looksMissed(lead: { callerName: string; need: string; durationSecs: number | null }) {
  if (lead.durationSecs !== null && lead.durationSecs < 20) return true;
  return !lead.callerName && !lead.need;
}

export function buildTextBack(businessName: string | null, settings: AvaClientSettings, missed: boolean) {
  const name = businessName || 'us';
  const custom = settings.textback_message?.trim();
  const base = custom
    ? custom
    : missed
      ? `Sorry we missed you — thanks for calling ${name}. Reply here with what you need and we'll get back to you.`
      : `Thanks for calling ${name}. We got your message and will follow up soon.`;
  return settings.booking_url ? `${base} Book a time: ${settings.booking_url}` : base;
}

export async function maybeSendCallerTextBack(input: {
  leadId: string;
  lead: { callerPhone: string; callerName: string; need: string; durationSecs: number | null };
  settings: AvaClientSettings;
  businessName: string | null;
}) {
  const { settings, lead } = input;
  const missed = looksMissed(lead);
  // Text-back is opt-in per client. Booking-link texts go to callers who left a lead.
  const wantMissed = settings.missed_call_textback && missed;
  const wantBooking = Boolean(settings.booking_url) && !missed;
  if (!wantMissed && !wantBooking) return { sent: false, skipped: 'not enabled' };
  const phone = toE164(lead.callerPhone);
  if (!phone) return { sent: false, skipped: 'no caller phone' };
  const result = await sendCustomerSms({ to: phone, body: buildTextBack(input.businessName, settings, missed) });
  if (result.sent) {
    await createAdminClient()
      .from('ava_call_leads')
      .update({ textback_sent_at: new Date().toISOString() })
      .eq('id', input.leadId)
      .then(() => undefined, () => undefined);
  }
  return result;
}
