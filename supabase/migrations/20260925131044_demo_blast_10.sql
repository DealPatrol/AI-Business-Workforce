-- Demo Blast 10 is additive and safe to apply after the application deploys.
-- The application falls back when these columns are not present yet.

alter table public.campaigns
  add column if not exists campaign_type text not null default 'standard',
  add column if not exists trade text not null default 'landscaping',
  add column if not exists is_sample boolean not null default false;

alter table public.campaign_recipients
  add column if not exists change_notes text;

-- Widen status without relying on the generated name of the original CHECK.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.campaigns'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.campaigns drop constraint if exists %I',
      constraint_name
    );
  end loop;
end
$$;

alter table public.campaigns
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
