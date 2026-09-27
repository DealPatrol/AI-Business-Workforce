-- Historical filename retained for migration ordering.
-- Street View is scouting-only and must never become printable Current or AI input.
-- Rights-cleared crew, homeowner, and licensed photos are the only valid sources.

alter table public.campaign_recipients
  drop constraint if exists campaign_recipients_current_image_source_check;

alter table public.campaign_recipients
  add constraint campaign_recipients_current_image_source_check
  check (
    current_image_source is null
    or current_image_source in ('crew_photo', 'owner_upload', 'licensed')
  );

comment on column public.campaign_recipients.current_image_source is
  'Printable Current must be rights-cleared: crew_photo, owner_upload, or licensed.';

comment on column public.campaign_recipients.street_view_pano_id is
  'Scouting metadata only. Street View pixels must not be stored, printed, or used as AI input.';

comment on column public.campaigns.street_view_image_url is
  'Deprecated. Google imagery is scouting-only and must not be persisted.';

comment on column public.campaigns.satellite_image_url is
  'Deprecated. Satellite imagery is scouting-only and must never be printed or persisted.';
