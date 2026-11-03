import { createAdminClient } from '@/lib/supabase/admin';
import { SMS_CONSENT_TEXT } from '@/lib/ava/sms-consent';
import { linkAvaCustomerToOnboarding } from '@/lib/ava/customers';
import { assertNotificationDestinationChange } from '@/lib/ava/destination-guard';
import {
  notificationDestinationsChanged,
  notificationDestinationsFromParts,
} from '@/lib/ava/destination-edit';
import {
  type AvaOnboardingDetails,
  type AvaProvisioningResult,
  provisionAvaAgent,
} from '@/lib/ava/provisioning';

export type AvaOnboardingInput = AvaOnboardingDetails & {
  sessionId: string;
  plan: string;
  staffEmail?: string;
  staffPhone?: string;
  preferredVoice?: string;
  /** Optional SMS lead-alert consent for staffPhone. Absent or false means no texts. */
  smsConsent?: boolean;
  smsConsentIp?: string;
  editToken?: string;
};

type AvaOnboardingRow = {
  id: string;
  business_name: string;
  business_hours: string;
  services: string;
  call_handling_rules: string;
  staff_name: string;
  staff_contact: string;
  staff_email?: string | null;
  staff_phone?: string | null;
  sms_consent?: boolean | null;
  calendar_preference: string;
  urgent_call_rules: string;
  stripe_session_id: string | null;
  selected_plan: string | null;
  elevenlabs_agent_id: string | null;
  agent_status: string;
  phone_status: string;
  provisioning_error: string | null;
};

function toProvisioningRecord(row: AvaOnboardingRow) {
  return {
    id: row.id,
    businessName: row.business_name,
    businessHours: row.business_hours,
    services: row.services,
    callHandlingRules: row.call_handling_rules,
    staffName: row.staff_name,
    staffContact: row.staff_contact,
    calendarPreference: row.calendar_preference,
    urgentCallRules: row.urgent_call_rules,
    elevenlabsAgentId: row.elevenlabs_agent_id,
  };
}

