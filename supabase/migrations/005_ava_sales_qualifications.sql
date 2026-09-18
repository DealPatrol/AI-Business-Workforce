-- Sales Ava qualification answers → onboarding prefill
create table if not exists public.ava_sales_qualifications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text not null,
  business_hours text not null,
  services text not null,
  call_handling_rules text not null,
  urgent_call_rules text not null,
  staff_name text not null,
  staff_contact text not null,
  calendar_preference text not null,
  company_website text,
  plan_interest text,
  summary text not null,
  conversation_id text unique,
  setup_call_booked_at timestamptz,
  setup_call_meet_url text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ava_sales_qualifications enable row level security;

create index if not exists ava_sales_qualifications_created_idx
  on public.ava_sales_qualifications(created_at desc);

comment on table public.ava_sales_qualifications is
  'Sales Ava qualify answers for Workforce funnel. Service-role only; no public RLS policies.';
