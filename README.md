# YardProof

AI-powered business automation platform focused on measurable outcomes for service businesses.

## Product direction

- AI Business Audit recommends an automation workforce based on business type, problems, goals, service area, and budget.
- Agent Control Center covers lead generation, reception, follow-up, marketing, scheduling, approvals, CRM, activity, and cost controls.
- Home-service Neighborhood Canvasser: property discovery, property analysis, realistic Clean & Simple / Upgraded / Premium transformation concepts, supplier-aware material takeoffs, contractor-controlled pricing, personalized postcards and landing pages, lead capture, follow-up, and booking.
- Contractor pricing controls include gross-margin target, labor, crew, equipment, delivery/travel, waste, minimum job price, tax handling, and supplier discounts.
- Supplier integrations are modular connectors. Store-specific inventory/pricing is only represented as live when an authorized data source is connected.
- Sell-first model: founding customers purchase a custom paid pilot; capabilities are configured for their business rather than falsely represented as already-live integrations.

## Initial stack

- Next.js / React frontend for Vercel
- Supabase for authentication, database, CRM, and persistent application data
- OpenAI for AI workflows and visual/design intelligence
- Modular integrations for communications, payments, direct mail, suppliers, and future agent tools

## Sales week (HVAC & plumbing)

One offer: Ava answers missed and after-hours calls, handles common questions, captures job details, and sends the owner a qualified lead summary.

- Ava plans from **$79/month** · 300 voice minutes on Starter · cancel anytime after trial
- YardProof founding plan: **$99/month**
- Personalized demos: `/demo/acexperts`, `/demo/family-comfort-hvac`, `/demo/after-hours-hvacr`, `/demo/underwood-hvac`, `/demo/posey-family-plumbing`
- Offer page: `/ava` · sales video: `/video` (`/ava-hvac-pilot.mp4`) · tracker: `/sales`
- Prospect list and outreach copy: `sales/prospect-list.md`, `sales/outreach-templates.md`
- Supabase events: `sales_prospect_events` + `sales_prospect_status` via `/api/sales/events`. Apply migrations `003` and `004`.

## Build principle

Show demo/sample data clearly until the corresponding integration is connected. Emphasize leads, appointments, pipeline, revenue opportunities, automation spend, and ROI rather than technical AI metrics.

## Postcard QR campaign setup

The production-ready slice of the postcard workflow uses Supabase for recipient URLs, page-open events, and estimate requests.

1. Apply every file in `supabase/migrations` to the target Supabase project in filename order.
2. Set the environment variables shown in `.env.example`. `SUPABASE_SECRET_KEY` is server-only and is required by the public QR route so no campaign tables need anonymous access.
3. In Supabase Authentication, create the contractor user who will own and view the campaign.
4. Edit the contractor email, business details, sample addresses, and production domain in `supabase/seed_postcard_demo.sql`, then run it in the Supabase SQL Editor.
5. Copy the returned URL for each address into Canva's QR Code app. Each recipient has a distinct `/q/[token]` URL.
6. Sign in at `/login`, then open `/dashboard/campaigns` to see page opens and estimate requests.

For a real campaign, use the same SQL shape as the seed: create one `campaigns` row with the contractor Auth user's ID, then add one `campaign_recipients` row per mailed address. Leave `public_token` out of inserts so Postgres generates a high-entropy unique token.

The app records page-open activity for valid recipient pages and deduplicates repeated opens from the same request source within 30 minutes. This is useful response activity, but it can include link-preview bots as well as homeowner QR scans.

## Lead Finder

Lead Finder is Cole's operator tool for finding local buyers, drafting cold email, and sending it from his own domain. It lives at `/dashboard/prospector` (sign in with the same Supabase user as the campaign inbox). `/leads` stays the public redirect it already was.

Apply `supabase/migrations/007_prospector.sql` in the Supabase SQL editor before using it. Lists, leads, drafts, the send log, and the do-not-contact list are stored there with row-level security.

### What it does

