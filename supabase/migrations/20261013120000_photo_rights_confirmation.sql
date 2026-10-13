-- YardProof (2026-10-13): owned photos, property-record targeting, Lob test sends.
-- Additive only: no drops, no constraint changes.
alter table public.campaign_recipients
  add column if not exists photo_rights_confirmed_at timestamptz,
  add column if not exists parcel_id text,
  add column if not exists parcel_json jsonb,
  add column if not exists lob_postcard_id text,
  add column if not exists lob_mode text,
  add column if not exists lob_sent_at timestamptz,
  add column if not exists lob_error text;

alter table public.campaigns
  add column if not exists targeting_json jsonb,
  add column if not exists postcard_size text,
  add column if not exists source text;

comment on column public.campaign_recipients.photo_rights_confirmed_at is
  'When the client confirmed they own the before/after photos and have the homeowner''s OK to show the property.';
