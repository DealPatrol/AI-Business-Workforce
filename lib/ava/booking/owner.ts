import { createAdminClient } from '@/lib/supabase/admin';

export type OwnerOnboarding = {
  id: string;
  business_name: string | null;
  business_hours: string;
  services: string;
  call_handling_rules: string;
  staff_name: string;
  staff_contact: string;
  calendar_preference: string;
  urgent_call_rules: string;
  selected_plan: string | null;
  elevenlabs_agent_id: string | null;
  transfer_phone?: string | null;
};

/** The onboarding behind the signed-in owner's customer record (exact email match). */
export async function onboardingForOwnerEmail(email: string): Promise<OwnerOnboarding | null> {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  const supabase = createAdminClient();
  const { data: customers, error } = await supabase.from('ava_customers').select('email, onboarding_id');
  if (error) throw new Error(error.message);
  const onboardingId = (customers ?? []).find(
    (row) => String(row.email ?? '').trim().toLowerCase() === needle && row.onboarding_id,
  )?.onboarding_id;
  if (!onboardingId) return null;
  const { data, error: onboardingError } = await supabase.from('ava_onboardings').select('*').eq('id', onboardingId).maybeSingle();
  if (onboardingError) throw new Error(onboardingError.message);
  return (data as OwnerOnboarding | null) ?? null;
}
