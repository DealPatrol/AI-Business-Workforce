-- Customer Desk: let a signed-in owner read only their own Executive Receptionist rows.
-- Ownership = the Supabase auth email matches ava_customers.email (case-insensitive, trimmed).
-- Writes stay on server routes (service role) that check ownership first.

create or replace function public.desk_customer_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.ava_customers c
  where coalesce(auth.jwt() ->> 'email', '') <> ''
    and lower(trim(c.email)) = lower(trim(auth.jwt() ->> 'email'))
$$;

create or replace function public.desk_onboarding_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.onboarding_id
  from public.ava_customers c
  where c.onboarding_id is not null
    and coalesce(auth.jwt() ->> 'email', '') <> ''
    and lower(trim(c.email)) = lower(trim(auth.jwt() ->> 'email'))
$$;

revoke all on function public.desk_customer_ids() from public, anon;
revoke all on function public.desk_onboarding_ids() from public, anon;
grant execute on function public.desk_customer_ids() to authenticated;
grant execute on function public.desk_onboarding_ids() to authenticated;

drop policy if exists "desk owners read their customer row" on public.ava_customers;
create policy "desk owners read their customer row"
  on public.ava_customers for select to authenticated
  using (id in (select public.desk_customer_ids()));

drop policy if exists "desk owners read their onboarding" on public.ava_onboardings;
create policy "desk owners read their onboarding"
  on public.ava_onboardings for select to authenticated
  using (id in (select public.desk_onboarding_ids()));

drop policy if exists "desk owners read their calls" on public.ava_call_leads;
create policy "desk owners read their calls"
  on public.ava_call_leads for select to authenticated
  using (onboarding_id in (select public.desk_onboarding_ids()));

drop policy if exists "desk owners read their calendar" on public.ava_calendars;
create policy "desk owners read their calendar"
  on public.ava_calendars for select to authenticated
  using (onboarding_id in (select public.desk_onboarding_ids()));

drop policy if exists "desk owners read their bookings" on public.ava_bookings;
create policy "desk owners read their bookings"
  on public.ava_bookings for select to authenticated
  using (calendar_id in (
    select k.id from public.ava_calendars k where k.onboarding_id in (select public.desk_onboarding_ids())
  ));

drop policy if exists "desk owners read their client leads" on public.er_leads;
create policy "desk owners read their client leads"
  on public.er_leads for select to authenticated
  using (client_id in (select public.desk_customer_ids()));

-- Secrets on the calendar row (Google refresh token, booking tool secret hash) stay server-only.
revoke select on public.ava_calendars from anon, authenticated;
grant select (id, onboarding_id, label, is_demo, enabled, timezone, slot_minutes, slot_capacity,
  min_notice_minutes, horizon_days, weekly_hours, blackouts, google_calendar_id, google_connected_at,
  created_at, updated_at) on public.ava_calendars to authenticated;

-- Consent IP and provisioning errors stay server-only.
revoke select on public.ava_onboardings from anon, authenticated;
grant select (id, business_name, business_hours, services, staff_name, staff_email, selected_plan,
  elevenlabs_agent_id, agent_status, phone_status, phone_number, channel_voice, channel_sms, channel_web_chat,
  launched_at, created_at, updated_at) on public.ava_onboardings to authenticated;

-- Anonymous visitors never read these tables.
revoke select on public.ava_customers, public.ava_call_leads, public.ava_bookings, public.er_leads from anon;

-- ava_call_leads had no grants for signed-in users; reads are still limited to their own rows by RLS above.
grant select on public.ava_call_leads to authenticated;
