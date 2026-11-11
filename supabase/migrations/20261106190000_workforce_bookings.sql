-- Front Porch Growth workforce booking calendar (deposits).
-- Separate from Executive Receptionist billing. Apply after review; the app
-- does not run migrations itself. Do not apply to production until Cole approves.

create table if not exists public.booking_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  email text,
  timezone text not null default 'America/Chicago',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint booking_businesses_slug_len check (char_length(slug) between 2 and 60)
);

create unique index if not exists booking_businesses_slug_idx
  on public.booking_businesses (slug);

create index if not exists booking_businesses_owner_idx
  on public.booking_businesses (owner_id);

create table if not exists public.booking_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 720),
  price_cents integer not null check (price_cents >= 0),
  deposit_cents integer check (deposit_cents is null or deposit_cents >= 0),
  deposit_percent numeric check (deposit_percent is null or (deposit_percent > 0 and deposit_percent <= 100)),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_services_deposit_present check (deposit_cents is not null or deposit_percent is not null)
);

create index if not exists booking_services_business_idx
  on public.booking_services (business_id);

create table if not exists public.booking_weekly_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  constraint booking_weekly_hours_order check (end_time > start_time)
);

create index if not exists booking_weekly_hours_business_idx
  on public.booking_weekly_hours (business_id, weekday);

create table if not exists public.booking_blackouts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  note text,
  constraint booking_blackouts_order check (end_date >= start_date)
);

create index if not exists booking_blackouts_business_idx
  on public.booking_blackouts (business_id, start_date);

create table if not exists public.booking_appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.booking_businesses(id) on delete cascade,
  service_id uuid not null references public.booking_services(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'held'
    check (status in ('held', 'confirmed', 'expired', 'canceled')),
  hold_expires_at timestamptz,
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  deposit_cents integer not null check (deposit_cents >= 0),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  lead_id uuid references public.er_leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_appointments_range check (end_at > start_at)
);

create unique index if not exists booking_appointments_session_idx
  on public.booking_appointments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null and stripe_checkout_session_id <> '';

create index if not exists booking_appointments_business_start_idx
  on public.booking_appointments (business_id, start_at);

alter table public.booking_businesses enable row level security;
alter table public.booking_services enable row level security;
alter table public.booking_weekly_hours enable row level security;
alter table public.booking_blackouts enable row level security;
alter table public.booking_appointments enable row level security;

create policy "owners manage booking businesses"
  on public.booking_businesses for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owners manage booking services"
  on public.booking_services for all
  using (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "owners manage booking hours"
  on public.booking_weekly_hours for all
  using (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "owners manage booking blackouts"
  on public.booking_blackouts for all
  using (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "owners manage booking appointments"
  on public.booking_appointments for all
  using (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.booking_businesses b where b.id = business_id and b.owner_id = auth.uid()));

comment on table public.booking_businesses is
  'Front Porch Growth workforce booking pages. Public checkout uses the service role; owners manage their own rows.';
