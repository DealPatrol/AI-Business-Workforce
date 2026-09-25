-- Demo Blast 10 is additive and safe to apply after the application deploys.
-- The application falls back when these columns are not present yet.

alter table public.campaigns
  add column if not exists campaign_type text not null default 'standard',
  add column if not exists trade text not null default 'landscaping',
  add column if not exists is_sample boolean not null default false;

alter table public.campaign_recipients
  add column if not exists change_notes text;

alter table public.campaigns
  drop constraint if exists campaigns_status_check,
  drop constraint if exists campaigns_campaign_type_check,
  drop constraint if exists campaigns_trade_check;

alter table public.campaigns
  add constraint campaigns_status_check
    check (status in ('draft', 'active', 'complete', 'ready_to_mail')),
  add constraint campaigns_campaign_type_check
    check (campaign_type in ('standard', 'demo_10')),
  add constraint campaigns_trade_check
    check (
      trade in (
        'landscaping',
        'roofing',
        'pressure_washing',
        'exterior_painting',
        'fencing',
        'tree_service',
        'hardscaping',
        'outdoor_lighting',
        'gutter',
        'concrete',
        'siding'
      )
    );

create index if not exists campaigns_owner_type_created_idx
  on public.campaigns (owner_id, campaign_type, created_at desc);

comment on column public.campaigns.campaign_type is
  'Product workflow. demo_10 is the 10-card review-before-mail demonstration.';
comment on column public.campaigns.trade is
  'Concept profile key used for scope, prompt style, and curated selections.';
comment on column public.campaigns.is_sample is
  'True when imagery or addresses are explicitly illustrative placeholders.';
comment on column public.campaign_recipients.change_notes is
  'Contractor-requested edits preserved separately from general review notes.';

-- One transaction prevents cards becoming approved when the campaign status
-- update fails. The function is callable only by the server's service role;
-- the API still authenticates the user and passes their verified id.
create or replace function public.approve_demo10_campaign(
  p_campaign_id uuid,
  p_owner_id uuid
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  card_count integer;
begin
  if not exists (
    select 1
    from public.campaigns
    where id = p_campaign_id
      and owner_id = p_owner_id
      and campaign_type = 'demo_10'
  ) then
    raise exception using
      errcode = 'P0002',
      message = 'Demo 10 campaign not found';
  end if;

  select count(*) into card_count
  from public.campaign_recipients
  where campaign_id = p_campaign_id;

  if card_count < 1 or card_count > 10 then
    raise exception using
      errcode = '23514',
      message = 'Demo Blast 10 must contain between 1 and 10 cards';
  end if;

  if exists (
    select 1
    from public.campaign_recipients
    where campaign_id = p_campaign_id
      and (
        review_status not in ('pending_review', 'approved')
        or current_image_url is null
        or after_image_url is null
        or current_image_source not in ('street_view', 'crew_photo', 'owner_upload')
      )
  ) then
    raise exception using
      errcode = '23514',
      message = 'Every card must be review-ready with no unresolved change requests';
  end if;

  update public.campaign_recipients
  set
    review_status = 'approved',
    postcard_approved_at = coalesce(postcard_approved_at, now())
  where campaign_id = p_campaign_id;

  update public.campaigns
  set status = 'ready_to_mail'
  where id = p_campaign_id
    and owner_id = p_owner_id;

  return card_count;
end;
$$;

revoke all on function public.approve_demo10_campaign(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.approve_demo10_campaign(uuid, uuid)
  to service_role;
