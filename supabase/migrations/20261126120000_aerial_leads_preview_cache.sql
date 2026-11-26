-- Cache the AI-cleaned driveway preview per lead so each card calls the paid
-- image model at most once (proof views and the Lob test reuse it).
alter table public.aerial_leads add column if not exists cleaned_preview_jpeg_b64 text;
alter table public.aerial_leads add column if not exists cleaned_preview_model text;
alter table public.aerial_leads add column if not exists cleaned_preview_at timestamptz;
