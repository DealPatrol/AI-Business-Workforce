-- Additive: YardProof postcard imagery (Street View internal + crew/owner Current + After)
-- Repo/DB parity for campaign-level imagery columns already present in live Supabase.
-- Locked rules:
--   * Street View / satellite = internal_reference only (geo + pano params; never print_source; never AI input)
--   * Printable Current = crew_photo or owner_upload only
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
  'INTERNAL REFERENCE ONLY. Do not use as printable Current or AI after-edit input (Maps Platform ToS). Prefer per-recipient street_view_* params.';

comment on column public.campaigns.satellite_image_url is
  'INTERNAL REFERENCE ONLY. Not a print_source.';

-- =============================================================================
-- B. Per-recipient geo + Street View params (no permanent SV print asset)
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
  'Printable Current only: crew_photo or owner_upload. Street View must never be stored here.';

comment on column public.campaign_recipients.street_view_pano_id is
  'Internal reference param only. Never feed Street View pixels into AI after-edits or print.';

create index if not exists campaign_recipients_review_status_idx
  on public.campaign_recipients (review_status);

create index if not exists campaign_recipients_imagery_status_idx
  on public.campaign_recipients (imagery_status);
