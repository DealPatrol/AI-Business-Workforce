-- Ava capabilities (preview branch; NOT applied to production until Cole approves):
-- callback windows, emergency pages, screened transfers, transfer rules and price sheets.
-- All additive: new nullable columns and new tables. Server (service role) only; RLS on, no policies.

-- Callback windows live in ava_bookings with kind = 'callback'. Visits keep kind null/'visit'.
alter table public.ava_bookings add column if not exists kind text check (kind in ('visit', 'callback'));
alter table public.ava_bookings add column if not exists owner_alert_status text;
create index if not exists ava_bookings_calendar_kind_idx on public.ava_bookings (calendar_id, kind, start_at);

alter table public.ava_calendars add column if not exists callback_minutes integer check (callback_minutes between 30 and 240);
alter table public.ava_calendars add column if not exists callback_capacity integer check (callback_capacity between 1 and 20);

-- Up to 3 transfer rules [{label, phone, reason, when}], on-call list [{name, email, phone, smsConsent}],
-- and the owner-approved price/FAQ sheet.
alter table public.ava_onboardings add column if not exists transfer_rules jsonb;
alter table public.ava_onboardings add column if not exists on_call_contacts jsonb;
alter table public.ava_onboardings add column if not exists price_sheet jsonb;

create table if not exists public.ava_pages (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.ava_calendars(id) on delete set null,
  conversation_id text,
  reason text,
  caller_name text,
  caller_phone text,
  issue text,
  emails_sent integer not null default 0,
  texts_sent integer not null default 0,
  failed integer not null default 0,
  texts_skipped text[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index if not exists ava_pages_conversation_idx on public.ava_pages (conversation_id) where conversation_id is not null;
alter table public.ava_pages enable row level security;

create table if not exists public.ava_transfers (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.ava_calendars(id) on delete cascade,
  conversation_id text,
  caller_id text not null,
  numbers text[] not null default '{}',
  brief text not null,
  urgent boolean not null default false,
  caller_name text,
  caller_phone text,
  address text,
  issue text,
  status text not null default 'pending' check (status in ('pending', 'ringing', 'accepted', 'unanswered', 'expired')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ava_transfers_caller_idx on public.ava_transfers (caller_id, status, created_at desc);
alter table public.ava_transfers enable row level security;
