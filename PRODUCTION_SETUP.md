# Production setup

The application code is designed to degrade safely when integrations are not configured. Demo UI remains usable, while live features activate only after their server credentials exist.

## Supabase

1. Create/select the Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through your normal migration workflow.
3. Add these Vercel environment variables for Production, Preview, and Development as appropriate:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only; never prefix this with NEXT_PUBLIC_)
4. Review Row Level Security policies before onboarding real customers.

## OpenAI

Add `OPENAI_API_KEY` to Vercel as a server-only environment variable. `OPENAI_AUDIT_MODEL` can override the default audit model. The API route `/api/audit` uses the Responses API and returns a safe deterministic fallback recommendation when no API key is configured.

## Founding-request email

Add `RESEND_API_KEY` as a server-only Vercel environment variable. The public founding form sends requests directly to `colecollins763@gmail.com`. If email delivery is unavailable, the form explicitly opens the visitor's email client with their answers preserved instead of displaying a false success state.

TODO before enabling payment CTAs: configure and test Stripe in production, then create a checkout flow for the advertised $299 founding launch and $99/month managed automation. The existing `/api/checkout` route models separate Ava tiers and production currently returns `503`; it must not be presented as a working founding checkout.

## Current production boundary

Implemented in code:
- interactive sales/product experience
- dashboard and property workflow
- Supabase SSR client utilities
- database schema for businesses, audit leads, contractor settings, projects and agent runs
- RLS owner policies for authenticated application data
- server-side AI Business Audit endpoint with fallback mode

Still requires credentials/integration work before claiming live:
- persisting public audit leads into Supabase
- authentication screens/session proxy
- generated property imagery
- live supplier inventory/pricing
- Stripe checkout/subscriptions
- SMS/phone/email sending
- postcard fulfillment

Never commit secrets to GitHub. Configure them in Vercel/Supabase secret management.
