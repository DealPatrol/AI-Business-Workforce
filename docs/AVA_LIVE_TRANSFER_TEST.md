# Ava live transfer: "reach a person on the first ask" (Nov 24, 2026)

Cole asked to build and test a live transfer to a human on the Ava line. Nothing here changes site copy,
Twilio settings, SMS flags, or the production public line.

## How the lines are wired today

| Line | Where it goes |
| --- | --- |
| Demo (256) 952-4935 | Twilio number imported into ElevenLabs (`phnum_8501m6s8bqrpfsfb85w52d3x1zd7`), assigned to the Porchlight demo agent `agent_7401m6jkzsstf0evm2www8r46kj6`. |
| Public (256) 595-3354 | **Not** in ElevenLabs. No Ava agent answers it. It is the transfer destination already configured on the demo agent. |

The live demo agent already has the built-in `transfer_to_number` tool: one Twilio warm conference transfer
rule to (256) 595-3354, `require_acceptance: false` (ElevenLabs returned 403 "requires feature access" for
call screening), condition "emergency OR wants a person/owner/manager OR billing/warranty". No real call has
ever used it (no `transfer_to_number` calls in conversation history as of Nov 24, 2026).

## What changed

1. **TEST copy** `agent_6101m88bvq4beqvr4amvrm9xb225` ("Ava TRANSFER TEST copy 2026-11-24 (no phone)"),
   duplicated from the live demo agent. Prompt now:
   - agrees on the FIRST request for a person (no deflecting, never ask twice);
   - collects only name, callback number, short reason (address only for emergencies);
   - reads all three back in one sentence as its own turn and waits for a yes before `transfer_to_number`;
   - briefs the person who answers (`agent_message`: name, callback digits, reason);
   - if nobody answers: says so honestly, says the name/number/message were passed to the office, offers a
     held callback (`book_callback`), never pages for a non-emergency, never retries the number.
2. **Code** (`lib/ava/capabilities/transfer.ts`): the same first-ask + read-back rules go into every customer
   agent built by provisioning (`FIRST_ASK_RULES`), and the prompt no longer lists the transfer phone numbers
   (labels only), so Ava can't read an owner's number aloud.

## Tests (ElevenLabs workspace tests)

| Test | Checks |
| --- | --- |
| `test_0801m88bxnphf4y9nnxpkcpwkcgk` XFER-1 | after a confirmed read-back, calls `transfer_to_number` with a briefing containing name, number, reason |
| `test_1201m88bxwyze1hat02690000rz8` XFER-2 | caller gives everything at once: must NOT transfer before reading back |
| `test_6601m88by1xxes58e19ve4ty2zgk` XFER-3 | read-back wording (name, number, reason; no extra questions) |
| `test_6701m88by5zyfd38kxdt8npc19qg` XFER-4 | "let me talk to somebody": agrees at once, no deflection |
| `test_1801m88by98de4kajknjatsc5dgg` XFER-5 | routine tune-up: no transfer |
| `test_0501m88byc0we6d8fvpc7qmhzdth` XFER-6 | SEO salesman asks for the owner: no transfer |
| `test_2601m88c28n2e5e888f2y2x1excf` XFER-7b | transfer unanswered: honest message + callback |
| `test_2301m88c2f7yesdb7h38bhqgsncy` XFER-7c | transfer unanswered (office): never calls `page_on_call` |
| `test_3101m88byz51e9dskbwxxtbh586x` XFER-8 | full simulated call, happy path |

Simulation mode always reports `transfer_to_number` as success (no telephony), so the unanswered path is
tested with a unit test that injects a failed tool result.

## Going live on the demo line (needs Cole's OK)

Copy the TEST copy's LIVE TRANSFER + ESCALATION sections onto `agent_7401m6jkzsstf0evm2www8r46kj6`
(current live version `agtvrsn_6801m7twjqv3ek5a5cqa2hww2zax`, keep it for rollback), re-run the suite against
the live agent, then do one real phone test.

## Real phone test (two phones)

1. Make sure (256) 595-3354 rings a phone Cole will answer, and that it is NOT the Twilio missed-call
   text-back number (an unanswered transfer there could trigger an auto-text).
2. From a second phone (not the one 595-3354 rings), call (256) 952-4935.
3. Say: "Can I talk to a real person?" Ava should agree at once and ask your name.
4. Give a name, a callback number, and "a question about my bill". Ava reads all three back; say "yes".
5. Ava: "Please hold..." The 595-3354 phone rings with the demo line's caller ID. Answer: you should hear
   Ava's one-sentence briefing, then be joined with the caller.
6. Repeat and do NOT answer: after the ring timeout Ava should come back, say nobody could pick up, say the
   message was passed on, and offer a callback window. Note: with `require_acceptance: false`, if that phone
   sends the call to voicemail, the caller is joined to voicemail instead of coming back to Ava.

## Cost

A transferred call keeps both Twilio legs open for the whole human conversation: the inbound minute on the
Ava number plus an outbound minute to the destination plus conference participant minutes (roughly
2 to 3 cents per minute total at Twilio's public US rates). ElevenLabs agent minutes stop once Ava drops off
after the briefing.
