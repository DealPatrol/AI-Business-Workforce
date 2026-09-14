import { createAdminClient } from '@/lib/supabase/admin';
import {
  AvaOnboardingDetails,
  AvaProvisioningResult,
  provisionAvaAgent,
} from '@/lib/ava/provisioning';

export type AvaOnboardingInput = AvaOnboardingDetails & {
  sessionId: string;
  plan: string;
};

type AvaOnboardingRow = {
  id: string;
  business_name: string;
  business_hours: string;
  services: string;
  call_handling_rules: string;
  staff_name: string;
  staff_contact: string;
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
      throw new Error(`Unable to check Ava onboarding: ${existingError.message}`);
    }
    if (existing) {
      return existing as AvaOnboardingRow;
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
    throw new Error(`Unable to save Ava onboarding: ${error.message}`);
  }

  return data as AvaOnboardingRow;
}

export async function getAvaOnboarding(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_onboardings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Unable to load Ava onboarding: ${error.message}`);
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
      throw new Error(`Unable to update Ava provisioning status: ${error.message}`);
    }
  });
}
