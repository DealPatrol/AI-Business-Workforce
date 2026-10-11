import { DEFAULT_DAILY_CAP, DEFAULT_SEND_SPACING_SECONDS } from '@/lib/prospector/constants';
import { parseTargetProfiles } from '@/lib/prospector/targets';
import type {
  DraftKind,
  EnrichmentStatus,
  LeadChannel,
  LeadStatus,
  ProspectorCampaign,
  ProspectorDraft,
  ProspectorLead,
  ProspectorSend,
  ProspectorSettings,
} from '@/lib/prospector/types';
import { isLeadStatus } from '@/lib/prospector/types';

type Row = Record<string, unknown>;

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

export function defaultSettings(): ProspectorSettings {
  return {
    senderName: '',
    senderEmail: '',
    mailingAddress: '',
    bookingUrl: '',
    dailyCap: DEFAULT_DAILY_CAP,
    defaultLocation: '',
    sendSpacingSeconds: DEFAULT_SEND_SPACING_SECONDS,
  };
}

export function mapSettings(row: Row | null): ProspectorSettings {
  if (!row) return defaultSettings();
  const dailyCap = numberOrNull(row.daily_cap);
  const spacing = numberOrNull(row.send_spacing_seconds);
  return {
    senderName: text(row.sender_name),
    senderEmail: text(row.sender_email),
    mailingAddress: text(row.mailing_address),
    bookingUrl: text(row.booking_url),
    dailyCap: dailyCap && dailyCap >= 1 ? Math.min(200, Math.round(dailyCap)) : DEFAULT_DAILY_CAP,
    defaultLocation: text(row.default_location),
    sendSpacingSeconds: spacing && spacing >= 30 ? Math.min(3600, Math.round(spacing)) : DEFAULT_SEND_SPACING_SECONDS,
  };
}

export function mapCampaign(row: Row): ProspectorCampaign {
  return {
    id: text(row.id),
    name: text(row.name),
    sourceUrl: text(row.source_url),
    notes: text(row.notes),
    location: text(row.location),
    radiusMeters: numberOrNull(row.radius_meters),
    offerSummary: text(row.offer_summary),
    targets: parseTargetProfiles(row.targets),
    createdAt: text(row.created_at),
  };
}

function enrichmentStatus(value: unknown): EnrichmentStatus {
  if (value === 'enriched' || value === 'no_website' || value === 'failed' || value === 'pending') return value;
  return 'pending';
}

function channel(value: unknown): LeadChannel {
  if (value === 'email' || value === 'call_only' || value === 'unknown') return value;
  return 'unknown';
}

function leadStatus(value: unknown): LeadStatus {
  return typeof value === 'string' && isLeadStatus(value) ? value : 'new';
}

export function mapLead(row: Row): ProspectorLead {
  return {
    id: text(row.id),
    campaignId: text(row.campaign_id),
    placeId: text(row.place_id),
    name: text(row.name),
    category: text(row.category),
    types: stringList(row.types),
    address: text(row.address),
    phone: nullableText(row.phone),
    website: nullableText(row.website),
    rating: numberOrNull(row.rating),
    reviewCount: numberOrNull(row.review_count),
    mapsUrl: nullableText(row.maps_url),
    emails: stringList(row.emails).map((email) => email.toLowerCase()),
    contactName: nullableText(row.contact_name),
    enrichmentStatus: enrichmentStatus(row.enrichment_status),
    channel: channel(row.channel),
    status: leadStatus(row.status),
    searchQuery: text(row.search_query),
  };
}

function draftKind(value: unknown): DraftKind {
  if (value === 'initial' || value === 'followup_1' || value === 'followup_2') return value;
  return 'initial';
}

export function mapDraft(row: Row): ProspectorDraft {
  return {
    id: text(row.id),
    leadId: text(row.lead_id),
    kind: draftKind(row.kind),
    subject: text(row.subject),
    body: text(row.body),
    approvedAt: nullableText(row.approved_at),
  };
}

export function mapSend(row: Row): ProspectorSend {
  const status = row.status === 'failed' || row.status === 'suppressed' || row.status === 'sent' ? row.status : 'failed';
  return {
    id: text(row.id),
    leadId: text(row.lead_id),
    draftId: nullableText(row.draft_id),
    toEmail: text(row.to_email),
    fromEmail: text(row.from_email),
    subject: text(row.subject),
    status,
    error: nullableText(row.error),
    sentAt: nullableText(row.sent_at),
    createdAt: text(row.created_at),
  };
}
