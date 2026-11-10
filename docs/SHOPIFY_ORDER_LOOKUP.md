# Shopify order lookup for the store agent (design, not built)

Status: **design only.** Ava's store agent today answers from the store's written policies and takes
order-specific questions as a message (order number + email + reason) for the team. Nothing on the site
claims live order lookup. Build this when there is a real Shopify store (or a Shopify dev store) to test against.

## Why
"Where is my order?" is the most common store call. Gorgias has deep Shopify data but its AI Agent does not
answer phone calls; most AI receptionists have no store data at all. Live status on the call is the gap.

## Shape
1. **Connect** — Shopify custom app (or public app later) per store, scopes `read_orders`, `read_fulfillments`
   only. Admin API access token stored server-side per customer (encrypted column on `ava_customers` or a
   `store_connections` table). Never in the agent prompt.
2. **Agent tool** — ElevenLabs server (webhook) tool `lookup_order` on the store customer's agent:
   `POST /api/ava/store/order-lookup` with `{ order_number, email_or_phone }` plus a per-agent shared secret
   header. The agent ID in the request maps to exactly one store connection.
3. **Verification before disclosure** — the route returns details only when the order number AND the email
   (or phone) on the order both match. Otherwise: "I couldn't match that, I'll pass it to the team." Rate limit
   per agent and per caller number (e.g. 5 lookups / 10 minutes) to stop enumeration.
4. **What it returns (minimal)** — fulfillment status, carrier, tracking URL presence, estimated delivery if
   Shopify has one, and whether a return is open. No addresses, no payment data, no line-item prices.
5. **Prompt rule** — read back only what the tool returned; never guess a date; damaged / missing / charge
   disputes still go to a person.
6. **Billing** — unchanged: one handled call = $1 regardless of lookups.

## Query
GraphQL Admin API `orders(first: 1, query: "name:#1042")` → `displayFulfillmentStatus`,
`fulfillments { trackingInfo { company url } estimatedDeliveryAt }`, `email`, `phone`, `returnStatus`.

## Tests to write
- mismatch email → no details; matching → status only
- rate limit trips
- agent without a connection → "pass to team" response
- token never logged

## What Cole needs to provide
A Shopify store (a free Shopify Partner dev store is enough) and approval to create a custom app on it.
