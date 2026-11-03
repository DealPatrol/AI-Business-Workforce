-- SMS consent for Executive Receptionist owner lead-alert texts.
-- Apply in the Supabase SQL editor BEFORE deploying the code that reads these columns.
-- The app does not apply migrations itself. Safe to re-run.
--
-- Existing rows get sms_consent = false, so owner lead-alert TEXTS stop for every existing
-- customer until they opt in through the onboarding form. Lead EMAILS are unchanged.

alter table public.ava_onboardings
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz,
  add column if not exists sms_consent_text text,
  add column if not exists sms_consent_ip text;

comment on column public.ava_onboardings.sms_consent is
  'True only after the owner ticked the unchecked, optional SMS lead-alert box for staff_phone. Texts are sent only when true.';
comment on column public.ava_onboardings.sms_consent_at is
  'When the owner agreed to SMS lead alerts. Cleared when consent is withdrawn or the phone changes.';
comment on column public.ava_onboardings.sms_consent_text is
  'Exact consent wording shown next to the checkbox when the owner agreed.';
comment on column public.ava_onboardings.sms_consent_ip is
  'Optional: client IP address at the time of consent.';

-- Rollback (manual, only if needed):
--   alter table public.ava_onboardings
--     drop column if exists sms_consent, drop column if exists sms_consent_at,
--     drop column if exists sms_consent_text, drop column if exists sms_consent_ip;
