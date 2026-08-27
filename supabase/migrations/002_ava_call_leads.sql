create table if not exists public.ava_call_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id text unique,
  business_name text,
  business_type text,
  caller_name text,
  caller_phone text,
  service_job_type text,
  property_address text,
  intent_urgency text,
  summary text not null,
  transcript jsonb not null default '[]'::jsonb,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ava_call_leads enable row level security;
create index if not exists ava_call_leads_created_idx on public.ava_call_leads(created_at desc);
