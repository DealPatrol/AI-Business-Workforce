-- Executive Receptionist client lead CRM.
-- Apply in the Supabase SQL editor after review. The app does not apply migrations itself.
-- Do not run against production until Cole approves.

create table if not exists public.er_leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.ava_customers(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  caller_name text,
  caller_phone text,
  job_type text,
  summary text not null default '',
  called_at timestamptz not null default now(),
  source text not null default 'receptionist call'
    check (source in ('receptionist call', 'web form', 'text-us', 'online booking')),
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Booked', 'Not a fit')),
  notes text not null default '',
  booked_at timestamptz,
  billed_at timestamptz,
  billing_skipped boolean not null default false,
  billing_skip_reason text,
  conversation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists er_leads_conversation_idx
  on public.er_leads (conversation_id)
  where conversation_id is not null and conversation_id <> '';

create index if not exists er_leads_owner_called_idx
  on public.er_leads (owner_id, called_at desc);

create index if not exists er_leads_client_called_idx
  on public.er_leads (client_id, called_at desc);

create index if not exists er_leads_business_called_idx
  on public.er_leads (business_id, called_at desc);

create index if not exists er_leads_status_idx
  on public.er_leads (status);

alter table public.er_leads enable row level security;

create policy "owners manage their er leads"
  on public.er_leads
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

comment on table public.er_leads is
  'Executive Receptionist caller leads for the client CRM. Owners see rows where owner_id = auth.uid(); ingest uses the service role.';
