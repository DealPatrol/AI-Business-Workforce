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

- **$250 setup**, then **$299/month** after a **14-day pilot** · 300 voice minutes · cancel anytime
- Personalized demos: `/demo/acexperts`, `/demo/family-comfort-hvac`, `/demo/after-hours-hvacr`, `/demo/underwood-hvac`, `/demo/posey-family-plumbing`
- Offer page: `/ava-pilot` · sales video: `/video` (`/ava-hvac-pilot.mp4`) · tracker: `/sales`
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

## Property imagery and capture

Google Street View and satellite are authenticated, on-screen scouting previews only. They are streamed with `Cache-Control: no-store` and are structurally excluded from the storage/AI/print fetcher. Printable “before” photos must come from the mobile crew capture page, a licensed homeowner upload, or another separately licensed source.

Required setup:

1. Enable Google Geocoding API, Street View Static API, and Maps Static API in one billed Google Cloud project.
2. Set the server-only `GOOGLE_MAPS_API_KEY` and restrict it to those APIs. `GOOGLE_MAPS_URL_SIGNING_SECRET` is optional.
3. Create the private Supabase bucket named by `IMAGERY_STORAGE_BUCKET`.
4. Enable Google Cloud Vision API and set `GOOGLE_CLOUD_VISION_API_KEY`.
5. Apply `20260927031945_owned_photo_capture_and_suppression.sql`.
6. Open `/capture/[campaignId]` on a crew phone, enter the photographer, take a rear-camera photo, confirm the nearest GPS-matched address, and upload.
7. Add a crew/contractor agreement granting YardProof and the landscaping business the right to edit and print route photos taken from the public right-of-way.

Every owned photo passes through Google Cloud Vision face, OCR/text, and object-localization detection. Sharp blurs returned face, text/house-number, and license-plate regions before storage. AI outputs receive the same pass before storage. If detection is unavailable or fails, upload/render fails closed. Cloud Vision object localization is not infallible, so human review remains mandatory.

### Google Maps Platform policy finding

This is an engineering risk assessment, not legal advice. As reviewed September 27, 2026:

- [Google Maps Platform Terms §3.2.3(a), “No Scraping”](https://cloud.google.com/maps-platform/terms) bars exporting Google Maps Content for use outside the services and specifically lists pre-fetching, storing, resharing, or rehosting it.
- [§3.2.3(b), “No Caching”](https://cloud.google.com/maps-platform/terms) bars caching except where the service-specific terms expressly permit it.
- [Google Maps Platform Service Specific Terms §3, “Google ID Caching”](https://cloud.google.com/maps-platform/terms/maps-service-terms) permits caching the Street View `pano_id`; it does not grant an image-storage or print exception.
- [Street View Static API Policies, “Pre-fetching, caching, or storage of content”](https://developers.google.com/maps/documentation/streetview/policies) says storing/caching content is generally prohibited apart from stated ID exceptions.
- [Street View Static API Policies, “Google Maps attribution requirements”](https://developers.google.com/maps/documentation/streetview/policies) requires supplied attribution to remain visible and legible.
- [Google Geo Guidelines, “Street View”](https://www.google.com/permissions/geoguidelines/#streetview) expressly say Street View imagery “may not be used for any print purposes,” including “Advertisements or promotional materials of any kind,” and prohibit downloading images for offline use.

Commercial postcard use is prohibited under Google’s public terms, not merely uncertain. Terms §3.2.3(c), “No Creating Content From Google Maps Content,” also prohibits or makes high-risk using Street View as source material for an AI-generated “after” concept. The repo contains no Google imagery storage, print, or AI override. Use owner/crew photos or separately licensed property imagery.

The migration nulls any legacy Street View Current/After references, restores the source constraint to `crew_photo | owner_upload | licensed`, and queues matching Storage paths. Supabase requires object deletion through its Storage API rather than SQL, so `/dashboard/campaigns` drains that queue; an authenticated operator can also POST `/api/imagery/purge-google`.

Homeowners can use **Send us a better photo** on `/q/[token]`. The required checkbox confirms ownership and grants a narrow, non-exclusive license to store, privacy-redact, AI-edit, display, and print the photo only for that property’s estimate and campaign materials. The same page provides a do-not-photograph/do-not-mail opt-out.

## Lob postcard mailing

YardProof uses Lob for the initial integration because its official API supports US 4×6 and 6×9 postcards, separate test/live keys, US address verification, HTML proofs, mail tracking webhooks, and signed webhook verification. PostGrid is viable, but Lob's explicit postcard artboard/no-ink-zone guidance and mature test fixtures make it the lower-risk fit for this workflow.

Setup:

1. Create a Lob account and start with a `test_*` API key.
2. Set `LOB_API_KEY`, `LOB_MODE=test`, and the `MAIL_RETURN_*` fields from `.env.example`.
3. Set `MAIL_PRICE_PER_CARD_CENTS` to the expected all-in per-piece amount from the Lob plan or quote. It drives the campaign preview only; Lob's invoice remains authoritative.
4. In Lob, add a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/lob`, subscribe to postcard tracking events, and copy its unique secret to `LOB_WEBHOOK_SECRET`.
5. Apply `supabase/migrations/20260927020000_postcard_mailing.sql`.
6. Keep `MAIL_LIVE_ENABLED=false`. Live mail requires `LOB_MODE=live`, a `live_*` key, and `MAIL_LIVE_ENABLED=true`.

The inbox shows a fresh per-campaign estimate and an explicit **Approve & send** action. The server re-checks eligibility, verifies every address before creating a Lob job, records test/live mode and Lob IDs, and updates delivery status only from HMAC-SHA256 verified webhooks. For 6×9 pieces the generated back reserves Lob's documented 2.375″ × 4″ ink-free address/postage/barcode block.

## Ava operations

Cole's current post-purchase and phone-launch checklist, plus the first automated agent-provisioning path, is in [`docs/AVA_PHONE_SETUP_RUNBOOK.md`](docs/AVA_PHONE_SETUP_RUNBOOK.md). Production credentials and rollout boundaries are documented in [`PRODUCTION_SETUP.md`](PRODUCTION_SETUP.md).
