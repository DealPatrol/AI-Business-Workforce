-- Lob postcard fulfillment, explicit campaign approval, and delivery tracking.

alter table public.campaigns
  add column if not exists mail_approved_at timestamptz,
  add column if not exists mail_approved_by uuid references auth.users(id) on delete set null,
  add column if not exists mail_mode text check (mail_mode is null or mail_mode in ('test', 'live')),
  add column if not exists mail_price_per_card_cents integer
    check (mail_price_per_card_cents is null or mail_price_per_card_cents >= 0),
  add column if not exists mail_estimated_total_cents integer
    check (mail_estimated_total_cents is null or mail_estimated_total_cents >= 0),
  add column if not exists mail_status text not null default 'draft'
    check (mail_status in ('draft', 'approved', 'sending', 'sent', 'partial', 'failed'));

alter table public.campaign_recipients
  add column if not exists address_verification_status text
    check (
      address_verification_status is null
      or address_verification_status in ('deliverable', 'deliverable_unnecessary_unit', 'undeliverable', 'error')
    ),
  add column if not exists address_verified_at timestamptz,
  add column if not exists address_verification_details jsonb,
  add column if not exists mail_vendor text check (mail_vendor is null or mail_vendor = 'lob'),
  add column if not exists mail_vendor_job_id text,
  add column if not exists mail_status text not null default 'not_sent',
  add column if not exists mail_mode text check (mail_mode is null or mail_mode in ('test', 'live')),
  add column if not exists mail_sent_at timestamptz,
  add column if not exists mail_last_event_at timestamptz,
  add column if not exists mail_error text;

create unique index if not exists campaign_recipients_mail_vendor_job_idx
  on public.campaign_recipients (mail_vendor, mail_vendor_job_id)
  where mail_vendor_job_id is not null;

create table if not exists public.postcard_mail_events (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.campaign_recipients(id) on delete cascade,
  vendor text not null check (vendor = 'lob'),
  vendor_event_id text not null,
  event_type text not null,
  occurred_at timestamptz,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (vendor, vendor_event_id)
);

create index if not exists postcard_mail_events_recipient_received_idx
  on public.postcard_mail_events (recipient_id, received_at desc);

alter table public.postcard_mail_events enable row level security;

create policy "owners read postcard mail events"
  on public.postcard_mail_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.campaign_recipients
      join public.campaigns on campaigns.id = campaign_recipients.campaign_id
      where campaign_recipients.id = postcard_mail_events.recipient_id
        and campaigns.owner_id = (select auth.uid())
    )
  );

revoke all on public.postcard_mail_events from anon;
grant select on public.postcard_mail_events to authenticated;

comment on column public.campaigns.mail_approved_at is
  'Set only by the authenticated Approve & send action after a fresh cost preview.';
comment on column public.campaigns.mail_price_per_card_cents is
  'Configured estimate captured at approval; not a vendor quote or invoice.';
