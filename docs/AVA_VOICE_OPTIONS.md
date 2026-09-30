# Ava demo voice options

The personalized Ava browser demo offers three customer-facing voices:

| Demo choice | Voice key | Server-only environment variable |
| --- | --- | --- |
| Southern Working Man (default; recommended for Alabama trades) | `southern-man` | `ELEVENLABS_AGENT_ID_SOUTHERN_MAN` |
| Southern Woman | `southern-woman` | `ELEVENLABS_AGENT_ID_SOUTHERN_WOMAN` |
| Clear American Woman | `american-woman` | `ELEVENLABS_AGENT_ID_AMERICAN_WOMAN` |

Each option uses a separate ElevenLabs agent. The app does not send per-call TTS voice overrides. If an option-specific ID is missing, that option safely uses `ELEVENLABS_AGENT_ID`, the existing demo and customer-duplication template.

## ElevenLabs dashboard setup

1. Open the tested Ava template agent in ElevenLabs Conversational AI.
2. Duplicate it three times so the prompt, first message, tools, dynamic variables, and analysis settings stay aligned.
3. Name the copies clearly, for example `Ava Demo — Southern Working Man`, `Ava Demo — Southern Woman`, and `Ava Demo — Clear American Woman`.
4. In each copy, change only the configured voice. Preview the agent in the ElevenLabs dashboard and confirm pronunciation, latency, turn-taking, and the Alabama trade vocabulary used in the demo.
5. Copy each agent ID from its dashboard URL or settings into the matching server-only Vercel environment variable.
6. Add the variables to Production and Preview, redeploy, and test all three choices in the personalized browser demo. Never expose these IDs through `NEXT_PUBLIC_*`.

The signed-URL endpoint accepts `voice=southern-man`, `voice=southern-woman`, or `voice=american-woman`. Unknown keys are rejected. Signed URLs and agent IDs remain server-side.

## Boundaries that must stay separate

- `ELEVENLABS_SALES_AGENT_ID` continues to power Sales Ava on `/ava`. The demo voice picker does not select or modify the Sales Ava agent.
- `ELEVENLABS_AGENT_ID` remains the source duplicated by customer provisioning in `lib/ava/provisioning.ts`. The three voice-specific demo IDs do **not** change that source.
- The optional onboarding preference is included in Cole's setup notification for manual configuration. It does not silently change the provisioning duplicate source or patch a duplicated agent's TTS settings.
- These are browser demo voices only. This feature does not create a public dial-in number or change phone-number assignment.

If customer provisioning should later duplicate a voice-specific template, treat that as a separate provisioning change: persist and validate the preference, document the source-selection rules and fallback, and verify that every template has matching tools and conversation configuration first.
