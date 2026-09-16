export type AvaSalesQualificationInput = {
  businessName: string;
  businessType: string;
  businessHours: string;
  services: string;
  callHandlingRules: string;
  urgentCallRules: string;
  staffName: string;
  staffContact: string;
  calendarPreference: string;
  companyWebsite?: string | null;
  planInterest?: string | null;
  summary: string;
  conversationId: string;
  setupCallBookedAt?: string | null;
  setupCallMeetUrl?: string | null;
};

export type AvaSalesQualificationRow = {
  id: string;
  business_name: string;
  business_type: string;
  business_hours: string;
  services: string;
  call_handling_rules: string;
  urgent_call_rules: string;
  staff_name: string;
  staff_contact: string;
  calendar_preference: string;
  company_website: string | null;
  plan_interest: string | null;
  summary: string;
  conversation_id: string | null;
  setup_call_booked_at: string | null;
  setup_call_meet_url: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Safe fields for unauthenticated GET by UUID (no staff PII, no conversationId). */
export type AvaSalesQualificationPublicSafe = {
  id: string;
  businessName: string;
  businessType: string;
  businessHours: string;
  services: string;
  callHandlingRules: string;
  urgentCallRules: string;
  staffName: string;
  calendarPreference: string;
  companyWebsite: string | null;
  planInterest: string | null;
  summary: string;
  setupCallBookedAt: string | null;
  setupCallMeetUrl: string | null;
};

/** Full public shape — only returned with a valid short-lived prefill token (or to POST caller). */
export type AvaSalesQualificationPublic = AvaSalesQualificationPublicSafe & {
  staffContact: string;
  conversationId: string | null;
};

const MAX_FIELD = 4_000;

export function sanitizeQualifyField(value: unknown, fallback = ''): string {
  return String(value ?? '')
    .trim()
    .slice(0, MAX_FIELD);
}

export function toSafePublicQualification(
  row: AvaSalesQualificationRow,
): AvaSalesQualificationPublicSafe {
  return {
    id: row.id,
    businessName: row.business_name,
    businessType: row.business_type,
    businessHours: row.business_hours,
    services: row.services,
    callHandlingRules: row.call_handling_rules,
    urgentCallRules: row.urgent_call_rules,
    staffName: row.staff_name,
    calendarPreference: row.calendar_preference,
    companyWebsite: row.company_website,
    planInterest: row.plan_interest,
    summary: row.summary,
    setupCallBookedAt: row.setup_call_booked_at,
    setupCallMeetUrl: row.setup_call_meet_url,
  };
}

export function toPublicQualification(
  row: AvaSalesQualificationRow,
): AvaSalesQualificationPublic {
  return {
    ...toSafePublicQualification(row),
    staffContact: row.staff_contact,
    conversationId: row.conversation_id,
  };
}

export function rowFromInput(input: AvaSalesQualificationInput) {
  return {
    business_name: sanitizeQualifyField(input.businessName),
    business_type: sanitizeQualifyField(input.businessType),
    business_hours: sanitizeQualifyField(input.businessHours),
    services: sanitizeQualifyField(input.services),
    call_handling_rules: sanitizeQualifyField(input.callHandlingRules),
    urgent_call_rules: sanitizeQualifyField(input.urgentCallRules),
    staff_name: sanitizeQualifyField(input.staffName),
    staff_contact: sanitizeQualifyField(input.staffContact),
    calendar_preference: sanitizeQualifyField(input.calendarPreference),
    company_website: sanitizeQualifyField(input.companyWebsite || '') || null,
    plan_interest: sanitizeQualifyField(input.planInterest || '') || null,
    summary: sanitizeQualifyField(input.summary),
    conversation_id: sanitizeQualifyField(input.conversationId),
    setup_call_booked_at: input.setupCallBookedAt || null,
    setup_call_meet_url: sanitizeQualifyField(input.setupCallMeetUrl || '') || null,
    updated_at: new Date().toISOString(),
  };
}

export const REQUIRED_QUALIFY_FIELDS: Array<keyof AvaSalesQualificationInput> = [
  'businessName',
  'businessType',
  'businessHours',
  'services',
  'callHandlingRules',
  'urgentCallRules',
  'staffName',
  'staffContact',
  'calendarPreference',
  'summary',
  'conversationId',
];
