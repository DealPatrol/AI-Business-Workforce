# Missed-Call Text-Back (Twilio)

Ring the owner's phone first. If nobody answers within ~20 seconds (or the line is busy / the call fails),
ask the caller for consent (press 1 / say yes), save that answer, and only then text the caller back once. The owner gets a
missed-call alert only if they gave written SMS consent (`ava_onboardings.sms_consent = true` for that `staff_phone`).
Replies from the caller are forwarded to the owner under the same written-consent rule.

## Routes

| Twilio setting (on the missed-call number) | URL | Method |
| --- | --- | --- |
| Voice: "A call comes in" | `https://frontporchgrowth.com/api/twilio/voice` | HTTP POST |
| Messaging: "A message comes in" | `https://frontporchgrowth.com/api/twilio/sms` | HTTP POST |

`/api/twilio/voice/status` is the `<Dial action>` callback and `/api/twilio/voice/consent` is the `<Gather action>`
for the consent prompt. Twilio calls both automatically; do not set them on the number.

Every route validates `X-Twilio-Signature` with `TWILIO_AUTH_TOKEN`. Without the token they answer 503 and do nothing;
a bad signature gets 403. Use the exact public URLs above (no redirects; the apex domain serves `/api` directly).

## Flow

1. `POST /api/twilio/voice` returns `<Dial timeout="20" action="/api/twilio/voice/status">MISSED_CALL_FORWARD_NUMBER</Dial>`.
   If `MISSED_CALL_FORWARD_NUMBER` is missing, it plays a short apology and hangs up.
2. `POST /api/twilio/voice/status` on `DialCallStatus` = `no-answer`, `busy`, or `failed`:
   - never texts the caller; it returns a `<Gather input="dtmf speech">` that plays the consent prompt
     (brand, rates, STOP/HELP, press 1 or say yes; press 2, say no or hang up for no text);
   - texts the owner (`AVA_LEAD_SMS_TO`, falling back to `MISSED_CALL_FORWARD_NUMBER`) a missed-call alert only with
     written consent on file. Answered calls do nothing.
   `POST /api/twilio/voice/consent` writes the yes/no to `sms_consents` (method `keypad` or `verbal`, script version,
   full prompt text, CallSid). Only a saved, first-time yes sends the one callback text. A failed save means no text.
3. `POST /api/twilio/sms` forwards the caller's reply to the owner as `Text from +1...: <message>` and returns empty TwiML.
   The owner's own texts are not echoed back.

Default text: "Executive Receptionist: Sorry we missed your call for [Business]. Reply with what you need or call us back at
[number]. Msg & data rates may apply. Reply STOP to opt out, HELP for help." (`MISSED_CALL_BUSINESS_NAME` fills [Business].)

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `TWILIO_ACCOUNT_SID` | yes | |
| `TWILIO_AUTH_TOKEN` | yes | signature validation + REST auth |
| `TWILIO_FROM_NUMBER` | yes | the Twilio number texts are sent from (normally the missed-call number) |
| `MISSED_CALL_FORWARD_NUMBER` | yes | owner's cell, E.164 (e.g. `+12565551234`) |
| `MISSED_CALL_TEXT_TEMPLATE` | no | overrides the default caller text |
| `AVA_LEAD_SMS_TO` | no | owner alert destination; falls back to `MISSED_CALL_FORWARD_NUMBER` |

Twilio trial accounts can only text and call verified numbers, and prefix messages with a trial notice.
US A2P 10DLC registration is required before texting customers at volume.

## Abuse / compliance guards

- Auto-text goes only to US/Canada (`+1` NANP) caller IDs that are not our own numbers (`TWILIO_FROM_NUMBER`, `MISSED_CALL_FORWARD_NUMBER`, `AVA_LEAD_SMS_TO`). Anonymous and international numbers are never texted (SMS-pumping protection).
- At most one auto-text per caller per 24h; owner alerts capped at 30/hour; reply forwards capped at 10/hour per sender. Limits are in-memory per server instance (best effort); keep Twilio Geo Permissions for SMS limited to US/Canada as the hard backstop.
- Every caller text includes "Executive Receptionist", "Msg & data rates may apply" and "Reply STOP to opt out, HELP for help"
  (added to custom templates that lack them). Twilio Advanced Opt-Out handles STOP/HELP.
- Consent records live in `public.sms_consents` (RLS on, service role only) and are kept 4+ years after the last message.
- Do **not** point the old ElevenLabs demo number (the Collins Lawncare line, which must never be published) at these webhooks: its Voice webhook belongs to ElevenLabs. Use a separate Twilio number for Missed-Call Text-Back.
