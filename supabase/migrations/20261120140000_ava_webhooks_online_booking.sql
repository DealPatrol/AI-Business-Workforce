-- Outbound call webhooks (Zapier / Make / custom) and online-booking emails.
alter table public.ava_onboardings
  add column if not exists outbound_webhook_url text,
  add column if not exists outbound_webhook_secret_enc text;

alter table public.ava_bookings
  add column if not exists caller_email text;
