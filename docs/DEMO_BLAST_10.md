# Demo Blast 10 operator guide

Demo Blast 10 is the $49, review-first version of YardProof: up to 10 before/after postcard concepts, one contractor review board, and manual print/mail fulfillment after approval.

## One-time production setup

Apply these migrations in order in the Supabase SQL editor:

1. `supabase/migrations/20260924120000_postcard_recipient_imagery.sql`
2. `supabase/migrations/20260924130000_streetview_printable_current.sql`
3. `supabase/migrations/20260925131044_demo_blast_10.sql`

Create one **private** Supabase Storage bucket:

- `yardproof-imagery` (or the exact value of `IMAGERY_STORAGE_BUCKET`)

Set these Vercel environment variables for Production and Preview as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server only)
- `NEXT_PUBLIC_APP_URL`
- `DEMO10_PAYMENT_LINK` (server only, optional; an HTTPS payment link created by Cole)
- `GOOGLE_MAPS_API_KEY` (server only; restrict to Geocoding, Street View Static, and Maps Static)
- `GOOGLE_MAPS_URL_SIGNING_SECRET` (server only, when URL signing is enabled)
- `OPENAI_API_KEY` (server only)
- `OPENAI_IMAGE_MODEL=gpt-image-1` (optional override)
- `IMAGERY_PROVIDER=openai`
- `AFTER_PROMPT_VERSION=demo10-multitrade-v1`
- `IMAGERY_STORAGE_BUCKET=yardproof-imagery`
- `IMAGERY_DAILY_CAP=50`

`DEMO10_PAYMENT_LINK` is intentionally optional. When it is absent or invalid, Demo 10 calls to action open a “Request Demo Blast 10” email to `colecollins763@gmail.com`. Do not substitute an invented Stripe URL.

The app is safe to deploy before the newest migration: the review page falls back to existing campaign/imagery columns and change requests fall back to `review_notes`. Setting `ready_to_mail` requires the Demo 10 migration.

## Open the sample campaign

1. Create the operator/contractor account in Supabase Authentication.
2. Replace `contractor@example.com` in `supabase/seed_demo10.sql` with that account's email.
3. Run `supabase/seed_demo10.sql` in the Supabase SQL editor.
4. Sign in and open:
   `/dashboard/campaigns/d0100000-0000-4000-8000-000000000010/review`

The seed is repeatable and creates exactly 10 clearly labeled SAMPLE/PLACEHOLDER cards with random public tokens. It starts in `draft`, uses site demo assets rather than live property imagery, and preserves existing card review state on rerun. Do not mail those cards.

## Seed a real customer's 10 addresses

1. Create a campaign row owned by the authenticated contractor:
   - `campaign_type = 'demo_10'`
   - `trade` = one supported profile key
   - `is_sample = false`
   - `status = 'active'`
2. Add no more than 10 `campaign_recipients` rows with the full mailing address and a useful `concept_summary`.
3. For each recipient, call `POST /api/imagery/streetview-preview` from the authenticated operator workflow. This geocodes the address and, when available, stores Street View Static bytes in the private bucket as the printable Current.
4. If Street View is unavailable, upload an authorized crew/owner photo through the existing crew-photo endpoint. Satellite is operator preview only; it is not a printable Current.
5. Call `POST /api/imagery/after-render` with the campaign trade and selected curated catalog IDs.
6. Open `/dashboard/campaigns/[campaign-id]/review`.

Supported profiles are landscaping, roofing, pressure washing, exterior painting, fencing, tree service, hardscaping, outdoor lighting, gutter, concrete, and siding.

The landscaping picker is a curated North Alabama reference inspired by what a local Lowe's garden center typically carries. It is **not** a live Lowe's inventory feed and contains no stock status or prices. Other trades use small curated finish/scope references with the same non-inventory disclosure.

## Contractor review walkthrough

For each card:

1. Compare Current and After, address, and scope bullets.
2. Approve it, or enter required notes and choose **Request changes**.
3. Open **Swap plants/materials**, choose up to 12 curated references, and save.
4. Choose **Regenerate After** to render the saved selection against the Current image.
5. Repeat until every card is ready.
6. Choose **Approve all ready**. This approves the cards and sets campaign status to `ready_to_mail`.

`ready_to_mail` is an operations handoff only. There is no Lob or automatic mailing integration. Cole/ops must verify addresses, creative, quantity, printing, postage, and customer approval before placing a mail order.
