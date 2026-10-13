-- Claims-that-work pack: Ava client settings, referrals, ReputationFlow.
-- Apply manually in the Supabase SQL editor (the app never applies migrations).
-- Every table is service-role only (RLS on, no public policies); pages read
-- through server routes that check the signed-in user's email.

create table if not exists public.ava_client_settings (
  onboarding_id uuid primary key references public.ava_onboardings(id) on delete cascade,
  missed_call_textback boolean not null default false,
  textback_message text,
  booking_url text,
  transfer_enabled boolean not null default false,
  transfer_number text,
  transfer_rule text,
  email_summaries boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.ava_client_settings enable row level security;

alter table public.ava_call_leads
  add column if not exists call_duration_secs integer,
  add column if not exists textback_sent_at timestamptz;

create table if not exists public.referral_codes (
  code text primary key,
  owner_email text not null,
  owner_name text,
  created_at timestamptz not null default now()
);
create unique index if not exists referral_codes_owner_idx on public.referral_codes (lower(owner_email));
alter table public.referral_codes enable row level security;

create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.referral_codes(code) on delete cascade,
  event text not null check (event in ('visit','checkout_started','subscribed','credited')),
  stripe_session_id text,
  product text,
  created_at timestamptz not null default now()
);
create index if not exists referral_events_code_idx on public.referral_events (code, created_at desc);
alter table public.referral_events enable row level security;

create table if not exists public.rf_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  slug text not null unique,
  google_review_url text,
  facebook_url text,
  yelp_url text,
  reply_tone text default 'friendly',
  created_at timestamptz not null default now()
);
create index if not exists rf_businesses_owner_idx on public.rf_businesses (lower(owner_email));
alter table public.rf_businesses enable row level security;

create table if not exists public.rf_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rf_businesses(id) on delete cascade,
  customer_name text,
  customer_email text,
  customer_phone text,
  job_note text,
  channel text not null check (channel in ('email','sms')),
  consent_confirmed boolean not null default false,
  status text not null default 'queued',
  error text,
  sent_at timestamptz,
  reminder_sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rf_requests_business_idx on public.rf_requests (business_id, created_at desc);
alter table public.rf_requests enable row level security;

create table if not exists public.rf_feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.rf_businesses(id) on delete cascade,
  request_id uuid references public.rf_requests(id) on delete set null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.rf_feedback enable row level security;

create table if not exists public.sms_opt_outs (
  phone text primary key,
  created_at timestamptz not null default now()
);
alter table public.sms_opt_outs enable row level security;
