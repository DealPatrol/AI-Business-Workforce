# Ava go-live checklist

Do these in order before a landscaper (or any home-service shop) pays for Ava. Nothing here is done by the app deploy itself. Do not commit secrets.

Prices already in the product: Starter $79/mo (300 minutes), Growth $149/mo (800 minutes), Pro $299/mo (1,800 minutes). Each checkout is a 7-day Stripe trial with $0 setup. The YardProof founding postcard offer stays $99/mo and is a different product.

## 1. Apply the database migration

In the Supabase SQL editor, run `supabase/migrations/006_ava_go_live.sql`.

That file adds the Ava customer table, webhook idempotency, staff email/phone on onboarding, and agent id on leads. Confirm older Ava migrations (`002_ava_call_leads.sql`, `003_ava_onboarding_provisioning.sql`) are already applied.

## 2. Set environment variables

On Vercel Production (and Preview if you test there):

- `STRIPE_SECRET_KEY` — secret key, so checkout can start
- `STRIPE_WEBHOOK_SECRET` — signing secret from the webhook you create below (`whsec_...`)
- `NEXT_PUBLIC_APP_URL` — the public site URL, no trailing slash (used in the buyer’s onboarding email)
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `AVA_FROM_EMAIL` — the From address Resend is allowed to send as. If you leave it unset, mail uses `onboarding@resend.dev`, which only delivers to the Resend account owner
- `AVA_LEAD_NOTIFICATION_EMAIL` — your inbox for new checkouts and for lead alerts when a shop has not saved its own contact. Default in code is `colecollins763@gmail.com`
- `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` — the template agent that gets duplicated for each customer
- `ELEVENLABS_WEBHOOK_SECRET` — shared secret from the ElevenLabs post-call webhook
- `AVA_AUTO_PROVISION_AGENT=true` — only after you have tested one duplicate. Until then leave it `false` and create the agent with `POST /api/ava/provision`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — required for lead texts
- `AVA_LEAD_SMS_TO` — your phone, used only when a provisioned paying shop did not save a staff phone
- `AVA_DESTINATION_EDIT_SECRET` — optional. Signs the 30-minute link that changes a shop’s lead phone/email. If unset, the app signs that link with `STRIPE_SECRET_KEY` instead. No extra service.

Optional Dashboard price IDs (`STRIPE_AVA_STARTER_PRICE_ID`, `STRIPE_AVA_GROWTH_PRICE_ID`, `STRIPE_AVA_PRO_PRICE_ID`) are not required. Checkout uses inline prices at $79 / $149 / $299 when they are blank. If you do set them, the Stripe prices must match those amounts.

Do not change `STRIPE_FOUNDING_MONTHLY_PRICE_ID` or the founding offer.

## 3. Stripe webhook

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://<your-domain>/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

A completed Ava checkout (paid or 7-day trial) saves the customer, emails the buyer an onboarding link, and emails you. The same event will not send those emails twice.

## 4. Resend domain

`onboarding@resend.dev` is a test sender. Add and verify your own domain in Resend, then set `AVA_FROM_EMAIL` to an address on that domain (for example `Ava <ava@yourdomain.com>`). Until that is done, buyer and lead mail will not reach real customers.

## 5. ElevenLabs post-call webhook

In ElevenLabs → ElevenAgents → Settings → Webhooks (workspace post-call webhook):

- URL: `https://<your-domain>/api/webhooks/elevenlabs`
- Enable transcription webhooks (`post_call_transcription`). Leave the audio webhook off — this app does not store call audio
- Auth: HMAC, and put that shared secret in `ELEVENLABS_WEBHOOK_SECRET`

The webhook is workspace-wide, so calls to the public website demo agents and Sales Ava arrive here too. The handler returns HTTP 200 for every valid signature. It saves a lead, sends email, and calls Twilio only when `agent_id` matches `ava_onboardings.elevenlabs_agent_id` for an `ava_customers` row with `product` `ava` (or blank) and `subscription_status` `active` or `trialing`. Any other agent — demo, Sales Ava, unknown, or a shop that is not active/trialing — is ignored: no `ava_call_leads` row, no email, and no Twilio request, so those calls cannot spend SMS credit.

A matched shop is emailed at the staff address they saved (or `AVA_LEAD_NOTIFICATION_EMAIL` if they did not save one) and texted at the staff phone (or `AVA_LEAD_SMS_TO` if they did not save one). Do not store the public demo agent id or the Sales Ava agent id on a customer onboarding row; that would treat those calls as that shop’s leads.

## 6. Phone number (still manual)

The app never buys or attaches a number. After the customer submits `/onboarding/ava`, you get an email with their answers and a link to [docs/AVA_PHONE_SETUP_RUNBOOK.md](./AVA_PHONE_SETUP_RUNBOOK.md). Follow that runbook: attach a number in ElevenLabs, forward their line, place a test call, and only then tell them Ava is live. Phone status stays `pending_manual`.

## 7. One test before you send traffic

1. Open `/ava`, start the Starter trial, and use a real card in Stripe test or live mode.
2. Confirm you and the buyer both get email, and `/onboarding/ava?session_id=...` loads.
3. Submit the form. With `AVA_AUTO_PROVISION_AGENT=true`, the email should include a new ElevenLabs agent id and phone status `pending_manual`.
4. Attach a test number, call it, and confirm the lead lands in `ava_call_leads` and on the staff phone/email.
5. Call the public demo agent and Sales Ava. Those webhooks should return 200 with `reason: "ignored_agent"` and should not add a lead, send mail, or text anyone.
6. Submit the onboarding form a second time with a different lead phone. The save should be rejected. Use “Email me a change link”, open the message sent to the Stripe checkout email, and confirm that link can update the phone.

## 8. Onboarding link lock

`/onboarding/ava?session_id=...` is emailed to the buyer and is enough for the first setup, including the staff phone and email that receive leads.

After that first successful save, the same link cannot change those destinations. Hours, services, call rules, and the staff name can still be updated. A destination change needs a fresh link from “Email me a change link” (`POST /api/ava/onboarding/destination-link`).

That request checks the Checkout Session in Stripe. It sends mail only when the subscription is `active` or `trialing` and Stripe still has a customer email, and it sends only to that Stripe email — never to an address typed into the form. The link is an HMAC-SHA256 token (`AVA_DESTINATION_EDIT_SECRET`, or `STRIPE_SECRET_KEY` if that override is unset) that expires 30 minutes after it is created. The onboarding page removes `edit_token` from the address bar after it loads so the token is not left sitting in the URL. Submitting the form with the token checks Stripe again. The new phone and email are stored only when the token is valid, unexpired, bound to this session, and bound to the email Stripe returns now. One link email is sent per checkout per minute. No new paid service is involved. If the check fails, the previous destinations stay in place.
