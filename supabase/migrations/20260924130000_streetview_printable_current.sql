-- Flip product rule: Street View Static may be printable Current + AI After input.
-- Supersedes locks in 20260924120000 that barred street_view from current_image_source.
-- Crew/owner remain optional alternate Current sources. Human review gate unchanged.

-- Drop legacy check that only allowed crew_photo | owner_upload
alter table public.campaign_recipients
  drop constraint if exists campaign_recipients_current_image_source_check;

alter table public.campaign_recipients
  add constraint campaign_recipients_current_image_source_check
  check (
    current_image_source is null
    or current_image_source in ('street_view', 'crew_photo', 'owner_upload')
  );

comment on column public.campaign_recipients.current_image_source is
  'Printable Current: street_view (preferred product path), or optional crew_photo / owner_upload.';

comment on column public.campaign_recipients.street_view_pano_id is
  'Street View pano param. Durable Current pixels live in Storage (current_image_url) when source=street_view.';

comment on column public.campaigns.street_view_image_url is
  'Optional campaign-level SV URL. Prefer per-recipient current_image_url with source=street_view for print/AI.';

comment on column public.campaigns.satellite_image_url is
  'Operator fallback preview when Street View is unavailable. Not a printable Current by default.';
