import { createAdminClient } from '@/lib/supabase/admin';
import type { ErLead, IngestLeadInput, LeadStatus } from '@/lib/leads/types';
import { UUID_PATTERN } from '@/lib/leads/types';

function asLead(row: unknown): ErLead {
  return row as ErLead;
}

export async function resolveClientIdFromAgent(agentId: string) {
  if (!agentId) return { clientId: null as string | null, businessName: null as string | null };
  const supabase = createAdminClient();
  const { data: onboardings, error: onboardingError } = await supabase
    .from('ava_onboardings')
    .select('id, business_name')
    .eq('elevenlabs_agent_id', agentId)
    .limit(5);
  if (onboardingError) throw new Error(`Unable to look up receptionist agent: ${onboardingError.message}`);
  const onboarding = onboardings?.[0];
  if (!onboarding) return { clientId: null, businessName: null };

  const { data: customers, error: customerError } = await supabase
    .from('ava_customers')
    .select('id')
    .eq('onboarding_id', onboarding.id)
    .limit(1);
  if (customerError) throw new Error(`Unable to look up receptionist client: ${customerError.message}`);
  return {
    clientId: customers?.[0]?.id ?? null,
    businessName: onboarding.business_name ?? null,
  };
}

export async function clientIdsForOwnerEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return [] as string[];
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('ava_customers').select('id, email');
  if (error) throw new Error(`Unable to look up receptionist clients: ${error.message}`);
  const needle = trimmed.toLowerCase();
  return (data ?? [])
    .filter((row) => String(row.email ?? '').trim().toLowerCase() === needle)
    .map((row) => String(row.id))
    .filter((id) => UUID_PATTERN.test(id));
}

export async function findLeadByConversationId(conversationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('er_leads')
    .select('*')
    .eq('conversation_id', conversationId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load lead: ${error.message}`);
  return data ? asLead(data) : null;
}

export async function insertLead(input: IngestLeadInput) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const payload = {
    client_id: input.clientId ?? null,
    business_id: input.businessId ?? null,
    owner_id: input.ownerId ?? null,
    caller_name: input.callerName ?? null,
    caller_phone: input.callerPhone ?? null,
    job_type: input.jobType ?? null,
    summary: input.summary,
    called_at: input.calledAt ?? now,
    source: input.source ?? 'receptionist call',
    status: 'New' as LeadStatus,
    notes: input.notes ?? '',
    conversation_id: input.conversationId ?? null,
    updated_at: now,
  };
  const { data, error } = await supabase.from('er_leads').insert(payload).select('*').single();
  if (error) throw new Error(`Unable to save lead: ${error.message}`);
  return asLead(data);
}

export async function getLead(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('er_leads').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Unable to load lead: ${error.message}`);
  return data ? asLead(data) : null;
}

export async function listLeadsForOwner(input: {
  ownerId: string;
  clientIds: string[];
  status?: LeadStatus;
}) {
  const supabase = createAdminClient();
  let query = supabase.from('er_leads').select('*').order('called_at', { ascending: false }).limit(500);
  if (input.clientIds.length > 0) {
    query = query.or(`owner_id.eq.${input.ownerId},client_id.in.(${input.clientIds.join(',')})`);
  } else {
    query = query.eq('owner_id', input.ownerId);
  }
  if (input.status) query = query.eq('status', input.status);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to list leads: ${error.message}`);
  return (data ?? []).map(asLead);
}

export async function listBilledLeadsForClient(input: {
  clientId?: string | null;
  ownerId?: string | null;
  businessId?: string | null;
}) {
  const supabase = createAdminClient();
  let query = supabase.from('er_leads').select('id, billed_at, booked_at, client_id, owner_id, business_id').not('billed_at', 'is', null);
  if (input.clientId) query = query.eq('client_id', input.clientId);
  else if (input.ownerId) query = query.eq('owner_id', input.ownerId);
  else if (input.businessId) query = query.eq('business_id', input.businessId);
  else return [];
  const { data, error } = await query;
  if (error) throw new Error(`Unable to count billed jobs: ${error.message}`);
  return (data ?? []) as Array<Pick<ErLead, 'id' | 'billed_at' | 'booked_at' | 'client_id' | 'owner_id' | 'business_id'>>;
}

export async function updateLead(id: string, patch: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('er_leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`Unable to update lead: ${error.message}`);
  return asLead(data);
}