1. Paste a website, optional notes, and a city or state (radius is optional, capped at 30 miles). The app reads the page and asks the existing OpenAI model for 3–6 buyer types, each with a reason, fit score, and Google Maps queries. Edit or uncheck them before searching.
2. Search uses Google Places API (New) Text Search. Each run is capped at 6 queries and 2 pages of 10, and the screen shows that request count before anything is called. Confirm the quota checkbox to run it. Results are deduped by place id inside the saved list.
3. "Find emails" fetches the business homepage and likely contact or about pages, pulls public addresses (including mailto and Cloudflare-protected addresses), and drops obvious junk. Businesses with no email are marked call-only. Phone numbers stay on the row. Batches stay small (5 sites, 2 at a time).
4. The table filters by email, rating, review count, category, and status. Statuses are new, drafted, approved, sent, replied, booked, not interested, and do-not-contact. Export CSV from the list header. Saved lists persist in Supabase.
5. Open a lead to generate a short first email and two follow-ups. Every draft is editable. Sending that draft stays disabled until you click Approve. Editing after approval clears it.
6. "Send approved" sends one approved draft at a time from your Resend domain, then waits for the spacing setting (default 90 seconds). The daily cap defaults to 25 successful sends and resets at 00:00 UTC. Stop leaves the rest unsent.

### Sending and compliance

Settings are at `/dashboard/prospector/settings`: sender name, sender email, physical mailing address, booking link (Calendly or Cal.com), daily cap, spacing, and default location.

Nothing sends unless all of these are true:

- The draft was explicitly approved, and it has not been edited since.
- `RESEND_API_KEY` is set and the From address is a single mailbox on a domain you verified in Resend.
- Sender name and a physical mailing address of at least 10 characters are saved. The address is not hardcoded.
- The message includes an accurate From and subject, a commercial-message line, that mailing address, and an unsubscribe link.
- The address is not already on the suppression list. Unsubscribe and do-not-contact both write to that list, and every send checks it.
- The daily cap and the gap since the last successful send both allow it.
- Every attempt is stored in `prospector_sends` (sent, failed, or suppressed).

If Resend or the Maps key is missing, list building, drafting, copy, and CSV export still work. The page says what to set instead of crashing.

Gmail / Google Workspace OAuth is not included. Sending is Resend-only so mail leaves a domain Cole controls, without a shared sending pool.

### Environment

Lead Finder reuses server variables that are already in `.env.example`:

| Variable | Role |
| --- | --- |
| `GOOGLE_MAPS_API_KEY` | Places API (New) Text Search and Geocoding. Also used by postcard imagery. Enable Places API (New) on this key. Server only. |
| `OPENAI_API_KEY` | Buyer types and email drafts. |
| `OPENAI_AUDIT_MODEL` | Optional model override. Defaults to `gpt-5-mini`. |
| `RESEND_API_KEY` | Sends from the From address in Lead Finder settings. |
| `NEXT_PUBLIC_APP_URL` | Builds the unsubscribe link. |
| `SUPABASE_SECRET_KEY` | Signs unsubscribe links when `PROSPECTOR_UNSUBSCRIBE_SECRET` is unset, and writes the public unsubscribe. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sign-in and saved lists. |

New optional variable:

- `PROSPECTOR_UNSUBSCRIBE_SECRET` — dedicated HMAC secret for unsubscribe links. Falls back to `SUPABASE_SECRET_KEY`, then `SUPABASE_SERVICE_ROLE_KEY`.

Do not create a `NEXT_PUBLIC_GOOGLE_MAPS_*` key. The browser never sees the Maps key.

## Ava operations

Cole's current post-purchase and phone-launch checklist, plus the first automated agent-provisioning path, is in [`docs/AVA_PHONE_SETUP_RUNBOOK.md`](docs/AVA_PHONE_SETUP_RUNBOOK.md). The manual steps to take a paying customer live are in [`docs/AVA_GO_LIVE_CHECKLIST.md`](docs/AVA_GO_LIVE_CHECKLIST.md). Production credentials and rollout boundaries are documented in [`PRODUCTION_SETUP.md`](PRODUCTION_SETUP.md).
