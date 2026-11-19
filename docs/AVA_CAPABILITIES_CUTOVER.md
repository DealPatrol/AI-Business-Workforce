# Ava capabilities — go-live checklist (needs Cole's OK)

Built on branch `feat/ava-capabilities-test` and tested on the ElevenLabs TEST copy
`agent_7801m7ttawhge47t0tpwrpwy5wd9` ("Ava TEST copy 2026-11-19", no phone number).
Nothing below has been done in production. Do each step only after Cole approves it.

Hard rules for every step: never print, paste, log or commit a secret value; never show the
Lawncare number; caller-facing brand is Executive Receptionist (executivereceptionist.com);
the demo line is (256) 952-4935 and the public line is (256) 595-3354.

## 1. Tool password cutover (exposed `x-ava-tool-secret` headers) — one window

Today the live demo agent's booking tools (`tool_9601m72afh9rf4n9b6k94jy9dxvs`,
`tool_2701m72afksgefabkz18ytakv58x`) send the calendar tool secret as a plain header value,
and the workspace consent tool (`tool_0101m7r6wbs2eqjsve3a6q3dk6qe`) does the same with
`AVA_CONSENT_TOOL_SECRET`. Anyone who can read the agent config can read them.

Do all of this in one sitting (about 10 minutes); the old secret keeps working until step 1.4.

1. Generate a new random secret on a trusted machine into a file (for example
   `openssl rand -hex 32 > /tmp/ava_demo_tool_secret; chmod 600 /tmp/ava_demo_tool_secret`). Don't echo it.
2. Store it in ElevenLabs secret storage (Agents → Secrets, or `POST /v1/convai/secrets`), name
   `ava_tool_secret_demo_<date>`. Note the returned `secret_id` (the id is not secret).
3. Create new webhook tools for the demo agent with `lib/ava/booking/agent-tools.ts`
   (`attachBookingTools` now stores the secret first and references it as
   `{"x-ava-tool-secret": {"secret_id": "..."}}`), or edit the two live tools' header to the
   secret reference in the ElevenLabs UI. Do not attach yet.
4. In production Supabase, set the demo calendar's `ava_calendars.tool_secret_hash` to the
   SHA-256 hex of the new secret (`hashToolSecret` in `lib/ava/booking/secret.ts`) — computed from
   the file, never typed into a chat.
5. Immediately swap the live demo agent's tools to the secret-reference versions (same window as 4).
6. Verify: one ElevenLabs test call / simulation on the live agent hits `check_availability` and gets
   windows (not 401). Then delete the old plain-text tools from the workspace.
7. Repeat 1–6 for the consent tool: rotate `AVA_CONSENT_TOOL_SECRET` in the Vercel **production** env,
   store the same value as an ElevenLabs secret, point `tool_0101m7r6wbs2eqjsve3a6q3dk6qe`'s header at
   the secret id, redeploy production in the same window.
8. For each paying customer agent, re-run tool attach (new per-calendar secret, stored in ElevenLabs,
   hash in Supabase) — one customer at a time, verify after each.
9. Shred the local secret files.

## 2. Database migration

Apply `supabase/migrations/20261119160000_ava_capabilities.sql` to production Supabase (preview and
production share one database, so it was NOT applied during testing). It only adds columns with
defaults and two new tables (`ava_pages`, `ava_transfers`, RLS on). The code tolerates the columns
being missing, but callbacks, paging logs and transfer screening need it.

## 3. No lost leads

- Merge brings: the post-call webhook emails the operator a "[Held for retry]" lead when saving fails
  and returns 500, plus an hourly reconcile cron (`/api/ava/leads/reconcile`, `15 * * * *`) that replays
  finished conversations that never got saved. Needs `CRON_SECRET` (already used by other crons).
- ElevenLabs post-call webhook retries are a workspace-wide setting (affects every agent). Turn on
  retries in ElevenLabs → Settings → Webhooks only with Cole's OK.

## 4. Demo agent prompt (Front Porch Growth wording)

Copy the TEST copy's prompt (brand: "I'm Ava, an AI receptionist from Executive Receptionist",
executivereceptionist.com only) onto the live demo agent `agent_7401m6jkzsstf0evm2www8r46kj6`.
Keep a copy of the current prompt first so it can be rolled back.

## 5. Warm transfer (up to 3 numbers)

- Decide the real transfer numbers (on-call tech, office, owner). The TEST copy uses placeholders
  +1 205-555-0101 / 0102.
- Warm conference transfer: Ava's `agent_message` briefs the person who answers in one sentence before
  the caller is joined. If nobody answers, Ava returns, pages (emergencies) and holds a callback.
- Voicemail protection ("press 1 to accept"), two options:
  a. Ask ElevenLabs support to enable **call screening on transfers** (`require_acceptance`); the API
     returned 403 "requires feature access" on our workspace. Then set `require_acceptance: true`.
  b. Use our own screen line: buy/assign a dedicated Twilio number, point its voice webhook at
     `/api/twilio/transfer/screen`, set `AVA_TRANSFER_SCREEN_NUMBER` in production and
     `transferMode: 'screened'` per client. (Touches Twilio numbers — needs Cole's OK.)
- One real test call to the transfer numbers before announcing it.

## 6. Callback booking and texts

- Callback windows default to 60 min, 3 per window, 15 min notice, 3-day horizon (per calendar:
  `callback_minutes`, `callback_capacity`). The owner gets an email alert with the deadline.
- Caller confirmation text stays OFF until toll-free verification is approved:
  leave `AVA_BOOKING_SMS_ENABLED` unset. Leave `AVA_OPERATOR_SMS_CONSENT` unset.

## 7. Emergency paging

- Fill `on_call_contacts` (max 3) per client. Email pages work at once; text pages stay OFF
  (`AVA_PAGING_SMS_ENABLED` unset) until Twilio approval and each on-call person's consent.

## 8. Price and FAQ sheet

- Per client, the owner fills the sheet (`price_sheet` with `approvedBy` + `approvedOn`); provisioning
  uploads it as a knowledge-base doc. Without an approved sheet Ava says no dollar figures at all.

## 9. Merge and deploy

Merge the PR, let Vercel deploy production, then run steps 1, 2, 4 in the same evening and smoke-test
with one call to the demo line from Cole's own phone.
