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

Migrations:

- `supabase/migrations/20260924120000_postcard_recipient_imagery.sql` — per-recipient Current/After/review + campaign geo parity
- `supabase/migrations/20260924130000_streetview_printable_current.sql` — historical filename; now enforces rights-cleared sources
- `supabase/migrations/20260927031945_owned_photo_capture_and_suppression.sql` — reverses live Street View rows, queues legacy objects for Storage API deletion, and adds capture rights/redaction/suppression fields

**Product rules:**

1. Google Street View/satellite are streamed with `no-store` headers for authenticated scouting only.
2. Printable/AI Current sources are `crew_photo`, `owner_upload`, or `licensed`, with a documented rights basis.
3. Google Cloud Vision identifies faces, text/house numbers, and localized license plates; Sharp blurs every returned region before storage. Redaction fails closed.
4. AI output receives a second privacy pass before storage.
5. Human review remains required before mail-ready.
6. Do-not-photograph and do-not-mail suppressions are checked before capture matching and immediately before Lob.

**Still required before claiming imagery is live:**

1. Apply every migration through `20260927031945_owned_photo_capture_and_suppression.sql`.
2. Create private Storage bucket `yardproof-imagery` (or the configured name).
3. Add server-only Vercel env: `GOOGLE_MAPS_API_KEY` (scouting), `GOOGLE_CLOUD_VISION_API_KEY` (privacy detection), optional `GOOGLE_MAPS_URL_SIGNING_SECRET`, `OPENAI_API_KEY` Images access / `OPENAI_IMAGE_MODEL`, `IMAGERY_PROVIDER`, `AFTER_PROMPT_VERSION`, `IMAGERY_STORAGE_BUCKET`, and `IMAGERY_DAILY_CAP`.
4. Open `/dashboard/campaigns` once after migration (or POST `/api/imagery/purge-google`) to delete queued legacy Google objects through the supported Storage API.
5. Do **not** invent or paste secrets into git. Cole configures Vercel/GCP.

**Imagery security notes:**

- `GOOGLE_MAPS_API_KEY` is server-only. Google preview bytes are streamed directly to the authenticated operator and never stored.
- `lib/imagery/safe-fetch.ts`, used by AI, accepts only private Supabase Storage references. Google hosts are structurally excluded.
- After-render uses `gpt-image-1` image **edit** with the Current as input. gpt-image models always return base64 and reject `response_format` (400), so it is only sent for legacy `dall-e-*` overrides.

**Hanceville demo QR 404 (`/q/f4db2ae44db4886b70d6b6060751cc70b95b`) — diagnosed 2026-09-24:**

- The recipient row **exists** in prod Supabase (`ielfvaguaebdlyfdkgtt`, Hanceville, campaign `status=active`).
- Prod `campaign_recipients` only has the legacy columns; migrations `20260924120000_postcard_recipient_imagery.sql` and `20260924130000_streetview_printable_current.sql` are **not applied** (latest applied: `fix_extension_schemas_and_fk_index`).
- `/q/[token]` selected `current_image_url, current_image_source, after_image_url, review_status`, PostgREST returned `42703 undefined_column`, and the page treated any error as `notFound()` → 404.
- Code fix: `/q/[token]` now falls back to the legacy column set on `42703`, so the page renders (legacy concept image only) even before migrations.
- To enable Current|After on that page: apply all migrations, create the private Storage bucket, then crew/homeowner capture → privacy redaction → after-render → review.

Postcard **printing and fulfillment** (Lob / vendor mail) remain out of scope until explicitly authorized.
