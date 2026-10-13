import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const OPERATOR_EMAIL = (process.env.OPERATOR_EMAIL || 'colecollins763@gmail.com').toLowerCase();

export type ClientOnboarding = {
  id: string;
  business_name: string | null;
  elevenlabs_agent_id: string | null;
  staff_email: string | null;
};

export async function currentUserEmail() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email?.toLowerCase() || '';
  } catch {
    return '';
  }
}

/** Onboardings the signed-in user may see: their staff email or their Stripe checkout email. Operator sees all. */
export async function onboardingsForEmail(email: string): Promise<ClientOnboarding[]> {
  if (!email) return [];
  const admin = createAdminClient();
  const cols = 'id, business_name, elevenlabs_agent_id, staff_email';
  if (email === OPERATOR_EMAIL) {
    const { data } = await admin.from('ava_onboardings').select(cols).order('created_at', { ascending: false }).limit(50);
    return (data ?? []) as ClientOnboarding[];
  }
  const byStaff = await admin.from('ava_onboardings').select(cols).ilike('staff_email', email).limit(10);
  const customers = await admin.from('ava_customers').select('onboarding_id').ilike('email', email).limit(10);
  const ids = (customers.data ?? []).map((row: { onboarding_id: string | null }) => row.onboarding_id).filter(Boolean) as string[];
  const byCustomer = ids.length ? await admin.from('ava_onboardings').select(cols).in('id', ids) : { data: [] };
  const seen = new Map<string, ClientOnboarding>();
  for (const row of [...(byStaff.data ?? []), ...(byCustomer.data ?? [])] as ClientOnboarding[]) seen.set(row.id, row);
  return [...seen.values()];
}

export async function canAccessOnboarding(email: string, onboardingId: string) {
  return (await onboardingsForEmail(email)).find((row) => row.id === onboardingId) || null;
}
