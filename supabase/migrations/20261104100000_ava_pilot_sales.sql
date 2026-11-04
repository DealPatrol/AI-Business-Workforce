-- Outcome-based pilot billing: booked jobs ("sales") that add a $50 charge to the next invoice.
-- Apply in the Supabase SQL editor (or `supabase db push`) BEFORE deploying the code that reads these tables.
-- The app does not apply migrations itself. Safe to re-run (idempotent). NOT applied by the author.
--
-- Additive only: existing rows and the live /receptionist plans are untouched.

-- 1) One row per booked job. unique(lead_id) is the idempotency guard: a lead can be marked booked once.
create table if not exists public.ava_sales (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.ava_call_leads(id) on delete restrict,
  onboarding_id uuid references public.ava_onboardings(id) on delete set null,
  customer_id uuid references public.ava_customers(id) on delete set null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  plan text not null,
  -- Stripe billing period the sale falls in. All sales with the same (subscription, period_start)
  -- land on the same invoice, so the $397 cap is enforced per this group.
  period_start timestamptz not null,
  period_end timestamptz,
  -- 1, 2, 3... within the period. unique(subscription, period_start, seq) serializes concurrent
  -- sales: the loser of a race gets a unique violation and recomputes against the winner.
  period_seq integer not null check (period_seq > 0),
  base_cents integer not null check (base_cents >= 0),
  list_amount_cents integer not null default 5000 check (list_amount_cents >= 0),
  -- What was actually added to the invoice (0 during the trial, 0 once capped, partial at the cap edge).
  billed_cents integer not null check (billed_cents >= 0),
  billing_outcome text not null
    check (billing_outcome in ('billed', 'partial_cap', 'capped', 'trial', 'inactive')),
  -- 'pending' until the Stripe invoice item exists (always 'done' when billed_cents = 0).
  billing_state text not null default 'pending' check (billing_state in ('pending', 'done')),
  stripe_invoice_item_id text,
  marked_by text not null check (marked_by in ('owner_link', 'admin')),
  note text,
  created_at timestamptz not null default now(),
  billed_at timestamptz,
  constraint ava_sales_lead_unique unique (lead_id),
  constraint ava_sales_period_seq_unique unique (stripe_subscription_id, period_start, period_seq)
);

create index if not exists ava_sales_subscription_period_idx
  on public.ava_sales (stripe_subscription_id, period_start);

create index if not exists ava_sales_pending_idx
  on public.ava_sales (billing_state) where billing_state = 'pending';

alter table public.ava_sales enable row level security;

comment on table public.ava_sales is
  'Pilot billing: one booked job per lead. Service-role only; no public policies. billed_cents is what was added to the Stripe invoice.';

-- 2) Mirror the sale on the lead row so it is visible next to the call.
alter table public.ava_call_leads
  add column if not exists booked_at timestamptz,
  add column if not exists sale_id uuid;

comment on column public.ava_call_leads.booked_at is
  'When the owner (signed email link) or an admin marked this lead as a booked job. Pilot billing only.';

-- Rollback (manual, only if needed; Stripe invoice items already created are NOT undone):
--   alter table public.ava_call_leads drop column if exists booked_at, drop column if exists sale_id;
--   drop table if exists public.ava_sales;