export async function saveAvaOnboarding(input: AvaOnboardingInput) {
  const supabase = createAdminClient();

  if (input.sessionId) {
    const { data: existing, error: existingError } = await supabase
      .from('ava_onboardings')
      .select('*')
      .eq('stripe_session_id', input.sessionId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Unable to check Executive Receptionist onboarding: ${existingError.message}`);
    }
    if (existing) {
      const stored = existing as AvaOnboardingRow;
      const currentDestinations = notificationDestinationsFromParts({
        staffEmail: stored.staff_email,
        staffPhone: stored.staff_phone,
        staffContact: stored.staff_contact,
      });
      const nextDestinations = notificationDestinationsFromParts({
        staffEmail: input.staffEmail,
        staffPhone: input.staffPhone,
        staffContact: input.staffContact,
      });
      if (notificationDestinationsChanged(currentDestinations, nextDestinations)) {
        await assertNotificationDestinationChange({
          sessionId: input.sessionId,
          editToken: input.editToken || '',
        });
      }

      const { data, error } = await supabase
        .from('ava_onboardings')
        .update({
          business_name: input.businessName,
          business_hours: input.businessHours,
          services: input.services,
          call_handling_rules: input.callHandlingRules,
          staff_name: input.staffName,
          staff_contact: input.staffContact,
          calendar_preference: input.calendarPreference,
          urgent_call_rules: input.urgentCallRules,
          selected_plan: input.plan || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Unable to update Executive Receptionist onboarding: ${error.message}`);
      }

      const saved = data as AvaOnboardingRow;
      await saveOptionalOnboardingFields(saved.id, input, { replaceDestinations: true });
      await saveSmsConsent(saved.id, input, {
        // Keep the original consent timestamp when nothing changed; a new phone needs fresh consent.
        keepExisting:
          Boolean(stored.sms_consent) &&
          !notificationDestinationsChanged(currentDestinations, nextDestinations),
      });
      await linkAvaCustomerToOnboarding({
        sessionId: input.sessionId,
        onboardingId: saved.id,
        businessName: input.businessName,
      });
      return saved;
    }
  }

  const { data, error } = await supabase
    .from('ava_onboardings')
    .insert({
      business_name: input.businessName,
      business_hours: input.businessHours,
      services: input.services,
      call_handling_rules: input.callHandlingRules,
      staff_name: input.staffName,
      staff_contact: input.staffContact,
      calendar_preference: input.calendarPreference,
      urgent_call_rules: input.urgentCallRules,
      stripe_session_id: input.sessionId || null,
      selected_plan: input.plan || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to save Executive Receptionist onboarding: ${error.message}`);
  }

  const saved = data as AvaOnboardingRow;
  await saveOptionalOnboardingFields(saved.id, input);
  await saveSmsConsent(saved.id, input, { keepExisting: false, firstSave: true });
  await linkAvaCustomerToOnboarding({
    sessionId: input.sessionId,
    onboardingId: saved.id,
    businessName: input.businessName,
  });
  return saved;
}

async function saveOptionalOnboardingFields(
  id: string,
  input: AvaOnboardingInput,
  options?: { replaceDestinations?: boolean },
) {
  const fields: Record<string, string | null> = {};
  if (options?.replaceDestinations) {
    fields.staff_email = input.staffEmail?.trim() || null;
    fields.staff_phone = input.staffPhone?.trim() || null;
  } else {
    if (input.staffEmail) fields.staff_email = input.staffEmail;
    if (input.staffPhone) fields.staff_phone = input.staffPhone;
  }
  if (input.preferredVoice) fields.preferred_voice = input.preferredVoice;
  if (Object.keys(fields).length === 0) return;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('ava_onboardings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.error('Optional Executive Receptionist onboarding fields were not saved', error.message);
  } catch (error) {
    console.error('Optional Executive Receptionist onboarding fields were not saved', error);
  }
}

/**
 * Stored separately from the other optional fields so a database that has not run the
 * sms_consent migration yet cannot block saving the staff email, phone, or voice.
 * If these columns are missing, consent simply stays unrecorded and no texts are sent.
 */
async function saveSmsConsent(
  id: string,
  input: AvaOnboardingInput,
  options: { keepExisting: boolean; firstSave?: boolean },
) {
  const consented = input.smsConsent === true && Boolean(input.staffPhone?.trim());
  if (consented && options.keepExisting) return;
  // New row without consent: the column default (false) already applies.
  if (!consented && options.firstSave) return;
  const now = new Date().toISOString();
  const fields = consented
    ? {
        sms_consent: true,
        sms_consent_at: now,
        sms_consent_text: SMS_CONSENT_TEXT,
        sms_consent_ip: input.smsConsentIp?.trim() || null,
      }
    : { sms_consent: false, sms_consent_at: null, sms_consent_text: null, sms_consent_ip: null };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('ava_onboardings')
      .update({ ...fields, updated_at: now })
      .eq('id', id);
    if (error) console.error('Executive Receptionist SMS consent was not saved', error.message);
  } catch (error) {
    console.error('Executive Receptionist SMS consent was not saved', error);
  }
}

export async function getAvaOnboarding(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_onboardings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Unable to load Executive Receptionist onboarding: ${error.message}`);
  }

  return data as AvaOnboardingRow;
}

export async function provisionStoredAvaOnboarding(
  row: AvaOnboardingRow,
): Promise<AvaProvisioningResult> {
  const supabase = createAdminClient();

  return provisionAvaAgent(toProvisioningRecord(row), async (changes) => {
    const { error } = await supabase
      .from('ava_onboardings')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (error) {
      throw new Error(`Unable to update Executive Receptionist provisioning status: ${error.message}`);
    }
  });
}
