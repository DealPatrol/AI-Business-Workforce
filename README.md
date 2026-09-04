# AI Business Workforce

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

The app records a page-open event whenever a valid recipient page is rendered. This is useful response activity, but it can include link-preview bots as well as homeowner QR scans.
