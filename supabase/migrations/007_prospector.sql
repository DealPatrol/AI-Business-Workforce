-- Lead Finder: saved campaigns, Google Maps leads, drafts, send log, and suppression.
-- Apply this file in the Supabase SQL editor. The app does not apply migrations itself.

create table if not exists public.prospector_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  sender_name text not null default '',
  sender_email text not null default '',
  mailing_address text not null default '',
  booking_url text not null default '',
  daily_cap integer not null default 25 check (daily_cap >= 1 and daily_cap <= 200),
  default_location text not null default '',
  send_spacing_seconds integer not null default 90 check (send_spacing_seconds >= 30 and send_spacing_seconds <= 3600),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospector_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_url text not null,
  notes text not null default '',
  location text not null default '',
  radius_meters integer check (radius_meters is null or (radius_meters > 0 and radius_meters <= 50000)),
  offer_summary text not null default '',
  targets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prospector_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.prospector_campaigns(id) on delete cascade,
  place_id text not null,
  name text not null,
  category text not null default '',
  types text[] not null default '{}',
  address text not null default '',
  phone text,
  website text,
  rating numeric,
  review_count integer,
  maps_url text,
  emails text[] not null default '{}',
  contact_name text,
  enrichment_status text not null default 'pending' check (enrichment_status in ('pending', 'enriched', 'no_website', 'failed')),
  channel text not null default 'unknown' check (channel in ('unknown', 'email', 'call_only')),
  status text not null default 'new' check (status in ('new', 'drafted', 'approved', 'sent', 'replied', 'booked', 'not_interested', 'do_not_contact')),
  search_query text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, place_id)
);

create table if not exists public.prospector_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.prospector_leads(id) on delete cascade,
  kind text not null check (kind in ('initial', 'followup_1', 'followup_2')),
  subject text not null,
  body text not null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, kind)
);

create table if not exists public.prospector_suppressions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  reason text not null default 'unsubscribe' check (reason in ('unsubscribe', 'manual', 'do_not_contact')),
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

create table if not exists public.prospector_sends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.prospector_leads(id) on delete cascade,
  draft_id uuid references public.prospector_drafts(id) on delete set null,
  to_email text not null,
  from_email text not null,
  subject text not null,
  body text not null default '',
  provider text not null default 'stub',
  provider_message_id text,
  status text not null check (status in ('sent', 'failed', 'suppressed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists prospector_campaigns_owner_idx
  on public.prospector_campaigns (owner_id, created_at desc);
create index if not exists prospector_leads_campaign_idx
  on public.prospector_leads (campaign_id, created_at desc);
create index if not exists prospector_drafts_lead_idx
  on public.prospector_drafts (lead_id);
create index if not exists prospector_suppressions_owner_email_idx
  on public.prospector_suppressions (owner_id, email);
create index if not exists prospector_sends_owner_sent_idx
  on public.prospector_sends (owner_id, status, sent_at desc);
create unique index if not exists prospector_sends_one_success_per_draft
  on public.prospector_sends (draft_id)
  where status = 'sent' and draft_id is not null;

alter table public.prospector_settings enable row level security;
alter table public.prospector_campaigns enable row level security;
alter table public.prospector_leads enable row level security;
alter table public.prospector_drafts enable row level security;
alter table public.prospector_suppressions enable row level security;
alter table public.prospector_sends enable row level security;

drop policy if exists "owners manage prospector settings" on public.prospector_settings;
create policy "owners manage prospector settings"
  on public.prospector_settings for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage prospector campaigns" on public.prospector_campaigns;
create policy "owners manage prospector campaigns"
  on public.prospector_campaigns for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage prospector leads" on public.prospector_leads;
create policy "owners manage prospector leads"
  on public.prospector_leads for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage prospector drafts" on public.prospector_drafts;
create policy "owners manage prospector drafts"
  on public.prospector_drafts for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage prospector suppressions" on public.prospector_suppressions;
create policy "owners manage prospector suppressions"
  on public.prospector_suppressions for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage prospector sends" on public.prospector_sends;
create policy "owners manage prospector sends"
  on public.prospector_sends for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

grant select, insert, update, delete on public.prospector_settings to authenticated, service_role;
grant select, insert, update, delete on public.prospector_campaigns to authenticated, service_role;
grant select, insert, update, delete on public.prospector_leads to authenticated, service_role;
grant select, insert, update, delete on public.prospector_drafts to authenticated, service_role;
grant select, insert, update, delete on public.prospector_suppressions to authenticated, service_role;
grant select, insert, update, delete on public.prospector_sends to authenticated, service_role;
