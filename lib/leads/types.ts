export const LEAD_SOURCES = ['receptionist call', 'web form', 'text-us', 'online booking'] as const;
export const LEAD_STATUSES = ['New', 'Contacted', 'Booked', 'Not a fit'] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type ErLead = {
  id: string;
  client_id: string | null;
  business_id: string | null;
  owner_id: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  job_type: string | null;
  summary: string;
  called_at: string;
  source: LeadSource;
  status: LeadStatus;
  notes: string;
  booked_at: string | null;
  billed_at: string | null;
  billing_skipped: boolean;
  billing_skip_reason: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type IngestLeadInput = {
  clientId?: string;
  businessId?: string;
  ownerId?: string;
  callerName?: string;
  callerPhone?: string;
  jobType?: string;
  summary: string;
  calledAt?: string;
  source?: LeadSource;
  conversationId?: string;
  agentId?: string;
  notes?: string;
};

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
