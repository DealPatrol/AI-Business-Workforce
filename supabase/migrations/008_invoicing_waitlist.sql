-- Invoicing waitlist for the Front Porch Growth homepage.
-- Product-prefixed table (invoicing_), matching ava_* and prospector_*.
-- Apply this file in the Supabase SQL editor. The app does not apply migrations itself.

create table if not exists public.invoicing_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  business_name text not null default '',
  created_at timestamptz not null default now(),
  constraint invoicing_waitlist_email_unique unique (email),
  constraint invoicing_waitlist_email_shape check (
    char_length(email) between 3 and 320
    and email = lower(email)
    and position('@' in email) > 1
  ),
  constraint invoicing_waitlist_name_length check (char_length(name) <= 120),
  constraint invoicing_waitlist_business_length check (char_length(business_name) <= 160)
);

create index if not exists invoicing_waitlist_created_idx
  on public.invoicing_waitlist (created_at desc);

alter table public.invoicing_waitlist enable row level security;

drop policy if exists "public can join invoicing waitlist" on public.invoicing_waitlist;
create policy "public can join invoicing waitlist"
  on public.invoicing_waitlist
  for insert
  to anon, authenticated
  with check (
    char_length(email) between 3 and 320
    and email = lower(email)
    and position('@' in email) > 1
    and char_length(name) <= 120
    and char_length(business_name) <= 160
  );

revoke all on table public.invoicing_waitlist from public, anon, authenticated;
grant insert on table public.invoicing_waitlist to anon, authenticated;
grant select, insert, update, delete on table public.invoicing_waitlist to service_role;

comment on table public.invoicing_waitlist is
  'Public invoicing waitlist. Insert-only for anon and authenticated. No select policy, so addresses are not readable through the Data API.';
