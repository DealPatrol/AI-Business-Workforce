/**
 * Ava's speaking voice on every ElevenLabs agent (demo line, website demo, niche demos, customers).
 * Nov 12, 2026: switched from "Sarah" (EXAVITQu4vr4xnSDxMaL) to "Jen" at Cole's pick.
 * The voice must be in the ElevenLabs workspace's "My voices" for agents to accept it.
 */
export const AVA_VOICE = {
  id: 'QLAlOeRuLwKX0skeTR7R',
  name: 'Jen - Calm, Confident, and Conversational',
  /** Agents keep their TTS model; Jen works on eleven_v4_turbo and eleven_v3_conversational. */
  agentModel: 'eleven_v4_turbo',
} as const;

/** The previous voice, kept for reference and rollback. */
export const PREVIOUS_AVA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
