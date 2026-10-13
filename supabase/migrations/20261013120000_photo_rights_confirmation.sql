-- YardProof: postcards use the client's own job photos only (no Google imagery).
alter table public.campaign_recipients
  add column if not exists photo_rights_confirmed_at timestamptz;
comment on column public.campaign_recipients.photo_rights_confirmed_at is
  'When the client confirmed they own the before/after photos and have the homeowner''s OK to show the property.';
comment on column public.campaign_recipients.current_image_source is
  'crew_photo | owner_upload only. Google Street View / Static Maps imagery is not allowed on postcards (Google Maps Platform terms).';
