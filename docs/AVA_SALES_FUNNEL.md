# Ava sales funnel (qualify-only)

**Slice:** Sales Ava qualify → persist → onboarding prefill.  
**Out of scope:** Calendar booking APIs, SMS, GHL, auto phone buy, public dial-in numbers.

## Flow

1. Prospect lands on `/ava`.
2. Clicks **Talk to Ava — she’ll set up your receptionist** (`#talk-to-ava`).
3. Browser uses signed URL from `GET /api/ava/elevenlabs?mode=sales` (or `/api/ava/elevenlabs/sales`) with `ELEVENLABS_SALES_AGENT_ID`.
4. After the call, the client saves answers via `POST /api/ava/sales/qualify` with a required `conversationId`.
   - Server verifies the conversation with ElevenLabs (exists, `status=done`, `agent_id` matches `ELEVENLABS_SALES_AGENT_ID`).
   - Basic IP + conversationId rate limits apply.
   - Upsert is only allowed for that verified conversation (no unauthenticated blank inserts).
5. Response includes `qualificationId` plus a short-lived HMAC `prefillToken`.
6. Prospect can:
   - **Start plan** → `/api/checkout?plan=…&qualificationId=…&prefillToken=…` → Stripe → `/onboarding/ava?session_id=…&plan=…&qualificationId=…&prefillToken=…`
   - **Continue to onboarding** → `/onboarding/ava?qualificationId=…&prefillToken=…`
   - Optional **Book setup call** only if `NEXT_PUBLIC_AVA_SETUP_BOOKING_URL` is set (plain link; no Cal/Google API).

## Security notes

- `GET /api/ava/sales/qualify?id=` without a valid `token` / `prefillToken` returns a **safe** projection (no `staffContact`, no `conversationId`).
- Full staff contact is returned only when the short-lived signed prefill token matches the qualification id (TTL ~2h). Signing uses `AVA_QUALIFY_PREFILL_SECRET`, else `AVA_PROVISIONING_SECRET`, else `SUPABASE_SECRET_KEY`.
- UUID-as-capability alone is treated as temporary pilot risk; prefer tokenized links from the POST response / checkout success URL.

## Env vars (Vercel)

| Variable | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | Shared ElevenLabs auth |
| `ELEVENLABS_AGENT_ID` | Customer template / demo (unchanged) |
| `ELEVENLABS_SALES_AGENT_ID` | **New** separate Sales Ava agent |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Persist qualifications |
| `RESEND_API_KEY` / `AVA_LEAD_NOTIFICATION_EMAIL` | Email Cole on new qualification |
| `NEXT_PUBLIC_AVA_SETUP_BOOKING_URL` | Optional setup-call link after qualify |
| `AVA_QUALIFY_PREFILL_SECRET` | Optional dedicated HMAC secret for prefill tokens |
| `STRIPE_SECRET_KEY` | Ava plan checkout ($59 / $129 / $249, $0 setup) |

## ElevenLabs setup

1. Create a **new** ConvAI agent (do not edit the customer template).
2. Paste the system prompt from the agency kit `SALES_AVA_PROMPT.md`.
3. Configure data-collection fields to match `QUALIFY_SCHEMA.json` keys when possible.
4. Save the Agent ID as `ELEVENLABS_SALES_AGENT_ID`.

## Database

Apply migration `supabase/migrations/005_ava_sales_qualifications.sql` (table `ava_sales_qualifications`).

## Honesty

- Pricing stays Starter **$59** / Growth **$129** / Pro **$249**, **$0** setup.
- Do not invent dial-in numbers or retarget Visual Canvasser payment links for Ava.
- Calendar writes are not live in this slice — optional booking URL only.
- **Starter feature-list gap:** the `/ava` pricing card still lists “Appointment booking” on Starter for marketing continuity, but live calendar booking APIs are **not** wired in this qualify-only slice. Treat that line as aspirational / setup-call scope until calendar integration ships — do not imply Google Calendar / SMS / GHL is already connected.
