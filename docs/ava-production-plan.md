# Ava production plan

Goal: ship Ava (AI receptionist) as a production-ready, payments-capable product that can take paid customers daily. Postcard mailer remains a separate product track.

## Branches to merge

| Order | Branch / PR | Why | Status |
|---|---|---|---|
| 1 | `main` | Deploy path, auth, Stripe checkout, Ava UX, qualify funnel, metering already landed | Current base |
| 2 | Voice picker (from `cursor/ava-southern-voice-picker-5883` / #31) | Demo voice choice + onboarding preference | Included in production PR (resolves #31 conflicts) |
| 3 | Onboarding session reuse (`611bef1`) | Updates Ava onboarding when the same Stripe session is reused | Included in production PR |
| 4 | `cursor/ava-production-golive-873b` | Pricing, Muse-aligned sales surface, Stripe trial + webhook stub, docs | **This PR** |

**Do not merge** postcard branches (`cursor/automate-streetview-postcards-6528`, imagery/Lob/mail race fixes, etc.) into Ava production for this pass. Full inventory lives in the Project store at `internal/ava-branch-audit.md`.

## What shipped in this pass

- `/ava` repositioned around recovered missed/after-hours calls → qualified lead handoff (Muse “sell recovered revenue” framing without agency pricing).
- Clear automated vs human scope; no fake testimonials or invented revenue claims.
- Centralized Ava pricing in `lib/ava/pricing.ts` wired through checkout, layout JSON-LD, industry pages, onboarding, Sales Ava, demos.
- Stripe Checkout subscriptions now send `subscription_data[trial_period_days]=7`.
- `POST /api/webhooks/stripe` signature verification + event ack stub.
- Southern voice picker + preferred-voice onboarding note.
- Onboarding row update on Stripe session reuse.

## Pricing recommendation vs Muse

Muse / FirstMinute blueprint targets a **managed** front desk: **$2,000 implementation + $1,250/month**, plus usage. That is credible for white-glove ops with weekly scorecards and human QA — and too high for Ava as it exists today (self-serve software + Cole-assisted launch).

**Ava self-serve (implemented):**

| Plan | Price | Included minutes | Overage |
|---|---|---|---|
| Starter | **$79/mo** | 300 | $0.28/min |
| Growth | **$149/mo** | 800 | $0.24/min |
| Pro | **$299/mo** | 1,800 | $0.20/min |

- **$0 setup** on self-serve checkout.
- **Optional assisted launch $299** one-time (manual Cole/ops — messaging only; not an automated Stripe SKU yet).
- **Free 7-day trial** via Stripe Checkout trial days.

Rationale: previous $59 entry underpriced a 24/7 voice product relative to answering services; Muse $1,250 is the wrong comparison set for software-led Ava. $79–$299 keeps a contractor-friendly break-even (a handful of recovered jobs) while funding minutes + support margin. Revisit a true managed tier only after phone provisioning and calendar booking are live.

## Payments / go-live blockers (manual)

Repo can create Checkout Sessions and verify paid sessions for provisioning when secrets exist. **User must still:**

1. Set Vercel Production secrets: `STRIPE_SECRET_KEY`, optional `STRIPE_AVA_*_PRICE_ID` (recreate Dashboard prices for $79/$149/$299), `STRIPE_WEBHOOK_SECRET`.
2. Stripe Dashboard → Webhooks → endpoint `https://<domain>/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
3. Confirm Stripe business name/branding (Dashboard → Settings) so Checkout does not show a generic “Billing” label.
4. Supabase: Ava onboarding + sales qualification migrations applied; `SUPABASE_*` keys on Vercel.
5. ElevenLabs: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, optional voice agent IDs, separate `ELEVENLABS_SALES_AGENT_ID`.
6. Resend (`RESEND_API_KEY`) for onboarding/lead email; optional Twilio lead SMS.
7. Phone launch remains **manual** per `docs/AVA_PHONE_SETUP_RUNBOOK.md` (buy/assign number, forwarding, live test call). `AVA_AUTO_PROVISION_AGENT` stays false until tested.
8. Optional: `NEXT_PUBLIC_AVA_SETUP_BOOKING_URL`, `NEXT_PUBLIC_APP_URL`, Meta analytics keys if ads are live.

## Path after merge

1. Merge production PR → Vercel production deploy.
2. Complete Stripe + ElevenLabs + Supabase secrets checklist above.
3. Run one test Checkout (Starter) through `/ava` → onboarding → Cole notification.
4. Close superseded OPEN #31 after this PR lands (or mark duplicate).
5. Keep postcard PR #34 on its own track.
