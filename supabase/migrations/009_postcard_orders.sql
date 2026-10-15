-- Paid YardMailer checkout sessions. Service-role only; the Stripe webhook writes the rows.
-- Apply this in the Supabase SQL editor before relying on the database half of setup-fee lookup.
-- The app does not apply migrations itself. Stripe customer lookup still works if this table is missing.

create table if not exists public.postcard_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null,
  stripe_customer_id text,
  email text not null,
  product text not null,
  size text,
  quantity integer,
  setup_cents integer not null default 0,
  setup_charged boolean not null default false,
  payment_status text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists postcard_orders_session_idx
  on public.postcard_orders (stripe_checkout_session_id);

create index if not exists postcard_orders_email_setup_idx
  on public.postcard_orders (email)
  where setup_charged = true and payment_status = 'paid';

alter table public.postcard_orders enable row level security;

comment on table public.postcard_orders is
  'Paid postcard Checkout sessions (product yardmailer, or legacy yardproof). Service-role only; no public policies.';
