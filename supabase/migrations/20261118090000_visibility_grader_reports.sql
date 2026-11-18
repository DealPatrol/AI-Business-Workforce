-- Free AI visibility grader submissions for /ai-visibility.
-- Applied to project ielfvaguaebdlyfdkgtt on 2026-11-18. The app does not apply migrations itself.

create table if not exists public.visibility_grader_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null default '',
  website text not null,
  final_url text not null default '',
  trade text not null default '',
  city text not null default '',
  score integer,
  checks jsonb not null default '[]'::jsonb,
  facts jsonb not null default '{}'::jsonb,
  ai_checks jsonb not null default '[]'::jsonb,
  ai_check_status text not null default 'queued',
  source text not null default 'ai-visibility grader',
  user_agent text not null default '',
  constraint visibility_grader_email_length check (char_length(email) <= 320),
  constraint visibility_grader_text_lengths check (char_length(website) <= 500 and char_length(trade) <= 80 and char_length(city) <= 120)
);

create index if not exists visibility_grader_reports_created_idx
  on public.visibility_grader_reports (created_at desc);

alter table public.visibility_grader_reports enable row level security;

revoke all on table public.visibility_grader_reports from public, anon, authenticated;
grant select, insert, update, delete on table public.visibility_grader_reports to service_role;

comment on table public.visibility_grader_reports is
  'Free AI visibility grader submissions (real SEO audit results + lead email). Service-role only; no public policies.';
