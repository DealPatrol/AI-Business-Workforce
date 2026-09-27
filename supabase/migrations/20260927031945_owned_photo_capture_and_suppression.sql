-- First-party photo capture, privacy-redaction gates, and suppression lists.
-- Google imagery remains scouting metadata only. Storage objects must be deleted
-- through the Storage API, so this migration queues legacy paths for the
-- authenticated cleanup endpoint instead of orphaning objects with SQL deletes.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.imagery_storage_purge_queue (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null,
  reason text not null,
  queued_at timestamptz not null default now(),
  purged_at timestamptz,
  purge_error text,
  unique (bucket_id, object_path)
);

alter table public.imagery_storage_purge_queue enable row level security;
revoke all on public.imagery_storage_purge_queue from anon, authenticated;

insert into public.imagery_storage_purge_queue (bucket_id, object_path, reason)
select bucket_id, name, 'legacy_google_imagery'
from storage.objects
where
  name ~* '(^|/)(current-streetview|preview-satellite)-'
  or name ~* '(^|/)(street[_-]?view|google[_-]?(streetview|satellite))'
on conflict (bucket_id, object_path) do nothing;

update public.campaign_recipients
set
  current_image_url = null,
  current_image_source = null,
  current_image_usage = null,
  after_image_url = null,
  after_image_provider = null,
  after_prompt_version = null,
  review_status = 'pending',
  postcard_approved_at = null,
  imagery_status = 'needs_photo',
  imagery_error = 'Legacy Google imagery removed. Capture or upload a rights-cleared photo.'
where
  current_image_source = 'street_view'
  or imagery_provider in ('google_street_view', 'google_satellite');

update public.campaigns
set
  street_view_image_url = null,
  satellite_image_url = null
where street_view_image_url is not null or satellite_image_url is not null;

alter table public.campaigns
  drop column if exists street_view_image_url,
  drop column if exists satellite_image_url;

alter table public.campaign_recipients
  drop constraint if exists campaign_recipients_current_image_source_check;

alter table public.campaign_recipients
  add constraint campaign_recipients_current_image_source_check
  check (
    current_image_source is null
    or current_image_source in ('crew_photo', 'owner_upload', 'licensed')
  );

alter table public.campaign_recipients
  add column if not exists capture_lat double precision,
  add column if not exists capture_lng double precision,
  add column if not exists capture_heading double precision,
  add column if not exists captured_at timestamptz,
  add column if not exists captured_by text,
  add column if not exists rights_basis text
    check (
      rights_basis is null
      or rights_basis in ('crew_owned', 'homeowner_upload', 'licensed')
    ),
  add column if not exists rights_license_version text,
  add column if not exists current_storage_path text,
  add column if not exists privacy_redaction_status text not null default 'pending'
    check (privacy_redaction_status in ('pending', 'processing', 'redacted', 'failed')),
  add column if not exists privacy_redacted_at timestamptz,
  add column if not exists privacy_redaction_provider text,
  add column if not exists privacy_redaction_details jsonb,
  add column if not exists do_not_photograph boolean not null default false,
  add column if not exists do_not_mail boolean not null default false;

comment on column public.campaign_recipients.current_image_source is
  'Printable/AI source must be rights-cleared: crew_photo, owner_upload, or licensed. Google imagery is never valid.';
comment on column public.campaign_recipients.rights_basis is
  'Documented rights basis required before AI render, approval, or print.';
comment on column public.campaign_recipients.privacy_redaction_status is
  'Must be redacted before AI render, public display, approval, or print.';

create table if not exists public.campaign_opt_outs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  recipient_id uuid references public.campaign_recipients(id) on delete set null,
  address_key text not null,
  do_not_photograph boolean not null default true,
  do_not_mail boolean not null default true,
  source text not null check (source in ('homeowner', 'operator', 'import')),
  note text,
  created_at timestamptz not null default now(),
  unique (owner_id, address_key)
);

create index if not exists campaign_opt_outs_campaign_idx
  on public.campaign_opt_outs (campaign_id, created_at desc);
create index if not exists campaign_opt_outs_address_idx
  on public.campaign_opt_outs (owner_id, address_key);

alter table public.campaign_opt_outs enable row level security;

create policy "owners manage campaign opt outs"
  on public.campaign_opt_outs
  for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on public.campaign_opt_outs from anon;
grant select, insert, update, delete on public.campaign_opt_outs to authenticated;

create table if not exists public.recipient_photo_licenses (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.campaign_recipients(id) on delete cascade,
  source_hash text not null,
  license_version text not null,
  original_filename text,
  accepted_at timestamptz not null default now()
);

create index if not exists recipient_photo_licenses_recipient_idx
  on public.recipient_photo_licenses (recipient_id, accepted_at desc);

alter table public.recipient_photo_licenses enable row level security;

create policy "owners read recipient photo licenses"
  on public.recipient_photo_licenses
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = recipient_photo_licenses.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

revoke all on public.recipient_photo_licenses from anon;
grant select on public.recipient_photo_licenses to authenticated;

create or replace function private.sync_recipient_opt_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recipient_id is not null then
    update public.campaign_recipients
    set
      do_not_photograph = new.do_not_photograph,
      do_not_mail = new.do_not_mail
    where id = new.recipient_id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_recipient_opt_out() from public, anon, authenticated;

drop trigger if exists sync_recipient_opt_out_after_write on public.campaign_opt_outs;
create trigger sync_recipient_opt_out_after_write
after insert or update of do_not_photograph, do_not_mail
on public.campaign_opt_outs
for each row execute function private.sync_recipient_opt_out();
