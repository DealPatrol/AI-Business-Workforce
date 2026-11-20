/**
 * Saved transfer rules for the Desk. transfer_rules is not granted to signed-in users, so this reads with the
 * server key, scoped to the onboarding id the owner's own session already loaded. Only the rules leave here,
 * and a database without the transfer columns still loads (no rules).
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { deskTransferRules } from '@/lib/desk/transfer-settings';

export async function loadDeskTransferRules(onboardingId: string) {
  const { data, error } = await createAdminClient().from('ava_onboardings').select('*').eq('id', onboardingId).maybeSingle();
  if (error) throw new Error(`Desk could not load transfer numbers: ${error.message}`);
  return deskTransferRules((data as Record<string, unknown> | null) ?? null);
}
