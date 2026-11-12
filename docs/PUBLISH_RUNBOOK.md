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
| `STRIPE_AVA_STARTER_PRICE_ID` | `price_1Ub3uoRJZZUpaweBFGtwF5QC` (Starter $79/mo, 100 minutes) |
| `STRIPE_AVA_GROWTH_PRICE_ID` | `price_1Ub3utRJZZUpaweBJEvsIUis` (Growth $197/mo, 300 minutes) |
| `STRIPE_AVA_PRO_PRICE_ID` | `price_1Ub3uwRJZZUpaweBIdSj9aCa` (Pro $397/mo, 1,200 minutes, featured) |
| `STRIPE_AVA_ELITE_PRICE_ID` | `price_1Ub3uzRJZZUpaweBtRWSPglF` (Elite $789/mo, 2,000 minutes) |
| `STRIPE_AVA_STARTER_FIRST_MONTH_COUPON_ID` | `ED3W0r22` ($78 off once, Starter product only, so the first month is $1) |

The free 14-day pilot, the $25-per-booked-job meter, and the $119 + $1/call store plan were retired on Nov 12, 2026.
`STRIPE_AVA_BOOKED_JOB_PRICE_ID` and the `STRIPE_AVA_STORE_*` vars are no longer used by checkout; monthly-plan
customers are never metered per booked job.
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
- Checkout for all four plans reaches `checkout.stripe.com` with the right amount due today (Starter $1.00, Growth $197, Pro $397, Elite $789), and each session is expired right away.
- `/buy/starter` redirects to Stripe Checkout (the shareable $1 link).

Then by hand (5 minutes):
1. Call the demo line **(256) 952-4935**. Say the furnace is blowing cold air, not an emergency, and accept a window.
   Ava should offer real windows, book one, and say it's a demo.
2. Sign in to the Desk as `qa+ava@executivereceptionist.com` (password: `~/.secrets/qa_customer_password` on the box). The
   booking shows on the calendar with a Demo tag. Cancel it in Supabase if you want the slot back
   (`update ava_bookings set status='canceled' where id='…'`).
3. Optional: say "¿Hablas español?" on the demo line. Ava should switch to Spanish.

## 8. Per-customer go-live: calendar step (required)
Publishing doesn't turn booking on for anyone. For each new customer, before go-live (full steps in
`docs/AVA_PHONE_SETUP_RUNBOOK.md`, step 6):
1. Desk → Booking calendar: set hours and availability, check **Let Ava book jobs on calls**, save, and confirm the Desk says
   "Ava can now book open windows on calls."
2. Connect Google Calendar once it's available (the Desk shows the button only when `GOOGLE_CALENDAR_CLIENT_ID/SECRET` are set).
3. One real test booking on the customer's line, confirmed in the Desk calendar, then cancelled.

Marketing copy must match: booking is "once your calendar is set up in the Desk", never "out of the box".

## 9. Rollback
Vercel → Deployments → `dpl_5dGUzGc5DTVeNmBffHYbYS5Hjgpk` → **Promote to Production** (instant).
Then run `scripts/publish-check --only=tools --retarget-tools --url=<preview URL>` to point the demo tools back at the preview.
The database changes are additive, so they don't need a rollback.


## 10. Monthly plans (Nov 12, 2026)

- Plans live in `lib/ava/pricing.ts` (`AVA_PLANS`). Copy across the site reads from there or from `components/ava/MonthlyPlans.tsx`.
- Checkout: `POST /api/checkout` with `plan=starter|growth|pro|elite` (old `plan=pilot` forms start Starter). Shareable links: `/buy/starter`, `/buy/growth`, `/buy/pro`, `/buy/elite`. Each makes a fresh Checkout Session branded "Executive Receptionist".
- Only Starter gets the coupon. Growth, Pro and Elite never get a discount, even if a coupon is configured.
- No metered overage. If a customer runs past their minutes, Ava keeps answering and Cole reaches out about a bigger plan.
- Stripe Payment Links for Growth/Pro/Elite exist as a backup (their header shows the Stripe account name). The Starter Payment Link is deactivated because a payment link cannot apply the first-month coupon; use `/buy/starter`.

## 11. Talk to Ava buttons (Nov 12, 2026)

Every plan card (`MonthlyPlans`: /pricing, /, /start, /hvac, /ava, /receptionist-demo) has a **Talk to Ava** button.

