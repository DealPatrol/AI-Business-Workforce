-- Ava books jobs during the call (opt-in per customer).
-- ava_calendars: one per customer onboarding (or a demo calendar for the demo agents).
-- ava_bookings: slots Ava booked. Only the server (service role) reads or writes these;
-- RLS is on with no policies, so the Data API exposes nothing.

create table if not exists public.ava_calendars (
  id uuid primary key default gen_random_uuid(),
  onboarding_id uuid unique references public.ava_onboardings(id) on delete cascade,
  label text not null default 'Ava calendar',
  is_demo boolean not null default false,
  enabled boolean not null default false,
  timezone text not null default 'America/Chicago',
  slot_minutes integer not null default 120 check (slot_minutes between 15 and 480),
  slot_capacity integer not null default 1 check (slot_capacity between 1 and 20),
  min_notice_minutes integer not null default 120 check (min_notice_minutes between 0 and 10080),
  horizon_days integer not null default 14 check (horizon_days between 1 and 60),
  -- {"1": [["08:00","17:00"]], ...} keyed by weekday 0=Sunday .. 6=Saturday, local time.
  weekly_hours jsonb not null default '{"1":[["08:00","17:00"]],"2":[["08:00","17:00"]],"3":[["08:00","17:00"]],"4":[["08:00","17:00"]],"5":[["08:00","17:00"]]}'::jsonb,
  -- [{"start":"2026-11-26","end":"2026-11-27","note":"Thanksgiving"}] local dates or local date-times.
  blackouts jsonb not null default '[]'::jsonb,
  -- sha256 hex of the per-agent tool secret sent in the x-ava-tool-secret header.
  tool_secret_hash text unique,
  elevenlabs_tool_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ava_bookings (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.ava_calendars(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked', 'canceled')),
  caller_name text,
  caller_phone text,
  service_address text,
  issue text,
  conversation_id text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ava_bookings_range check (end_at > start_at)
);

create index if not exists ava_bookings_calendar_start_idx on public.ava_bookings (calendar_id, start_at);
create index if not exists ava_bookings_conversation_idx on public.ava_bookings (conversation_id);

alter table public.ava_calendars enable row level security;
alter table public.ava_bookings enable row level security;

-- Owner's forwarding number for live transfers (optional, E.164).
alter table public.ava_onboardings add column if not exists transfer_phone text;
