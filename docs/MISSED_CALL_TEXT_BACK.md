# Missed-Call Text-Back (Twilio)

Ring the owner's phone first. If nobody answers within ~20 seconds (or the line is busy / the call fails),
text the caller back automatically and text the owner an alert. Replies from the caller are forwarded to the owner.

## Routes

| Twilio setting (on the missed-call number) | URL | Method |
| --- | --- | --- |
| Voice: "A call comes in" | `https://frontporchgrowth.com/api/twilio/voice` | HTTP POST |
| Messaging: "A message comes in" | `https://frontporchgrowth.com/api/twilio/sms` | HTTP POST |

`/api/twilio/voice/status` is the `<Dial action>` callback. Twilio calls it automatically; do not set it on the number.

Every route validates `X-Twilio-Signature` with `TWILIO_AUTH_TOKEN`. Without the token they answer 503 and do nothing;
a bad signature gets 403. Use the exact public URLs above (no redirects; the apex domain serves `/api` directly).

## Flow

1. `POST /api/twilio/voice` returns `<Dial timeout="20" action="/api/twilio/voice/status">MISSED_CALL_FORWARD_NUMBER</Dial>`.
   If `MISSED_CALL_FORWARD_NUMBER` is missing, it plays a short apology and hangs up.
2. `POST /api/twilio/voice/status` on `DialCallStatus` = `no-answer`, `busy`, or `failed`:
   - texts the caller `MISSED_CALL_TEXT_TEMPLATE` (default below) when the caller ID is a valid E.164 number;
   - texts the owner (`AVA_LEAD_SMS_TO`, falling back to `MISSED_CALL_FORWARD_NUMBER`) a missed-call alert.
   Answered calls do nothing.
3. `POST /api/twilio/sms` forwards the caller's reply to the owner as `Text from +1...: <message>` and returns empty TwiML.
   The owner's own texts are not echoed back.

Default text: "Sorry we missed your call! We're with a customer right now. Reply to this text with what you need and we'll get right back to you."

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
