-- Aerial postcard leads: scans of a neighborhood and the homes they flagged.
-- Owner names and mailing addresses come from public county parcel records.
-- Mailing is test-mode only (Lob test key) and requires an approval per card.

create table if not exists public.aerial_lead_scans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  area_id text not null,
  bbox jsonb not null,
  business jsonb not null default '{}'::jsonb,
  price jsonb not null default '{}'::jsonb,
  thresholds jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.aerial_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scan_id uuid not null references public.aerial_lead_scans(id) on delete cascade,
  area_id text not null,
  parcel_id text not null,
  pin text,
  owner_name text not null,
  mailing jsonb,
  situs_address text not null,
  stain_score integer not null check (stain_score between 0 and 100),
  darker_pct numeric(6,1) not null,
  driveway_sqft integer not null,
  price_dollars integer not null,
  flagged boolean not null default false,
  metrics jsonb not null default '{}'::jsonb,
  status text not null default 'flagged' check (status in ('flagged', 'approved', 'rejected', 'test_mailed')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  lob_postcard_id text,
  lob_test_url text,
  test_mailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (scan_id, parcel_id)
);

create index if not exists aerial_leads_owner_created_idx on public.aerial_leads (owner_id, created_at desc);
create index if not exists aerial_lead_scans_owner_created_idx on public.aerial_lead_scans (owner_id, created_at desc);

alter table public.aerial_lead_scans enable row level security;
alter table public.aerial_leads enable row level security;

drop policy if exists "owners manage aerial lead scans" on public.aerial_lead_scans;
create policy "owners manage aerial lead scans"
  on public.aerial_lead_scans for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "owners manage aerial leads" on public.aerial_leads;
create policy "owners manage aerial leads"
  on public.aerial_leads for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

grant select, insert, update, delete on public.aerial_lead_scans to authenticated, service_role;
grant select, insert, update, delete on public.aerial_leads to authenticated, service_role;
