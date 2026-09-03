import { createSalesClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const SALES_EVENT_TYPES = [
  'demo_open',
  'call_started',
  'call_ended',
  'pilot_clicked',
  'contacted',
  'demo_sent',
  'replied',
  'conversation',
  'pilot_proposed',
] as const;

export type SalesEventType = (typeof SALES_EVENT_TYPES)[number];

export const SALES_STATUSES = [
  'queued',
  'contacted',
  'demo_sent',
  'opened',
  'called_ava',
  'replied',
  'conversation',
  'pilot_proposed',
  'passed',
] as const;

export type SalesStatus = (typeof SALES_STATUSES)[number];

export const STATUS_FROM_EVENT: Record<SalesEventType, SalesStatus> = {
  demo_open: 'opened',
  call_started: 'called_ava',
  call_ended: 'called_ava',
  pilot_clicked: 'pilot_proposed',
  contacted: 'contacted',
  demo_sent: 'demo_sent',
  replied: 'replied',
  conversation: 'conversation',
  pilot_proposed: 'pilot_proposed',
};

export type SalesEvent = {
  id?: string;
  prospect_slug: string;
  event_type: SalesEventType;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SalesProspectStatusRow = {
  prospect_slug: string;
  status: SalesStatus;
  notes: string | null;
  contacted_at: string | null;
  updated_at: string;
};

function isSalesEventType(value: string): value is SalesEventType {
  return (SALES_EVENT_TYPES as readonly string[]).includes(value);
}

function isSalesStatus(value: string): value is SalesStatus {
  return (SALES_STATUSES as readonly string[]).includes(value);
}

export async function recordSalesEvent(input: {
  prospectSlug: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<{ tracked: boolean; reason?: string; event?: SalesEvent }> {
  if (!isSupabaseConfigured()) {
    return { tracked: false, reason: 'storage_unavailable' };
  }

  const prospectSlug = input.prospectSlug.trim();
  if (!prospectSlug || !isSalesEventType(input.eventType)) {
    return { tracked: false, reason: 'invalid_payload' };
  }

  const metadata = input.metadata ?? {};
  const supabase = await createSalesClient();
  const { data, error } = await supabase
    .from('sales_prospect_events')
    .insert({
      prospect_slug: prospectSlug,
      event_type: input.eventType,
      metadata,
    })
    .select('id, prospect_slug, event_type, metadata, created_at')
    .single();

  if (error) {
    console.error('Sales event insert failed', error);
    return { tracked: false, reason: error.message };
  }

  const nextStatus = STATUS_FROM_EVENT[input.eventType];
  await supabase.from('sales_prospect_status').upsert(
    {
      prospect_slug: prospectSlug,
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...(input.eventType === 'contacted' || input.eventType === 'demo_sent'
        ? { contacted_at: new Date().toISOString() }
        : {}),
    },
    { onConflict: 'prospect_slug' },
  );

  return { tracked: true, event: data as SalesEvent };
}

export async function listSalesEvents(): Promise<{
  available: boolean;
  events: SalesEvent[];
  statuses: SalesProspectStatusRow[];
  reason?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { available: false, events: [], statuses: [], reason: 'storage_unavailable' };
  }

  const supabase = await createSalesClient();
  const [eventsResult, statusResult] = await Promise.all([
    supabase
      .from('sales_prospect_events')
      .select('id, prospect_slug, event_type, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('sales_prospect_status')
      .select('prospect_slug, status, notes, contacted_at, updated_at'),
  ]);

  if (eventsResult.error) {
    console.error('Sales event list failed', eventsResult.error);
    return { available: false, events: [], statuses: [], reason: eventsResult.error.message };
  }

  return {
    available: true,
    events: (eventsResult.data ?? []) as SalesEvent[],
    statuses: (statusResult.data ?? []) as SalesProspectStatusRow[],
  };
}

export async function updateSalesStatus(input: {
  prospectSlug: string;
  status: string;
  notes?: string;
}): Promise<{ updated: boolean; reason?: string }> {
  if (!isSupabaseConfigured()) {
    return { updated: false, reason: 'storage_unavailable' };
  }

  if (!input.prospectSlug.trim() || !isSalesStatus(input.status)) {
    return { updated: false, reason: 'invalid_payload' };
  }

  const supabase = await createSalesClient();
  const payload: Record<string, unknown> = {
    prospect_slug: input.prospectSlug.trim(),
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.status === 'contacted' || input.status === 'demo_sent') {
    payload.contacted_at = new Date().toISOString();
  }

  const { error } = await supabase.from('sales_prospect_status').upsert(payload, {
    onConflict: 'prospect_slug',
  });

  if (error) {
    console.error('Sales status update failed', error);
    return { updated: false, reason: error.message };
  }

  return { updated: true };
}
