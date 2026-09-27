-- Additive: YardProof postcard imagery (Current / After / review + campaign geo parity)
-- Repo/DB parity for campaign-level imagery columns already present in live Supabase.
-- NOTE: Google imagery is scouting-only and is never a printable/AI source.
--   * crew_photo / owner_upload / licensed = rights-cleared Current
--   * After = ai_render; human review_status gate before mail

-- =============================================================================
-- A. Campaign-level imagery columns (live DB already has these; IF NOT EXISTS for parity)
-- =============================================================================

alter table public.campaigns
  add column if not exists normalized_address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists satellite_image_url text,
  add column if not exists street_view_image_url text,
  add column if not exists street_view_available boolean,
  add column if not exists imagery_provider text,
  add column if not exists imagery_fetched_at timestamptz;

comment on column public.campaigns.street_view_image_url is
  'Deprecated. Street View is scouting-only and pixels must not be persisted.';

comment on column public.campaigns.satellite_image_url is
  'Deprecated. Satellite imagery is scouting-only and must never be printed or persisted.';

-- =============================================================================
-- B. Per-recipient geo + Street View scouting metadata (no image storage)
-- =============================================================================

alter table public.campaign_recipients
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists normalized_address text,
  add column if not exists street_view_pano_id text,
  add column if not exists street_view_heading double precision,
  add column if not exists street_view_pitch double precision,
  add column if not exists street_view_fov double precision,
  add column if not exists street_view_available boolean,
  add column if not exists street_view_captured_at date,
  add column if not exists imagery_provider text,
  add column if not exists imagery_fetched_at timestamptz;

-- =============================================================================
-- C. Printable Current + After + review gate
-- =============================================================================

alter table public.campaign_recipients
  add column if not exists current_image_url text,
  add column if not exists current_image_source text
    check (
      current_image_source is null
      or current_image_source in ('crew_photo', 'owner_upload')
    ),
  add column if not exists current_image_usage text
    check (
      current_image_usage is null
      or current_image_usage in ('print_source', 'ai_input')
    ),
  add column if not exists after_image_url text,
  add column if not exists after_image_provider text,
  add column if not exists after_prompt_version text,
  add column if not exists concept_json jsonb not null default '{}'::jsonb,
  add column if not exists review_status text not null default 'pending'
    check (
      review_status in (
        'pending',
        'pending_review',
        'approved',
        'changes_requested',
        'rejected'
      )
    ),
  add column if not exists review_notes text,
  add column if not exists postcard_approved_at timestamptz,
  add column if not exists imagery_status text not null default 'pending'
    check (
      imagery_status in (
        'pending',
        'geocoding',
        'needs_photo',
        'rendering_after',
        'ready',
        'failed'
      )
    ),
  add column if not exists imagery_error text,
  add column if not exists postcard_mock_url text;

comment on column public.campaign_recipients.current_image_source is
  'Rights-cleared printable/AI source. Street View is never valid.';

comment on column public.campaign_recipients.street_view_pano_id is
  'Scouting metadata only. Street View pixels must not be stored, printed, or used as AI input.';

create index if not exists campaign_recipients_review_status_idx
  on public.campaign_recipients (review_status);

create index if not exists campaign_recipients_imagery_status_idx
  on public.campaign_recipients (imagery_status);
