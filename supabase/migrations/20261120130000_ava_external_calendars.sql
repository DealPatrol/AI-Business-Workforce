-- Cal.com / Calendly busy-time sources for an Ava booking calendar.
-- The owner pastes a Cal.com API key or Calendly personal access token in the Desk; it is stored encrypted
-- (AES-256-GCM, same helper as Google refresh tokens) and only used to read busy times.
alter table public.ava_calendars
  add column if not exists external_calendar_provider text check (external_calendar_provider in ('calcom', 'calendly')),
  add column if not exists external_calendar_token_enc text,
  add column if not exists external_calendar_connected_at timestamptz,
  add column if not exists external_calendar_last_error text;
