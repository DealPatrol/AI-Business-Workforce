-- Owner-set average job value for the Desk "estimated revenue" metric. Not applied automatically.
alter table public.ava_onboardings add column if not exists avg_job_value_cents integer
  check (avg_job_value_cents is null or (avg_job_value_cents between 100 and 10000000));

-- Signed-in owners read it through their own session (row-level security already limits rows).
grant select (avg_job_value_cents) on public.ava_onboardings to authenticated;
