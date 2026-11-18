-- Append-only SMS consent records (Twilio toll-free verification / CTIA evidence).
-- One row per answer: Ava's verbal script (method verbal), the missed-call prompt (keypad or verbal),
-- and the website setup-form checkbox (web_form). A later "no" or STOP never deletes an earlier row.
-- Retention: keep rows at least 4 years after the last message to that number. No automatic deletion.
-- Applied to production with the Supabase MCP on 2026-11-18. Safe to re-run.

create table if not exists public.sms_consents (
  id uuid primary key default gen_random_uuid(),
  phone text,
  method text not null check (method in ('verbal', 'keypad', 'web_form')),
  answer text not null check (answer in ('yes', 'no')),
  script_version text not null,
  consent_text text not null,
  call_sid text,
  conversation_id text,
  agent_id text,
  onboarding_id uuid references public.ava_onboardings(id) on delete set null,
  business_name text,
  source text not null,
  event_key text unique,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists sms_consents_phone_created_idx on public.sms_consents (phone, created_at desc);
create index if not exists sms_consents_conversation_idx on public.sms_consents (conversation_id);
create index if not exists sms_consents_call_sid_idx on public.sms_consents (call_sid);

-- Server-only: RLS on with no policies, so only the service role (server routes) can read or write.
alter table public.sms_consents enable row level security;
revoke all on public.sms_consents from anon, authenticated;

comment on table public.sms_consents is
  'Append-only SMS consent log: verbal (Ava), keypad/verbal (missed-call prompt), web_form (setup checkbox). Kept 4+ years after the last message.';
