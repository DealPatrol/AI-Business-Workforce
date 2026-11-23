# Overflow plan billing ($25/month, 60 minutes, then $1.00/minute)

Approved by Cole on Nov 23, 2026. It's the cheapest plan, for budget owners who only need calls
covered during set hours or as overflow. It claims only live features: 24/7 answering, caller
details, and an emailed summary of every call. It makes no booking, SMS, transfer, calendar or
in-person setup claims.

## Stripe (Workspace account acct_1TfxBvRJZZUpaweB, live)

| What | ID |
| --- | --- |
| Product `Executive Receptionist - Overflow` | `prod_VgQBSQTtbncg0M` |
| $25/month licensed price (lookup key `er_overflow_monthly_25`) | `price_1Uf3L9RJZZUpaweB6P0IJSX5` |
| $1.00 one-time overage price, used as an invoice item (lookup key `er_overflow_overage_minute_1`) | `price_1Uf3LBRJZZUpaweB6SYCGUbU` |

Env vars:
- `STRIPE_AVA_OVERFLOW_PRICE_ID` = the $25/month price. It's set for Production and Preview.
- `STRIPE_AVA_OVERFLOW_MINUTE_PRICE_ID` is optional and **unset**. If it's set to a metered
  recurring price, Checkout adds it as a second line item, the same way the store plan adds
  `store_call`.

There's no metered price yet. Creating one needs a Billing Meter, and the Stripe connector we
used can't create meters. Billing Meters are the current Stripe requirement for metered prices.
To switch to automatic metering later:
1. In the Dashboard, create the meter `ava_overflow_minute`: sum aggregation, customer mapping
   `payload[stripe_customer_id]`, value `payload[value]`.
2. Create a monthly metered price on the product, graduated tiers: 1–60 at $0, then 61+ at
   $1.00. Report every answered minute, and the first 60 are free.
3. Set `STRIPE_AVA_OVERFLOW_MINUTE_PRICE_ID`. New checkouts will include it.
4. Add a reporter, for example in `/api/webhooks/elevenlabs` next to `meterStoreCall`, that sends
   `ceil(call_duration_secs / 60)` per conversation with identifier
   `overflow_min_<conversation_id>`, for customers with `plan='overflow'`.

## Checkout

`/api/checkout?plan=overflow` and `/buy/overflow` create a subscription Checkout Session with the
$25 price. There's no coupon and no trial. The submit text says "60 minutes included per month.
$1/min after 60, billed on your next invoice." Metadata: `plan=overflow`,
`included_minutes=60`, `overage_cents=100`.

## Overage reporting today: manual

Once per billing period, before the invoice finalizes (Stripe leaves a draft open about 1 hour),
or at the latest by the period end:
1. Total the customer's answered call minutes for the period. Use ElevenLabs conversation
   durations for their agent, or the Desk usage meter (`lib/desk/usage.ts`). Cross-check against
   Twilio inbound minutes if they're close to the line.
2. Overage minutes = max(0, total − 60). Round each call up to the minute, the same as the Desk
   meter.
3. If overage is > 0, add an invoice item to the customer's subscription with price
   `price_1Uf3LBRJZZUpaweB6SYCGUbU` and quantity = overage minutes. Set `subscription` so it
   lands on the next subscription invoice.
4. If a customer is regularly over about 100 minutes, offer Starter ($79 for 100) or Growth. At
   about 114 minutes, Overflow costs more than Starter.

Spam, robocalls and wrong numbers are credited back after review, the same billing policy as the
other plans.
