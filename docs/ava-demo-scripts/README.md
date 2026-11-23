# Ava demo call scripts (Alabama trades)

Text-only scripts for recording or generating sample calls for the Executive Receptionist
city and trade pages. **No audio was generated.** Generating audio with ElevenLabs uses
paid credits, so Cole should decide whether and when to render these.

Rules every script follows (same as the live product and the site copy):

- Ava says she is an AI receptionist in the greeting.
- Every shop is made up, every caller is made up, and phone numbers use the 555-01xx range.
- Ava does not quote prices, promise an arrival time, or give technical advice the owner has not approved.
- The call ends with the lead being emailed to the owner (text alerts are not live until 10DLC approval).
- Each script closes with the demo line, (256) 952-4935, only in the narrator outro, never inside the call.

| File | Trade | City page it supports |
| --- | --- | --- |
| `hvac-cullman.md` | HVAC no-cool after hours | /ava/ai-answering-service-cullman-al |
| `plumbing-huntsville.md` | Plumbing active leak | /ava/ai-answering-service-huntsville-al |
| `roofing-gadsden.md` | Roofing storm leak | /ava/ai-answering-service-gadsden-al |
| `electrical-birmingham.md` | Electrical breaker tripping | /ava/ai-answering-service-birmingham-al |

Suggested rendering (if approved): two voices (Ava = the existing Ava voice from
`docs/AVA_VOICE_OPTIONS.md`; caller = a neutral Southern US voice), 30–50 seconds each,
exported as MP3 into `public/er/audio/` and wired to the existing "Sample call" player.
