import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeEmail } from '@/lib/prospector/gates';
import { mapCampaign, mapDraft, mapLead, mapSend, mapSettings } from '@/lib/prospector/rows';
import type { PlaceLead } from '@/lib/prospector/places';
import type {
  DraftKind,
  ProspectorCampaign,
  ProspectorDraft,
  ProspectorLead,
  ProspectorSend,
  ProspectorSettings,
} from '@/lib/prospector/types';

type DbError = { message: string; code?: string } | null;

export function assertNoDbError(error: DbError) {
  if (!error) return;
  if (error.code === '42P01' || /does not exist/i.test(error.message)) {
    throw new Error(
      'Lead Finder tables are missing. Apply supabase/migrations/007_prospector.sql in the Supabase SQL editor.',
    );
  }
  throw new Error(error.message);
}

function rows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

export async function getSettings(supabase: SupabaseClient, ownerId: string): Promise<ProspectorSettings> {
  const { data, error } = await supabase
    .from('prospector_settings')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  assertNoDbError(error);
  return mapSettings((data as Record<string, unknown> | null) ?? null);
}

export async function saveSettings(
  supabase: SupabaseClient,
  ownerId: string,
  settings: ProspectorSettings,
): Promise<ProspectorSettings> {
  const { data, error } = await supabase
    .from('prospector_settings')
    .upsert({
      owner_id: ownerId,
      sender_name: settings.senderName,
      sender_email: settings.senderEmail,
      mailing_address: settings.mailingAddress,
      booking_url: settings.bookingUrl,
      daily_cap: settings.dailyCap,
      default_location: settings.defaultLocation,
      send_spacing_seconds: settings.sendSpacingSeconds,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  assertNoDbError(error);
  return mapSettings(data as Record<string, unknown>);
}

export async function listCampaigns(supabase: SupabaseClient, ownerId: string): Promise<ProspectorCampaign[]> {
  const { data, error } = await supabase
    .from('prospector_campaigns')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(50);
  assertNoDbError(error);
  return rows(data).map(mapCampaign);
}

export async function getCampaign(
  supabase: SupabaseClient,
  ownerId: string,
  campaignId: string,
): Promise<ProspectorCampaign | null> {
  const { data, error } = await supabase
    .from('prospector_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapCampaign(data as Record<string, unknown>) : null;
}

export async function insertCampaign(
  supabase: SupabaseClient,
  ownerId: string,
  input: {
    name: string;
    sourceUrl: string;
    notes: string;
    location: string;
    radiusMeters: number | null;
    offerSummary: string;
  },
): Promise<ProspectorCampaign> {
  const { data, error } = await supabase
    .from('prospector_campaigns')
    .insert({
      owner_id: ownerId,
      name: input.name,
      source_url: input.sourceUrl,
      notes: input.notes,
      location: input.location,
      radius_meters: input.radiusMeters,
      offer_summary: input.offerSummary,
      targets: [],
    })
    .select('*')
    .single();
  assertNoDbError(error);
  return mapCampaign(data as Record<string, unknown>);
}

export async function updateCampaign(
  supabase: SupabaseClient,
  ownerId: string,
  campaignId: string,
  patch: Record<string, unknown>,
): Promise<ProspectorCampaign | null> {
  const { data, error } = await supabase
    .from('prospector_campaigns')
    .update(patch)
    .eq('id', campaignId)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapCampaign(data as Record<string, unknown>) : null;
}

export async function listLeads(
  supabase: SupabaseClient,
  ownerId: string,
  campaignId: string,
): Promise<ProspectorLead[]> {
  const { data, error } = await supabase
    .from('prospector_leads')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(500);
  assertNoDbError(error);
  return rows(data).map(mapLead);
}

export async function getLead(
  supabase: SupabaseClient,
  ownerId: string,
  leadId: string,
): Promise<ProspectorLead | null> {
  const { data, error } = await supabase
    .from('prospector_leads')
    .select('*')
    .eq('id', leadId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapLead(data as Record<string, unknown>) : null;
}

export async function updateLead(
  supabase: SupabaseClient,
  ownerId: string,
  leadId: string,
  patch: Record<string, unknown>,
): Promise<ProspectorLead | null> {
  const { data, error } = await supabase
    .from('prospector_leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapLead(data as Record<string, unknown>) : null;
}

export function newLeadRow(ownerId: string, campaignId: string, place: PlaceLead & { searchQuery: string }) {
  const hasWebsite = Boolean(place.website);
  return {
    owner_id: ownerId,
    campaign_id: campaignId,
    place_id: place.placeId,
    name: place.name.slice(0, 200),
    category: place.category.slice(0, 120),
    types: place.types.slice(0, 12),
    address: place.address.slice(0, 300),
    phone: place.phone,
    website: place.website,
    rating: place.rating,
    review_count: place.reviewCount,
    maps_url: place.mapsUrl,
    emails: [] as string[],
    contact_name: null,
    enrichment_status: hasWebsite ? 'pending' : 'no_website',
    channel: hasWebsite ? 'unknown' : 'call_only',
    status: 'new',
    search_query: place.searchQuery,
  };
}

export async function insertNewLeads(
  supabase: SupabaseClient,
  rowsToInsert: ReturnType<typeof newLeadRow>[],
): Promise<number> {
  let inserted = 0;
  for (let index = 0; index < rowsToInsert.length; index += 50) {
    const chunk = rowsToInsert.slice(index, index + 50);
    const { data, error } = await supabase.from('prospector_leads').insert(chunk).select('id');
    assertNoDbError(error);
    inserted += rows(data).length;
  }
  return inserted;
}

export async function listDrafts(
  supabase: SupabaseClient,
  ownerId: string,
  leadId: string,
): Promise<ProspectorDraft[]> {
  const { data, error } = await supabase
    .from('prospector_drafts')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('lead_id', leadId);
  assertNoDbError(error);
  return rows(data).map(mapDraft);
}

export async function replaceDrafts(
  supabase: SupabaseClient,
  ownerId: string,
  leadId: string,
  drafts: Array<{ kind: DraftKind; subject: string; body: string }>,
): Promise<ProspectorDraft[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('prospector_drafts')
    .upsert(
      drafts.map((draft) => ({
        owner_id: ownerId,
        lead_id: leadId,
        kind: draft.kind,
        subject: draft.subject,
        body: draft.body,
        approved_at: null,
        updated_at: now,
      })),
      { onConflict: 'lead_id,kind' },
    )
    .select('*');
  assertNoDbError(error);
  return rows(data).map(mapDraft);
}

export async function getDraft(
  supabase: SupabaseClient,
  ownerId: string,
  draftId: string,
): Promise<ProspectorDraft | null> {
  const { data, error } = await supabase
    .from('prospector_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapDraft(data as Record<string, unknown>) : null;
}

export async function writeDraft(
  supabase: SupabaseClient,
  ownerId: string,
  draftId: string,
  patch: { subject: string; body: string; approvedAt: string | null },
): Promise<ProspectorDraft | null> {
  const { data, error } = await supabase
    .from('prospector_drafts')
    .update({
      subject: patch.subject,
      body: patch.body,
      approved_at: patch.approvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', draftId)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapDraft(data as Record<string, unknown>) : null;
}

export async function listSuppressedEmails(supabase: SupabaseClient, ownerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('prospector_suppressions')
    .select('email')
    .eq('owner_id', ownerId)
    .limit(5000);
  assertNoDbError(error);
  return rows(data)
    .map((row) => (typeof row.email === 'string' ? normalizeEmail(row.email) : ''))
    .filter(Boolean);
}

export async function addSuppressions(
  supabase: SupabaseClient,
  ownerId: string,
  emails: string[],
  reason: 'unsubscribe' | 'manual' | 'do_not_contact',
) {
  const unique = [...new Set(emails.map(normalizeEmail).filter((email) => email.includes('@')))];
  if (unique.length === 0) return;
  const { error } = await supabase.from('prospector_suppressions').upsert(
    unique.map((email) => ({ owner_id: ownerId, email, reason })),
    { onConflict: 'owner_id,email', ignoreDuplicates: true },
  );
  assertNoDbError(error);
}

export async function sentTodayCount(supabase: SupabaseClient, ownerId: string, startIso: string): Promise<number> {
  const { count, error } = await supabase
    .from('prospector_sends')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('status', 'sent')
    .gte('sent_at', startIso);
  assertNoDbError(error);
  return count ?? 0;
}

export async function lastSentAtMs(supabase: SupabaseClient, ownerId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('prospector_sends')
    .select('sent_at')
    .eq('owner_id', ownerId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoDbError(error);
  const sentAt = (data as { sent_at?: string } | null)?.sent_at;
  if (!sentAt) return null;
  const ms = new Date(sentAt).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function findSentDraft(
  supabase: SupabaseClient,
  ownerId: string,
  draftId: string,
): Promise<ProspectorSend | null> {
  const { data, error } = await supabase
    .from('prospector_sends')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('draft_id', draftId)
    .eq('status', 'sent')
    .maybeSingle();
  assertNoDbError(error);
  return data ? mapSend(data as Record<string, unknown>) : null;
}

export async function insertSend(
  supabase: SupabaseClient,
  row: {
    ownerId: string;
    leadId: string;
    draftId: string;
    toEmail: string;
    fromEmail: string;
    subject: string;
    body: string;
    provider?: string | null;
    providerMessageId?: string | null;
    status: 'sent' | 'failed' | 'suppressed';
    error?: string | null;
    sentAt?: string | null;
  },
): Promise<ProspectorSend> {
  const { data, error } = await supabase
    .from('prospector_sends')
    .insert({
      owner_id: row.ownerId,
      lead_id: row.leadId,
      draft_id: row.draftId,
      to_email: row.toEmail,
      from_email: row.fromEmail,
      subject: row.subject,
      body: row.body,
      provider: row.provider || 'stub',
      provider_message_id: row.providerMessageId ?? null,
      status: row.status,
      error: row.error ?? null,
      sent_at: row.sentAt ?? null,
    })
    .select('*')
    .single();
  assertNoDbError(error);
  return mapSend(data as Record<string, unknown>);
}

export async function listSends(
  supabase: SupabaseClient,
  ownerId: string,
  leadId: string,
): Promise<ProspectorSend[]> {
  const { data, error } = await supabase
    .from('prospector_sends')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(20);
  assertNoDbError(error);
  return rows(data).map(mapSend);
}

const KIND_ORDER: Record<DraftKind, number> = { initial: 0, followup_1: 1, followup_2: 2 };

export async function nextApprovedDraft(
  supabase: SupabaseClient,
  ownerId: string,
  campaignId: string,
): Promise<ProspectorDraft | null> {
  const leads = await listLeads(supabase, ownerId, campaignId);
  const eligible = new Set(
    leads
      .filter((lead) => lead.status !== 'do_not_contact' && lead.status !== 'not_interested')
      .map((lead) => lead.id),
  );
  if (eligible.size === 0) return null;
  const { data, error } = await supabase
    .from('prospector_drafts')
    .select('*')
    .eq('owner_id', ownerId)
    .in('lead_id', [...eligible])
    .not('approved_at', 'is', null);
  assertNoDbError(error);
  const drafts = rows(data).map(mapDraft);
  const handledIds = new Set<string>();
  if (drafts.length > 0) {
    const { data: sent, error: sentError } = await supabase
      .from('prospector_sends')
      .select('draft_id, status')
      .eq('owner_id', ownerId)
      .in('status', ['sent', 'suppressed'])
      .in(
        'draft_id',
        drafts.map((draft) => draft.id),
      );
    assertNoDbError(sentError);
    for (const row of rows(sent)) {
      if (typeof row.draft_id === 'string') handledIds.add(row.draft_id);
    }
  }
  const pending = drafts
    .filter((draft) => draft.approvedAt && !handledIds.has(draft.id))
    .sort((left, right) => KIND_ORDER[left.kind] - KIND_ORDER[right.kind] || left.id.localeCompare(right.id));
  return pending[0] ?? null;
}
