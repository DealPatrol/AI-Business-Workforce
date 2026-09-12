# Ava phone setup runbook

Owner: Cole
Launch rule: Ava is not live until a customer test call passes.

## Customer path (live today)

1. The customer pays through Ava Checkout (`POST /api/checkout`) or an **Ava-specific** Stripe Payment Link.
2. Stripe returns the customer to `/onboarding/ava`.
3. The customer submits business name, hours, services, call-handling rules, staff name and phone/email, calendar preference, and urgent-call rules.
4. Cole receives the setup answers by Resend. If Resend is unavailable, the page opens a pre-filled email to `colecollins763@gmail.com`.

Never use the shared founding Payment Link for this handoff. Visual Canvasser also uses it, so changing its completion URL to Ava onboarding sends the wrong buyers into Ava setup. An Ava Payment Link should have its own completion URL and include `{CHECKOUT_SESSION_ID}` when possible.

## Cole's current phone launch checklist

1. In ElevenLabs ConvAI, create an agent for the customer or duplicate the Ava template agent. The browser demo uses `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`.
2. Put the onboarding answers into the agent prompt/knowledge: greeting, services, hours, qualification and booking rules, escalation and urgent rules, and staff handoff.
3. Attach a phone number in ElevenLabs. If Twilio is the source, buy/select the number in Twilio and import it into ElevenLabs.
4. Give the customer the Ava number, or have the customer/carrier forward the existing business line to it.
5. Confirm lead summaries reach the intended email/inbox. `AVA_LEAD_NOTIFICATION_EMAIL` controls the existing Ava lead email destination.
6. Make a live test call with the customer. Test normal, booking, out-of-hours, urgent, and staff-handoff cases.
7. Launch only after the test passes. Do not describe phone, SMS, calendar writes, or transfers as live until each is configured and tested.

## Provisioning slice in this repo

After onboarding, the app stores a private `ava_onboardings` record in Supabase and includes its ID and status in Cole's email. Phone status remains `pending_manual`.

There are two agent-create modes:

- Default/manual trigger: call `POST /api/ava/provision` with `{"onboardingId":"..."}` and `Authorization: Bearer $AVA_PROVISIONING_SECRET`.
- Opt-in automatic trigger: set `AVA_AUTO_PROVISION_AGENT=true`. A form submission with a paid, complete Ava Checkout Session then duplicates `ELEVENLABS_AGENT_ID`, patches the new agent with the customer's greeting and operating rules, and records the returned agent ID. `/api/checkout` sessions are recognized by their Ava plan metadata. For an Ava-specific Payment Link, also set `AVA_STRIPE_PAYMENT_LINK_ID` and configure its completion URL to pass `{CHECKOUT_SESSION_ID}`.

Example manual trigger:

```bash
curl -X POST "$APP_URL/api/ava/provision" \
  -H "Authorization: Bearer $AVA_PROVISIONING_SECRET" \
  -H "Content-Type: application/json" \
  --data '{"onboardingId":"UUID_FROM_COLES_EMAIL"}'
```

A successful response/status of `agent_ready_phone_pending` means only that the customer agent exists and is configured. It does **not** mean a number is attached or calls/SMS are live. Agent retries reuse a recorded agent ID rather than cloning another agent.

Target path: verified Ava payment → onboarding → saved record → customer agent creation → number allocation/import and assignment → lead-delivery check → customer test call → explicit launch approval. ElevenLabs supports importing a Twilio/SIP number and assigning an agent, but number purchase/allocation and safe inventory selection are intentionally still manual in this slice.

## Environment variables

Required for stored onboarding and notifications:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server only)
- `RESEND_API_KEY`

Required to create/configure an agent:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID` (the Ava template; it also remains the browser-demo agent)
- `AVA_PROVISIONING_SECRET` (long random server-only value for the internal trigger)
- `AVA_AUTO_PROVISION_AGENT=true` only after the template and workflow have been tested
- `STRIPE_SECRET_KEY` (used to verify payment before submit-time creation)
- `AVA_STRIPE_PAYMENT_LINK_ID` when an Ava-specific Payment Link should qualify for automatic creation

Related production settings:

- `AVA_LEAD_NOTIFICATION_EMAIL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit any value. Missing credentials leave a truthful pending status; they never produce a fake number.

## What to tell the customer

> Payment and your setup form reserve your Ava build. We configure Ava around your hours, services, booking and urgent-call rules, connect or forward your business number, and test a live call with you. Your phone service does not launch until that test passes.
