export const LEAD_STATUSES = [
  'new',
  'drafted',
  'approved',
  'sent',
  'replied',
  'booked',
  'not_interested',
  'do_not_contact',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const DRAFT_KINDS = ['initial', 'followup_1', 'followup_2'] as const;

export type DraftKind = (typeof DRAFT_KINDS)[number];

export type EnrichmentStatus = 'pending' | 'enriched' | 'no_website' | 'failed';

export type LeadChannel = 'unknown' | 'email' | 'call_only';

export type TargetProfile = {
  id: string;
  label: string;
  reason: string;
  fitScore: number;
  queries: string[];
  selected: boolean;
};

export type ProspectorSettings = {
  senderName: string;
  senderEmail: string;
  mailingAddress: string;
  bookingUrl: string;
  dailyCap: number;
  defaultLocation: string;
  sendSpacingSeconds: number;
};

export type ProspectorCampaign = {
  id: string;
  name: string;
  sourceUrl: string;
  notes: string;
  location: string;
  radiusMeters: number | null;
  offerSummary: string;
  targets: TargetProfile[];
  createdAt: string;
};

export type ProspectorLead = {
  id: string;
  campaignId: string;
  placeId: string;
  name: string;
  category: string;
  types: string[];
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  emails: string[];
  contactName: string | null;
  enrichmentStatus: EnrichmentStatus;
  channel: LeadChannel;
  status: LeadStatus;
  searchQuery: string;
};

export type ProspectorDraft = {
  id: string;
  leadId: string;
  kind: DraftKind;
  subject: string;
  body: string;
  approvedAt: string | null;
};

export type ProspectorSend = {
  id: string;
  leadId: string;
  draftId: string | null;
  toEmail: string;
  fromEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'suppressed';
  error: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type ProspectorConfig = {
  maps: boolean;
  openai: boolean;
  coldEmail: boolean;
  unsubscribe: boolean;
};

export function leadStatusLabel(status: LeadStatus): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'drafted':
      return 'Drafted';
    case 'approved':
      return 'Approved';
    case 'sent':
      return 'Sent';
    case 'replied':
      return 'Replied';
    case 'booked':
      return 'Booked';
    case 'not_interested':
      return 'Not interested';
    case 'do_not_contact':
      return 'Do not contact';
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function draftKindLabel(kind: DraftKind): string {
  switch (kind) {
    case 'initial':
      return 'First email';
    case 'followup_1':
      return 'Follow-up 1';
    case 'followup_2':
      return 'Follow-up 2';
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
