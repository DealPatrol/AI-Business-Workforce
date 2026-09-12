# Production setup

The application code is designed to degrade safely when integrations are not configured. Demo UI remains usable, while live features activate only after their server credentials exist.

## Supabase

1. Create/select the Supabase project.
2. Apply every SQL file in `supabase/migrations` in filename order, using the Supabase SQL editor or your normal migration workflow.
3. Add these Vercel environment variables for Production, Preview, and Development as appropriate:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only; never prefix this with NEXT_PUBLIC_)
4. Review Row Level Security policies before onboarding real customers.

## OpenAI

Add `OPENAI_API_KEY` to Vercel as a server-only environment variable. `OPENAI_AUDIT_MODEL` can override the default audit model. The API route `/api/audit` uses the Responses API and returns a safe deterministic fallback recommendation when no API key is configured.

## Customer-request email

Add `RESEND_API_KEY` as a server-only Vercel environment variable. The public founding form and Ava paid-pilot onboarding form send requests directly to `colecollins763@gmail.com`. If email delivery is unavailable, each form explicitly opens the visitor's email client with their answers preserved instead of displaying a false success state.

## Ava checkout handoff

Add `STRIPE_SECRET_KEY` as a server-only Vercel environment variable before enabling the existing `/api/checkout` flow. Successful Checkout Sessions return customers to `/onboarding/ava` with the Checkout session ID and selected plan included in Cole's setup notification. The compatibility route `/onboarding` also sends customers to the Ava setup form.

The hard-coded founding Payment Link is shared by Ava and Visual Canvasser offers, so its Dashboard completion URL must not be changed globally to the Ava form. Create an Ava-specific Payment Link or use `/api/checkout` before wiring Ava payment buttons directly to this onboarding path.

## Ava agent provisioning

Apply `supabase/migrations/003_ava_onboarding_provisioning.sql` before enabling provisioning. Ava onboarding then saves a private, service-role-only record and includes the record ID and provisioning status in Cole's Resend notification.

Add these server-only variables:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID` — the tested Ava template agent used by the browser demo and as the duplication source
- `AVA_PROVISIONING_SECRET` — a long random bearer secret for `POST /api/ava/provision`
- `AVA_AUTO_PROVISION_AGENT=true` — optional; leave false until automatic creation has been tested

With automatic creation disabled, Cole can use the authenticated internal endpoint described in [`docs/AVA_PHONE_SETUP_RUNBOOK.md`](docs/AVA_PHONE_SETUP_RUNBOOK.md). The endpoint duplicates the template through ElevenLabs' supported agent-duplicate API, updates the customer's prompt and greeting, and saves the returned agent ID. Missing credentials result in a pending status.

Phone-number purchase, allocation, import/assignment, forwarding, calendar writes, SMS, and launch approval are still manual. `agent_ready_phone_pending` means the customer agent is configured; it does not mean a phone number or live calling is ready.

## Current production boundary

Implemented in code:
- interactive sales/product experience
- dashboard and property workflow
- Supabase SSR client utilities
- contractor sign-in and session refresh
- database schema for businesses, audit leads, contractor settings, projects and agent runs
- postcard campaigns with unique recipient QR pages, page-open tracking, estimate capture, and an owner inbox
- RLS owner policies for authenticated application data
- server-side AI Business Audit endpoint with fallback mode
- private Ava onboarding persistence and status tracking
- feature-flagged ElevenLabs customer-agent duplication and prompt configuration

Still requires credentials/integration work before claiming live:
- persisting public audit leads into Supabase
- generated property imagery
- live supplier inventory/pricing
- Stripe checkout/subscriptions
- Ava phone-number purchase/assignment, line forwarding, and SMS
- Ava calendar writes and automated launch approval
- postcard printing and fulfillment

Never commit secrets to GitHub. Configure them in Vercel/Supabase secret management.
