create table if not exists public.ava_onboardings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_hours text not null,
  services text not null,
  call_handling_rules text not null,
  staff_name text not null,
  staff_contact text not null,
  calendar_preference text not null,
  urgent_call_rules text not null,
  stripe_session_id text,
  selected_plan text,
  elevenlabs_agent_id text,
  agent_status text not null default 'pending_manual'
    check (agent_status in (
      'pending_manual',
      'pending_credentials',
      'provisioning',
      'configuring',
      'agent_ready_phone_pending',
      'failed'
    )),
  phone_status text not null default 'pending_manual'
    check (phone_status in ('pending_manual')),
  provisioning_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ava_onboardings enable row level security;

create unique index if not exists ava_onboardings_stripe_session_idx
  on public.ava_onboardings(stripe_session_id)
  where stripe_session_id is not null and stripe_session_id <> '';

create index if not exists ava_onboardings_created_idx
  on public.ava_onboardings(created_at desc);

comment on table public.ava_onboardings is
  'Private Ava customer setup records. Access is service-role only; no public RLS policies are defined.';
