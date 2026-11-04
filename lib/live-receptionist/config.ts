/**
 * Live video receptionist prototype (/receptionist/live).
 *
 * Two faces:
 * - Real face (preferred): a photorealistic stock avatar streamed by Simli (https://www.simli.com),
 *   lip-synced in real time to the ElevenLabs agent's own voice. On when SIMLI_API_KEY is set.
 *   The face is a Simli stock avatar (SIMLI_FACE_ID), never a real identifiable person.
 * - Fallback: the original illustrated SVG character drawn in this repo, mouth driven by the agent audio.
 */

/** Public demo agent ("Executive Receptionist - Demo"). Agent IDs are not secrets. */
export const DEFAULT_LIVE_AGENT_ID = 'agent_9501m56myx6xfmaty2v1dxn56mve';

/** Simli stock face used in Simli's own ElevenLabs starter. Override with SIMLI_FACE_ID. */
export const DEFAULT_SIMLI_FACE_ID = '5514e24d-6086-46a3-ace4-6a7264e5cb7c';

export function liveAgentId() {
  return process.env.ELEVENLABS_LIVE_AGENT_ID || DEFAULT_LIVE_AGENT_ID;
}

/** Server only. True when the photorealistic Simli face can be used. */
export function realFaceEnabled() {
  return Boolean(process.env.SIMLI_API_KEY);
}

export function simliFaceId() {
  return process.env.SIMLI_FACE_ID || DEFAULT_SIMLI_FACE_ID;
}

/** Floating "Talk to us face to face" widget. Off unless explicitly enabled. */
export function liveWidgetEnabled() {
  return process.env.NEXT_PUBLIC_LIVE_AVATAR_WIDGET === '1';
}
