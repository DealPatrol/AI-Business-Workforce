-- Ava go-live: Stripe customer rows, webhook idempotency, and lead-routing fields.
-- Apply this in the Supabase SQL editor before connecting the Stripe or ElevenLabs webhooks.
-- The app does not apply migrations itself.

create table if not exists public.ava_customers (
  id uuid primary key default gen_random_uuid(),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  email text,
  name text,
  business_name text,
  plan text,
  included_minutes integer,
  overage_cents integer,
  subscription_status text not null default 'incomplete',
  product text not null default 'ava',
  onboarding_id uuid references public.ava_onboardings(id) on delete set null,
  buyer_onboarding_email_sent_at timestamptz,
  owner_checkout_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ava_customers_stripe_customer_idx
  on public.ava_customers (stripe_customer_id)
  where stripe_customer_id is not null and stripe_customer_id <> '';

create unique index if not exists ava_customers_stripe_subscription_idx
  on public.ava_customers (stripe_subscription_id)
  where stripe_subscription_id is not null and stripe_subscription_id <> '';

create unique index if not exists ava_customers_checkout_session_idx
  on public.ava_customers (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null and stripe_checkout_session_id <> '';

create index if not exists ava_customers_onboarding_idx
  on public.ava_customers (onboarding_id);

alter table public.ava_customers enable row level security;

comment on table public.ava_customers is
  'Ava Stripe customers written by the billing webhook. Service-role only; no public policies.';

create table if not exists public.ava_webhook_events (
  id text primary key,
  source text not null,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.ava_webhook_events enable row level security;

comment on table public.ava_webhook_events is
  'Processed webhook ids so Stripe retries do not send duplicate checkout mail.';

alter table public.ava_onboardings
  add column if not exists staff_email text,
  add column if not exists staff_phone text,
  add column if not exists preferred_voice text;

alter table public.ava_call_leads
  add column if not exists elevenlabs_agent_id text,
  add column if not exists onboarding_id uuid references public.ava_onboardings(id) on delete set null;

create index if not exists ava_onboardings_agent_idx
  on public.ava_onboardings (elevenlabs_agent_id)
  where elevenlabs_agent_id is not null and elevenlabs_agent_id <> '';

create index if not exists ava_call_leads_agent_idx
  on public.ava_call_leads (elevenlabs_agent_id);
