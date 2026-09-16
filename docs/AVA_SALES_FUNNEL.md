# Ava sales funnel (qualify-only)

**Slice:** Sales Ava qualify → persist → onboarding prefill.  
**Out of scope:** Calendar booking APIs, SMS, GHL, auto phone buy, public dial-in numbers.

## Flow

1. Prospect lands on `/ava`.
2. Clicks **Talk to Ava — she’ll set up your receptionist** (`#talk-to-ava`).
3. Browser uses signed URL from `GET /api/ava/elevenlabs?mode=sales` (or `/api/ava/elevenlabs/sales`) with `ELEVENLABS_SALES_AGENT_ID`.
4. After the call, the client saves answers via `POST /api/ava/sales/qualify` → `ava_sales_qualifications`.
5. Prospect can:
   - **Start plan** → `/api/checkout?plan=…&qualificationId=…` → Stripe → `/onboarding/ava?session_id=…&plan=…&qualificationId=…`
   - **Continue to onboarding** → `/onboarding/ava?qualificationId=…`
   - Optional **Book setup call** only if `NEXT_PUBLIC_AVA_SETUP_BOOKING_URL` is set (plain link; no Cal/Google API).

## Env vars (Vercel)

| Variable | Purpose |
|---|---|
| `ELEVENLABS_API_KEY` | Shared ElevenLabs auth |
| `ELEVENLABS_AGENT_ID` | Customer template / demo (unchanged) |
| `ELEVENLABS_SALES_AGENT_ID` | **New** separate Sales Ava agent |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Persist qualifications |
| `RESEND_API_KEY` / `AVA_LEAD_NOTIFICATION_EMAIL` | Email Cole on new qualification |
| `NEXT_PUBLIC_AVA_SETUP_BOOKING_URL` | Optional setup-call link after qualify |
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
