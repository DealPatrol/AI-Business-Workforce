create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_name text not null,
  business_phone text,
  business_email text,
  status text not null default 'draft' check (status in ('draft', 'active', 'complete')),
  created_at timestamptz not null default now()
);

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  public_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  homeowner_name text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  concept_image_url text,
  concept_summary text,
  created_at timestamptz not null default now()
);

create table public.recipient_scans (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.campaign_recipients(id) on delete cascade,
  user_agent text,
  scanned_at timestamptz not null default now()
);

create table public.estimate_requests (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.campaign_recipients(id) on delete cascade,
  dedupe_key text not null,
  name text not null,
  email text,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  requested_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

create index campaigns_owner_created_idx
  on public.campaigns(owner_id, created_at desc);
create index campaign_recipients_campaign_created_idx
  on public.campaign_recipients(campaign_id, created_at desc);
create index recipient_scans_recipient_scanned_idx
  on public.recipient_scans(recipient_id, scanned_at desc);
create unique index recipient_scans_dedupe_idx
  on public.recipient_scans(
    recipient_id,
    md5(coalesce(user_agent, '')),
    date_bin('30 minutes', scanned_at, '2000-01-01 00:00:00+00'::timestamptz)
  );
create index estimate_requests_recipient_requested_idx
  on public.estimate_requests(recipient_id, requested_at desc);
create unique index estimate_requests_recipient_dedupe_idx
  on public.estimate_requests(recipient_id, dedupe_key);

alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.recipient_scans enable row level security;
alter table public.estimate_requests enable row level security;

create policy "owners manage campaigns"
  on public.campaigns
  for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "owners manage campaign recipients"
  on public.campaign_recipients
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = campaign_recipients.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = campaign_recipients.campaign_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy "owners read recipient scans"
  on public.recipient_scans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = recipient_scans.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy "owners read estimate requests"
  on public.estimate_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = estimate_requests.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

create policy "owners update estimate requests"
  on public.estimate_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = estimate_requests.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = estimate_requests.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

revoke all on public.campaigns from anon;
revoke all on public.campaign_recipients from anon;
revoke all on public.recipient_scans from anon;
revoke all on public.estimate_requests from anon;

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.campaign_recipients to authenticated;
grant select on public.recipient_scans to authenticated;
grant select, update on public.estimate_requests to authenticated;
