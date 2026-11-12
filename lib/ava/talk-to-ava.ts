/**
 * "Talk to Ava" buttons under each plan card.
 *
 * The browser talks to a dedicated public web-demo agent ("Ava - Website Talk to Ava (public demo)").
 * That agent introduces itself as Ava from Executive Receptionist, requires a signed URL, only accepts
 * our own domains as origins, ends after 3 minutes (or 25s of silence), and is capped at 150
 * conversations a day and 5 at once in ElevenLabs. Agent IDs are not secrets.
 */
import { createRateLimiter } from '@/lib/rate-limit';

export const DEFAULT_TALK_AGENT_ID = 'agent_8101m78w0ks0fv5vzwysbdr9s6z8';

export function talkAgentId() {
  return process.env.ELEVENLABS_TALK_AGENT_ID || DEFAULT_TALK_AGENT_ID;
}

/** Mirrors the agent's max_duration_seconds; the browser also hangs up at this mark. */
export const TALK_MAX_SECONDS = 180;

/** Pre-recorded greeting in Ava's current voice (ElevenLabs "Jen", lib/ava/voice.ts), played when there is no mic. */
export const AVA_GREETING_SRC = '/voices/ava-greeting.mp3';
export const AVA_GREETING_TRANSCRIPT =
  "Hi, I'm Ava, the AI receptionist from Executive Receptionist. When a customer calls your shop and you can't pick up, I answer. I get their name, their number, and what they need, and I send you the details right after the call. Thanks for listening, and y'all have a good one.";

/** Per-visitor cap on new demo sessions: 4 per 10 minutes per IP (best effort, per server instance). */
export const takeTalkSession = createRateLimiter(4, 10 * 60 * 1000);

/** Microphone errors that should switch to the pre-recorded greeting instead of showing an error. */
export function isNoMicError(error: unknown) {
  const name = (error as { name?: string } | null)?.name || '';
  return [
    'NotAllowedError',
    'PermissionDeniedError',
    'NotFoundError',
    'DevicesNotFoundError',
    'NotReadableError',
    'TrackStartError',
    'SecurityError',
    'OverconstrainedError',
    'TypeError',
  ].includes(name);
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