- Tap → mic permission → `GET /api/ava/talk` (signed URL, 4 per visitor per 10 min) → live browser conversation over WebSocket with the ElevenLabs agent **Ava - Website Talk to Ava (public demo)** `agent_8101m78w0ks0fv5vzwysbdr9s6z8` (override with `ELEVENLABS_TALK_AGENT_ID`).
- Agent limits (set in ElevenLabs): signed URL required, origin allowlist (executivereceptionist.com, frontporchgrowth.com, www variants, ai-business-workforce.vercel.app), 180 s max duration (browser also hangs up at 3:00), 25 s silence ends the call, 150 conversations/day, 5 at once, no bursting, no tools except end_call.
- Voice: ElevenLabs "Jen - Calm, Confident, and Conversational" `QLAlOeRuLwKX0skeTR7R` (same as the demo line; was "Sarah" `EXAVITQu4vr4xnSDxMaL` until Nov 12, 2026).
- No mic / permission denied / demo busy → plays `public/voices/ava-greeting.mp3` (Jen, eleven_v4) with a transcript, plus the demo line (256) 952-4935.
- Preview deployments are not in the agent's origin allowlist, so the live conversation only connects on the production hosts (the fallback still works).
- The post-call webhook ignores this agent (unknown agent id), so demo conversations never create leads.

## 12. Customer Desk dashboard (Nov 12, 2026)

`/desk` (executivereceptionist.com/desk) is the signed-in owner's dashboard. Sections: Overview, Calls, Leads, Calendar, Plan & billing, Settings, Texts.

- **Privacy.** Every Desk read uses the owner's own Supabase session. Row-level security (`supabase/migrations/20261112220000_desk_rls.sql`) limits `ava_customers`, `ava_onboardings`, `ava_call_leads`, `ava_calendars`, `ava_bookings` and `er_leads` to rows tied to the signed-in email. Secret columns (calendar tool secret, Google token, staff phone, transfer number) are not granted to signed-in users, so Desk queries list columns explicitly; `select *` as a user fails on purpose.
- **Calls.** Call history comes from `ava_call_leads` (summary, transcript, length). Recordings stream through `/api/desk/calls/<id>/audio` from ElevenLabs; the key never reaches the browser.
- **Minutes.** The post-call webhook now saves `call_duration_secs`. Older calls are looked up from ElevenLabs on Desk load (25 per load) and written back. The meter counts the Stripe billing period when the customer has a subscription, otherwise the calendar month in Chicago. Included minutes come from `AVA_PLANS` (Starter 100, Growth 300, Pro 1,200, Elite 2,000).
- **Billing.** "Manage billing" → `POST /api/desk/billing/portal` → Stripe customer portal (default live configuration `bpc_1Ub6SNRJZZUpaweByxT1x3ww`, or `STRIPE_PORTAL_CONFIGURATION_ID`). Customers without a `stripe_customer_id` see "See plans" (/pricing). Plan switches made in the portal update `ava_customers.plan`/`included_minutes` from the price id in the Stripe webhook.
- **Settings.** `PUT /api/desk/settings`: greeting (ElevenLabs first message), notification email (`ava_onboardings.staff_email`, where lead alerts go), business hours (saved and pushed into Ava's prompt). Shared demo agents (`SHARED_AGENT_IDS` in `lib/desk/settings.ts`, including the public demo line) are never edited from a Desk; the booking route uses the same guard.
- **Texts.** Shown as "coming soon, waiting on carrier approval". Nothing in the Desk turns SMS on; `AVA_OPERATOR_SMS_CONSENT` stays unset.
- **Phone app.** `public/desk.webmanifest` (scope `/desk`), icons in `public/desk-app/`, and `public/desk-sw.js` (network only, offline notice, caches nothing). On Android, Chrome offers Install; on iPhone, Safari → Share → Add to Home Screen.

## 13. Ava's voice (Nov 12, 2026)

- Every Ava agent speaks with **Jen** (`QLAlOeRuLwKX0skeTR7R`), set in `lib/ava/voice.ts`. New customer agents get it in `configureCustomerAgent` (provisioning), whatever voice the template agent has.
- Jen must stay in the ElevenLabs workspace's "My voices"; agents reject library voices that are not added.
- TTS models were kept per agent (eleven_v4_turbo on all Ava agents; the old "Ava" example agent stays on eleven_v3_conversational).
- To switch back: set each agent's voice to Sarah `EXAVITQu4vr4xnSDxMaL` (ElevenLabs → Agent → Voice), change `AVA_VOICE.id`, and restore `public/voices/ava-greeting.mp3` from git history.
