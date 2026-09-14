-- Allow the public sales tracker and demo pages to write/read events when
-- only the publishable key is configured. The service-role key still bypasses RLS.

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
