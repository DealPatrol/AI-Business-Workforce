# Claims pack: Ava client dashboard, text-back, transfer, booking link, referrals, ReputationFlow

Apply `supabase/migrations/20261013090000_claims_features_reputationflow.sql` in the Supabase SQL editor first.

## Env vars
| Var | Needed for | Notes |
|---|---|---|
| ELEVENLABS_WEBHOOK_SECRET | Ava post-call lead text + summary email (MISSING in prod today; webhook returns 503) | HMAC secret from ElevenLabs → Workspace webhooks; point to /api/webhooks/elevenlabs |
| OUTBOUND_LIVE | real customer texts/emails | leave unset = TEST MODE (email → colecollins763@gmail.com, SMS → OUTBOUND_TEST_PHONE only) |
| OUTBOUND_TEST_PHONE | test SMS | Cole's own cell |
| OUTBOUND_TEST_EMAIL | test email | default colecollins763@gmail.com |
| RESEND_API_KEY | all email | exists in Production only; add to Preview to test |
| NEXT_PUBLIC_APP_URL | links in emails / review pages | set per environment |
| NEXT_PUBLIC_AVA_DEMO_NUMBER | /ava/call page | e.g. +12566637007; page falls back to browser demo when unset |
| NEXT_PUBLIC_REFERRAL_REWARD | /referrals copy | optional, Cole decides reward |
| PROSPECTOR_ALLOWED_EMAILS | Lead Finder lock | default colecollins763@gmail.com |
| REPUTATIONFLOW_HOST | extra hosts that serve /reputationflow at root | reputationflow.com is built in |
| REVIEW_SCORE_DAILY_CAP | free score tool | default 25/day, 3 per IP |
| OPENAI_REPLY_MODEL | reply drafts | default gpt-4o-mini |

Twilio: set the number's "A message comes in" webhook to /api/twilio/sms (STOP/START tracking).
Supabase Auth: add preview + production `/auth/callback` URLs to Redirect URLs for email sign-in links.
