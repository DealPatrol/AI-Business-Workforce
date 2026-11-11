# Publish runbook: `design/pricing-smith-layout` → production

When Cole says **"publish"**, this should take about 10 minutes. `scripts/publish-check` does every check, never prints a
secret value, and exits non-zero if something required is missing.

```bash
scripts/publish-check --only=env              # 1. what production is missing (names only)
# …set the missing vars (step 2)…
gh pr create --repo DealPatrol/AI-Business-Workforce --base main --head design/pricing-smith-layout \
  --title "Ava: in-call booking, transfer, Spanish, Google Calendar sync, store plan, Desk" --fill
gh pr merge --repo DealPatrol/AI-Business-Workforce --merge <PR#>    # 4. Vercel deploys production
scripts/publish-check --only=tools --retarget-tools                  # 6. demo booking tools → production
scripts/publish-check --checkout                                     # 7. full smoke test on production
```

Tokens the script reads from your shell (never printed): `VERCEL_TOKEN`, `STRIPE_SECRET_KEY` (or
`STRIPE_WORKSPACE_SECRET_KEY`) for the Workspace Stripe account, and `ELEVENLABS_API_KEY`. Any section without its token
is skipped with a note. Grok Bot can also run the tools and Stripe steps through its connectors.

---

## 1. Pre-flight
- `npm test`, `npx tsc --noEmit -p .`, `npx next lint` are green on the branch, and the latest preview deployment is READY.
- `scripts/publish-check --url=<preview URL>` passes the smoke section.

## 2. Production env vars (Vercel → ai-business-workforce → Settings → Environment Variables → Production)
Add with `vercel env add <NAME> production` (prompts for the value; nothing is echoed) or in the dashboard.

**Required, missing in production as of Nov 10, 2026:**

| Name | Value |
|---|---|
| `STRIPE_AVA_BOOKED_JOB_PRICE_ID` | same live price ID as Preview ($25 per booked job, metered) |
| `STRIPE_AVA_STORE_BASE_PRICE_ID` | same as Preview (`$119/mo`, `price_1UaABQ…`; see docs/AVA_STORE_BILLING.md) |
| `STRIPE_AVA_STORE_CALL_PRICE_ID` | same as Preview (`$1/call`, `price_1UaABR…`) |
| `AVA_BOOKING_LINK_SECRET` | new random value: `openssl rand -base64 48`. Signs the .ics links in lead emails. |

**Required, already set in production** (the script verifies these):
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`,
`ELEVENLABS_WEBHOOK_SECRET`, `AVA_PROVISIONING_SECRET`, `RESEND_API_KEY`, `AVA_FROM_EMAIL`,
`AVA_LEAD_NOTIFICATION_EMAIL`, `CRON_SECRET`.

**Optional, feature-flagged** (safe to leave unset; the feature stays off or hidden):

| Feature | Names | Notes |
|---|---|---|
| Booking-tool host | `AVA_TOOL_BASE_URL` | Defaults to `NEXT_PUBLIC_SITE_URL`. Set to `https://executivereceptionist.com` if that isn't the site URL. |
| Google Calendar sync | `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `AVA_TOKEN_ENCRYPTION_KEY`, `GOOGLE_CALENDAR_REDIRECT_URI` (optional) | See docs/GOOGLE_CALENDAR_SETUP.md. Set the encryption key once and don't rotate it. |
| Caller text after booking | `AVA_BOOKING_SMS_ENABLED=1`, `AVA_BOOKING_SMS_FROM=+18553603990`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | **Only after toll-free verification for +1 855-360-3990 is approved.** Until then leave `AVA_BOOKING_SMS_ENABLED` unset. |
| Owner lead texts / missed-call text-back | `TWILIO_FROM_NUMBER`, `AVA_LEAD_SMS_TO`, `MISSED_CALL_FORWARD_NUMBER` | already set |
| Auto-provision customer agents | `AVA_AUTO_PROVISION_AGENT` | already set |
| Ads + analytics | `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_*_LABEL`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_CAPI_TOKEN` | needed before paid ads, not for launch |

## 3. Stripe (Workspace account, live)
- Production webhook **already exists**: `we_1UOCXL…` → `https://ai-business-workforce.vercel.app/api/webhooks/stripe`
  (a production alias), with events `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
  Its signing secret is production's `STRIPE_WEBHOOK_SECRET`. Nothing to create. `scripts/publish-check --only=stripe` confirms it.
- After launch, **disable the preview webhook** `we_1UZxy8…` (→ the preview branch URL). It's live-mode, so real customer
  events are also sent to the preview deployment. Dashboard → Developers → Webhooks → that endpoint → Disable.
- If you ever move the webhook to `https://executivereceptionist.com/api/webhooks/stripe`, create it with the same six
  events, put its new signing secret in `STRIPE_WEBHOOK_SECRET` (Production), redeploy, then disable the old one.

## 4. Database
Already applied to Supabase project `ielfvaguaebdlyfdkgtt`, which preview and production share:
`supabase/migrations/20261110120000_ava_booking.sql` and `20261110150000_ava_booking_sms_google.sql`. The changes are
additive (new tables and nullable columns). Nothing to run.

## 5. Merge → deploy
Open and merge the PR (commands at the top). Vercel builds `main` to production. Wait until the deployment is READY:
`vercel ls ai-business-workforce --prod` or the dashboard. The current production deployment, before publishing, is
`dpl_5dGUzGc5DTVeNmBffHYbYS5Hjgpk` (main @ 205cc66). That's the instant-rollback target.

## 6. Point the demo booking tools at production
The Porchlight and HVAC demo agents call two ElevenLabs webhook tools that point at the **preview** URL today:
- `check_availability`: `tool_9601m72afh9rf4n9b6k94jy9dxvs`
- `book_appointment`: `tool_2701m72afksgefabkz18ytakv58x`

Run `ELEVENLABS_API_KEY=… scripts/publish-check --only=tools --retarget-tools` (it only changes the URL host and keeps the
secret header as is), or ask Grok Bot to do it. Customer agents get production URLs automatically when booking is turned on.

## 7. Smoke tests (production)
`scripts/publish-check --checkout` checks the following:
- `/`, `/start`, `/pricing`, `/receptionist`, `/receptionist/hvac`, `/receptionist/ecommerce`, `/onboarding/ava`, `/login`,
  `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` return 200 with no banned number; frontporchgrowth.com returns 200.
- `/desk` redirects to sign-in. The booking tool rejects unsigned calls (404). Google connect is hidden (404) or live (redirect).
- Pilot and store Checkout reach `checkout.stripe.com`, and both sessions are expired right away.

Then by hand (5 minutes):
1. Call the demo line **(256) 952-4935**. Say the furnace is blowing cold air, not an emergency, and accept a window.
   Ava should offer real windows, book one, and say it's a demo.
2. Sign in to the Desk as `qa+ava@executivereceptionist.com` (password: `~/.secrets/qa_customer_password` on the box). The
   booking shows on the calendar with a Demo tag. Cancel it in Supabase if you want the slot back
   (`update ava_bookings set status='canceled' where id='…'`).
3. Optional: say "¿Hablas español?" on the demo line. Ava should switch to Spanish.

## 8. Rollback
Vercel → Deployments → `dpl_5dGUzGc5DTVeNmBffHYbYS5Hjgpk` → **Promote to Production** (instant).
Then run `scripts/publish-check --only=tools --retarget-tools --url=<preview URL>` to point the demo tools back at the preview.
The database changes are additive, so they don't need a rollback.
