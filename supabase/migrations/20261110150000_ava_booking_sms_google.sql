-- Round 3: caller text confirmations and two-way Google Calendar sync for Ava bookings.
alter table public.ava_calendars
  add column if not exists google_refresh_token_enc text,
  add column if not exists google_calendar_id text,
  add column if not exists google_connected_at timestamptz,
  add column if not exists google_last_error text;

alter table public.ava_bookings
  add column if not exists sms_opt_in boolean not null default false,
  add column if not exists sms_status text,
  add column if not exists sms_sid text,
  add column if not exists google_event_id text;
