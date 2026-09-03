create table if not exists public.sales_prospect_events (
  id uuid primary key default gen_random_uuid(),
  prospect_slug text not null,
  event_type text not null check (event_type in (
    'demo_open',
    'call_started',
    'call_ended',
    'pilot_clicked',
    'contacted',
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
