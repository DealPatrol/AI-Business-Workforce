# Online Store plan billing ($119/month + $1 per handled call)

Decided by Cole, Nov 2026. Home-service pricing ($25 per booked job, max $297/mo) is unchanged.

## Stripe (Workspace account, live)

| What | ID |
| --- | --- |
| Product `Executive Receptionist - Online Store` | `prod_VbMvdAgKnmSxna` |
| $119/month licensed price (lookup key `er_store_monthly_119`) | `price_1UaABQRJZZUpaweBnEM7nHht` |
| $1/unit monthly metered price (lookup key `er_store_call_1`) | `price_1UaABRRJZZUpaweBDR8inRr1` |
| Meter `store_call` (sum, `payload[stripe_customer_id]`, `payload[value]`) | `mtr_61VjY8fajPVDWE9JE41RJZZUpaweBJsW` |

Env vars: `STRIPE_AVA_STORE_BASE_PRICE_ID`, `STRIPE_AVA_STORE_CALL_PRICE_ID`
(set for Preview on `design/pricing-smith-layout` only; add them to Production before launch).

## Checkout

`POST /api/checkout` with `plan=store` creates a subscription Checkout Session with both prices,
`trial_period_days=14`, `payment_method_collection=always` (card on file, $0 today), and
`metadata.product=ava`, `metadata.plan=store`. The Stripe webhook stores the customer in
`ava_customers` with `plan='store'`, the same way as the pilot.

## Metering a handled call

Automatic: `/api/webhooks/elevenlabs` (post_call_transcription) → `savePostCallLead` →
`meterStoreCall` (`lib/ava/store-call-billing.ts`). One `store_call` event per conversation, with
identifier `store_call_<conversation_id>`, so retries never double-bill.

A call is billed only when:

- the agent's onboarding is matched to an `ava_customers` row with `plan='store'` and a `stripe_customer_id`;
- the subscription is `active` or `past_due` (trial calls are free; canceled is never billed);
- the caller spoke at least once (hang-ups before anyone speaks are free).

Prerequisite: the store's ElevenLabs agent must send post-call webhooks to `/api/webhooks/elevenlabs`
and its agent id must be on the store's `ava_onboardings.elevenlabs_agent_id`.

Store customers are never metered `booked_job`: marking a lead booked on the desk records it with
`billing_skip_reason='store_plan'`.
