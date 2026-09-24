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
- `AVA_STRIPE_PAYMENT_LINK_ID` — required only when an Ava-specific Payment Link should qualify for automatic creation

With automatic creation disabled, Cole can use the authenticated internal endpoint described in [`docs/AVA_PHONE_SETUP_RUNBOOK.md`](docs/AVA_PHONE_SETUP_RUNBOOK.md). The endpoint duplicates the template through ElevenLabs' supported agent-duplicate API, updates the customer's prompt and greeting, and saves the returned agent ID. Missing credentials result in a pending status. Submit-time automatic creation also requires Stripe to report the session as paid and complete and identify it through `/api/checkout` Ava plan metadata or the configured Ava-specific Payment Link ID.

Phone-number purchase, allocation, import/assignment, forwarding, calendar writes, customer-facing SMS, and launch approval are still manual. Optional **internal** Twilio SMS lead alerts (`TWILIO_*` + `AVA_LEAD_SMS_TO`) activate only when configured — missing env no-ops SMS; email (Resend) remains primary. `agent_ready_phone_pending` means the customer agent is configured; it does not mean a phone number or live calling is ready.

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
- generated property imagery end-to-end in production (MVP routes exist; needs Maps/OpenAI keys, Storage bucket, migration apply, and human review before mail)
- live supplier inventory/pricing
- Stripe checkout/subscriptions
- Ava phone-number purchase/assignment, line forwarding, and customer-facing SMS (internal Twilio lead-alert SMS is available when Twilio env is set)
- Ava calendar writes and automated launch approval
- postcard printing and fulfillment

Never commit secrets to GitHub. Configure them in Vercel/Supabase secret management.

## YardProof postcard imagery (MVP code present — not live without keys)

Additive migration `supabase/migrations/20260924120000_postcard_recipient_imagery.sql` adds per-recipient Current/After/review fields and documents campaign-level geo columns already present in live Supabase.

**Locked product rules (do not claim otherwise):**

- **Street View / satellite** = internal operator reference only (`POST /api/imagery/streetview-preview`). Store geo + pano/heading params. Do **not** print Street View on mailers, do **not** feed Street View into AI after-edits, do **not** set it as printable Current.
- **Printable Current** = `crew_photo` or `owner_upload` only (`POST /api/imagery/crew-photo` → Storage bucket `IMAGERY_STORAGE_BUCKET`, default `yardproof-imagery`).
- **After** = photoreal modest AL lawn refresh via `lib/imagery/after-render.ts` (`IMAGERY_PROVIDER=openai` day-1; Gemini hook only). Requires human `POST /api/imagery/review` before treating a card as mail-ready.
- Public `/q/[token]` shows Current|After when those URLs are present (crew/owner Current + After).

**Still required before claiming imagery is live:**

1. Apply the additive migration in Supabase.
2. Create private Storage bucket `yardproof-imagery` (or the configured name).
3. Add server-only Vercel env: `GOOGLE_MAPS_API_KEY` (Geocoding + Street View Static + Maps Static, restricted), optional `GOOGLE_MAPS_URL_SIGNING_SECRET`, confirm `OPENAI_API_KEY` Images access / `OPENAI_IMAGE_MODEL`, optional `IMAGERY_PROVIDER`, `AFTER_PROMPT_VERSION`, `IMAGERY_STORAGE_BUCKET`, `IMAGERY_DAILY_CAP`.
4. Do **not** invent or paste secrets into git. Cole configures Vercel/GCP.

Postcard **printing and fulfillment** (Lob / vendor mail) remain out of scope until explicitly authorized.
