import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  UUID_PATTERN,
  type IngestLeadInput,
  type LeadSource,
  type LeadStatus,
} from '@/lib/leads/types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function asTrimmedString(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim();
  return '';
}

function optionalUuid(value: unknown) {
  const text = asTrimmedString(value);
  if (!text) return undefined;
  return UUID_PATTERN.test(text) ? text : null;
}

function optionalIsoDate(value: unknown) {
  const text = asTrimmedString(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function optionalSource(value: unknown): LeadSource | undefined | null {
  const text = asTrimmedString(value);
  if (!text) return undefined;
  return (LEAD_SOURCES as readonly string[]).includes(text) ? (text as LeadSource) : null;
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

export function parseLeadStatus(value: unknown): LeadStatus | null {
  const text = asTrimmedString(value);
  if (!text) return null;
  return isLeadStatus(text) ? text : null;
}

/**
 * Accepts a flat payload or a nested ElevenLabs-style post-call shape
 * ({ data: { conversation_id, analysis, ... }, ... }).
 */
export function parseIngestPayload(raw: unknown): { ok: true; value: IngestLeadInput } | { ok: false; error: string } {
  const body = asRecord(raw);
  const data = asRecord(body.data);
  const analysis = asRecord(data.analysis ?? body.analysis);
  const collected = asRecord(
    analysis.data_collection_results ?? analysis.collected_data ?? body.collected ?? data.collected,
  );

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const direct = asTrimmedString(body[key] ?? data[key] ?? analysis[key] ?? collected[key]);
      if (direct) return direct;
      const needle = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = Object.entries({ ...collected, ...analysis, ...data, ...body }).find(([candidate]) =>
        candidate.toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle),
      );
      const value = asTrimmedString(found?.[1]);
      if (value) return value;
    }
    return '';
  };

  const summary = pick('summary', 'transcript_summary', 'call_summary');
  if (!summary) return { ok: false, error: 'summary is required.' };

  const clientId = optionalUuid(body.clientId ?? body.client_id);
  const businessId = optionalUuid(body.businessId ?? body.business_id);
  const ownerId = optionalUuid(body.ownerId ?? body.owner_id);
  if (clientId === null) return { ok: false, error: 'clientId must be a UUID.' };
  if (businessId === null) return { ok: false, error: 'businessId must be a UUID.' };
  if (ownerId === null) return { ok: false, error: 'ownerId must be a UUID.' };

  const calledAt = optionalIsoDate(body.calledAt ?? body.called_at ?? body.started_at ?? data.started_at);
  if (calledAt === null) return { ok: false, error: 'calledAt must be a valid date.' };

  const source = optionalSource(body.source);
  if (source === null) {
    return { ok: false, error: 'source must be receptionist call, web form, text-us, or online booking.' };
  }

  const conversationId = pick('conversationId', 'conversation_id');
  const agentId = pick('agentId', 'agent_id');

  return {
    ok: true,
    value: {
      ...(clientId ? { clientId } : {}),
      ...(businessId ? { businessId } : {}),
      ...(ownerId ? { ownerId } : {}),
      callerName: pick('callerName', 'caller_name', 'name') || undefined,
      callerPhone: pick('callerPhone', 'caller_phone', 'phone') || undefined,
      jobType: pick('jobType', 'job_type', 'serviceJobType', 'service_job_type', 'need') || undefined,
      summary,
      ...(calledAt ? { calledAt } : {}),
      source: source ?? 'receptionist call',
      ...(conversationId ? { conversationId } : {}),
      ...(agentId ? { agentId } : {}),
      notes: pick('notes') || undefined,
    },
  };
}

export function parseLeadPatch(raw: unknown): { ok: true; status?: LeadStatus; notes?: string } | { ok: false; error: string } {
  const body = asRecord(raw);
  const hasStatus = 'status' in body;
  const hasNotes = 'notes' in body;
  if (!hasStatus && !hasNotes) return { ok: false, error: 'status or notes is required.' };

  const next: { status?: LeadStatus; notes?: string } = {};
  if (hasStatus) {
    const status = parseLeadStatus(body.status);
    if (!status) return { ok: false, error: 'status must be New, Contacted, Booked, or Not a fit.' };
    next.status = status;
  }
  if (hasNotes) {
    if (typeof body.notes !== 'string') return { ok: false, error: 'notes must be text.' };
    next.notes = body.notes;
  }
  return { ok: true, ...next };
}

export function matchesLeadSearch(lead: {
  caller_name: string | null;
  caller_phone: string | null;
  job_type: string | null;
  summary: string;
  notes: string;
}, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [lead.caller_name, lead.caller_phone, lead.job_type, lead.summary, lead.notes]
    .some((value) => (value ?? '').toLowerCase().includes(needle));
}
