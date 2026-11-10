-- Channel choice for Executive Receptionist customers (voice / SMS / website chat).
-- Additive only. Safe to re-run. The app does not apply migrations itself.
-- SMS remains stored-but-inactive until carrier approval; sending stays off.

alter table public.ava_onboardings
  add column if not exists channel_voice boolean not null default true,
  add column if not exists channel_sms boolean not null default false,
  add column if not exists channel_web_chat boolean not null default false;

comment on column public.ava_onboardings.channel_voice is
  'Customer wants phone answering. Default true. Number attach stays manual.';
comment on column public.ava_onboardings.channel_sms is
  'Customer wants texting (missed-call text-back). Stored now; not activated until carrier approval.';
comment on column public.ava_onboardings.channel_web_chat is
  'Customer wants the website chat embed for their ElevenLabs agent.';
