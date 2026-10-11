import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeTrade, TradeKey } from '@/lib/concept-profiles';

const MISSING_SCHEMA_CODES = new Set(['42703', 'PGRST204']);

export async function getCampaignTrade(
  admin: SupabaseClient,
  campaignId: string,
): Promise<TradeKey> {
  const { data, error } = await admin
    .from('campaigns')
    .select('trade')
    .eq('id', campaignId)
    .single();

  if (error) {
    if (MISSING_SCHEMA_CODES.has(error.code)) return 'landscaping';
    throw new Error('Could not load the campaign trade.');
  }

  return normalizeTrade(data?.trade);
}
