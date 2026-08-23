create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_type text,
  service_area text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text,
  email text not null,
  phone text,
  business_name text,
  business_type text,
  service_area text,
  primary_goal text,
  pain_points text[],
  budget text,
  recommendation jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.contractor_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  gross_margin numeric not null default 40 check (gross_margin > 0 and gross_margin < 90),
  labor_rate numeric not null default 65,
  crew_size int not null default 2,
  equipment_charge numeric not null default 0,
  delivery_charge numeric not null default 0,
  waste_percent numeric not null default 10,
  minimum_job_price numeric not null default 500,
  supplier_discount_percent numeric not null default 0,
  tax_percent numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_address text not null,
  homeowner_name text,
  homeowner_email text,
  style text not null default 'clean-simple',
  budget_band text,
  source_image_url text,
  rendered_image_url text,
  materials jsonb not null default '[]'::jsonb,
  direct_cost numeric,
  recommended_price numeric,
  homeowner_range text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  agent_type text not null,
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  estimated_cost numeric,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.businesses enable row level security;
alter table public.audit_leads enable row level security;
alter table public.contractor_settings enable row level security;
alter table public.projects enable row level security;
alter table public.agent_runs enable row level security;

create policy "owners manage businesses" on public.businesses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage audit leads" on public.audit_leads for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage settings" on public.contractor_settings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage projects" on public.projects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage runs" on public.agent_runs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists audit_leads_owner_created_idx on public.audit_leads(owner_id, created_at desc);
create index if not exists projects_owner_created_idx on public.projects(owner_id, created_at desc);
create index if not exists agent_runs_owner_created_idx on public.agent_runs(owner_id, created_at desc);
