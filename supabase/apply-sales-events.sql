-- Paste this entire file into the Supabase SQL editor to create sales event tables.
-- Safe to re-run.

create table if not exists public.sales_prospect_events (
  id uuid primary key default gen_random_uuid(),
  prospect_slug text not null,
  event_type text not null check (event_type in (
    'demo_open',
    'call_started',
    'call_ended',
    'pilot_clicked',
    'contacted',
    'demo_sent',
    'replied',
    'conversation',
    'pilot_proposed'
  )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sales_prospect_events_slug_idx
  on public.sales_prospect_events(prospect_slug, created_at desc);

create index if not exists sales_prospect_events_type_idx
  on public.sales_prospect_events(event_type, created_at desc);

alter table public.sales_prospect_events enable row level security;

create table if not exists public.sales_prospect_status (
  prospect_slug text primary key,
  status text not null default 'queued' check (status in (
    'queued',
    'contacted',
    'demo_sent',
    'opened',
    'called_ava',
    'replied',
    'conversation',
    'pilot_proposed',
    'passed'
  )),
  notes text,
  contacted_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.sales_prospect_status enable row level security;

alter table public.sales_prospect_events drop constraint if exists sales_prospect_events_event_type_check;
alter table public.sales_prospect_events
  add constraint sales_prospect_events_event_type_check check (event_type in (
    'demo_open',
    'call_started',
    'call_ended',
    'pilot_clicked',
    'contacted',
    'demo_sent',
    'replied',
    'conversation',
    'pilot_proposed'
  ));

drop policy if exists "public can insert sales events" on public.sales_prospect_events;
create policy "public can insert sales events"
  on public.sales_prospect_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read sales events" on public.sales_prospect_events;
create policy "public can read sales events"
  on public.sales_prospect_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can insert sales status" on public.sales_prospect_status;
create policy "public can insert sales status"
  on public.sales_prospect_status
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can update sales status" on public.sales_prospect_status;
create policy "public can update sales status"
  on public.sales_prospect_status
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public can read sales status" on public.sales_prospect_status;
create policy "public can read sales status"
  on public.sales_prospect_status
  for select
  to anon, authenticated
  using (true);

insert into public.sales_prospect_status (prospect_slug, status)
values
  ('acexperts', 'queued'),
  ('family-comfort-hvac', 'queued'),
  ('after-hours-hvacr', 'queued'),
  ('underwood-hvac', 'queued'),
  ('posey-family-plumbing', 'queued'),
  ('kcd-plumbing', 'queued'),
  ('owens-family-plumbing', 'queued'),
  ('ray-esser-plumbing', 'queued'),
  ('rescue-air-blountsville', 'queued'),
  ('calvin-air-mobile', 'queued'),
  ('comfort-zone-huntsville', 'queued'),
  ('all-star-plumbing-decatur', 'queued'),
  ('premier-plumbing-florence', 'queued'),
  ('southern-comfort-tuscaloosa', 'queued'),
  ('blue-flame-plumbing-bham', 'queued'),
  ('delta-hvac-montgomery', 'queued'),
  ('patriot-plumbing-auburn', 'queued'),
  ('apex-hvac-gadsden', 'queued'),
  ('quick-flow-plumbing-mobile', 'queued'),
  ('elite-hvac-dothan', 'queued')
on conflict (prospect_slug) do nothing;
