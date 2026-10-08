# Ava on its own domain

Ava and YardProof share this Next.js app. YardProof stays at `/` on the app host. Ava’s marketing page can become the homepage of a second host, such as `aiansweringserviceforcontractors.com`, without a second project.

## What to set

In the Vercel project, for Production (and Preview if you want preview URLs to match):

| Variable | Example | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://aiansweringserviceforcontractors.com` | Yes, for canonicals, sitemap, and Open Graph |
| `SITE_URL` | `https://aiansweringserviceforcontractors.com` | Set the same value. Server code reads this if the public variable is missing. |
| `AVA_MARKETING_HOSTS` | `www.aiansweringserviceforcontractors.com` | Only for extra hosts. The host inside `NEXT_PUBLIC_SITE_URL` is already included. |
| `NEXT_PUBLIC_AVA_MARKETING_HOSTS` | same as `AVA_MARKETING_HOSTS` | Optional duplicate so the value is available everywhere Next inlines public env. |
| `NEXT_PUBLIC_APP_URL` | `https://ai-business-workforce.vercel.app` | Keep this on the YardProof / app origin. Do not point it at the Ava domain. |

Rules:

- `https`, no trailing slash, no path.
- Do not invent Stripe, ElevenLabs, or analytics keys. Checkout still uses the existing `STRIPE_SECRET_KEY`. Web Analytics still has to be enabled on the Vercel project.
- Leave `NEXT_PUBLIC_SITE_URL` and `SITE_URL` empty until the domain is attached. Empty means Ava canonicals stay on `NEXT_PUBLIC_APP_URL`, or `https://ai-business-workforce.vercel.app` when that app URL is localhost.

## What the app does with those values

- Ava canonicals, Open Graph URLs, and Ava sitemap entries use `NEXT_PUBLIC_SITE_URL`, then `SITE_URL`.
- If that host is different from `NEXT_PUBLIC_APP_URL`, requests to `/` on that host are rewritten to the Ava page. Visitors still see `/`.
- Requests to `/ava` on that host 308-redirect to `/` so there is one homepage. Query strings are kept. A `checkout` query also lands on `#pricing`.
- `www` is not assumed. Either redirect `www` to the apex in Vercel, or list `www…` in `AVA_MARKETING_HOSTS`.
- Trade pages stay at `/ava/<slug>` on both hosts.
- YardProof `/` on `ai-business-workforce.vercel.app` is unchanged.

## Vercel steps

1. Project → Settings → Domains → add `aiansweringserviceforcontractors.com`.
2. At the registrar, point the domain at Vercel the way the Domains screen instructs (usually an A record or ALIAS, plus a CNAME for `www` if you use it).
3. Set the environment variables in the table above.
4. Redeploy. Canonicals are read at runtime for the sitemap and robots file, and `NEXT_PUBLIC_*` values are baked into the client build, so a new deployment is required after changing them.
5. In Vercel → Analytics, enable Web Analytics for this project. The app already renders `<Analytics />` and sends `demo-play`, `signup-click`, and `checkout-started`.
6. In Google Search Console, add the new domain and submit `https://aiansweringserviceforcontractors.com/sitemap.xml`.

## Checkout

Ava plans still start at `/api/checkout?plan=starter|growth|pro` (Stripe). Success returns to `/onboarding/ava`. That path works on the Ava host and on the app host. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` have to exist or checkout shows the existing “unavailable” message. This change does not add price IDs or secret keys.

## Pages that should rank

The sitemap includes `/` (or `/ava` when no dedicated domain is set), `/receptionist-demo`, and these paths:

- `/ava/ai-answering-service-for-plumbers`
- `/ava/ai-answering-service-for-hvac`
- `/ava/ai-answering-service-for-roofers`
- `/ava/ai-answering-service-for-electricians`
- `/ava/ai-answering-service-for-landscapers`
- `/ava/ai-answering-service-for-lawn-care`
- `/ava/ai-answering-service-for-pest-control`
- `/ava/ai-answering-service-for-cleaning`
- `/ava/ai-answering-service-for-painters`
- `/ava/ai-answering-service-for-general-contractors`
- `/ava/ai-answering-service-for-dentists`
- `/ava/ai-answering-service-for-law-firms`
- `/ava/ai-answering-service-for-garage-door`
- `/ava/ai-answering-service-for-tree-service`
- `/ava/ai-answering-service-for-pool-companies`
- `/ava/ai-answering-service-for-fencing`
- `/ava/ai-receptionist-for-small-business`
- `/ava/ai-receptionist-vs-answering-service`
- `/ava/missed-call-cost-calculator`
- `/ava/missed-call-answering-home-services`

Older slugs (`/ava/ai-receptionist-plumbers` and the other four listed in `lib/ava/legacy-paths.ts`) 308 to the new URLs.
