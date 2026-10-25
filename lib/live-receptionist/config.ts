/**
 * Live video receptionist prototype (/receptionist/live).
 *
 * The on-screen person is an original illustrated SVG character drawn in this repo
 * (no third-party likeness). Her mouth is driven by the ElevenLabs agent's output audio.
 */

/** Public demo agent ("Executive Receptionist - Demo"). Agent IDs are not secrets. */
export const DEFAULT_LIVE_AGENT_ID = 'agent_9501m56myx6xfmaty2v1dxn56mve';

export function liveAgentId() {
  return process.env.ELEVENLABS_LIVE_AGENT_ID || DEFAULT_LIVE_AGENT_ID;
}

/** Floating "Talk to us face to face" widget. Off unless explicitly enabled. */
export function liveWidgetEnabled() {
  return process.env.NEXT_PUBLIC_LIVE_AVATAR_WIDGET === '1';
}
