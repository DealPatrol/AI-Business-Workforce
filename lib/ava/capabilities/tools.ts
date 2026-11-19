/**
 * ElevenLabs webhook tools for callbacks, on-call paging and screened transfers, plus the helper that
 * keeps tool secrets in ElevenLabs secret storage instead of as plain-text header values.
 */
import { TOOL_SECRET_HEADER } from '@/lib/ava/booking/secret';

/** A header value ElevenLabs resolves from its workspace secret storage at call time. */
export type SecretRef = { secret_id: string };
export type ToolSecret = string | SecretRef;

export function isSecretRef(value: unknown): value is SecretRef {
  return Boolean(value && typeof value === 'object' && typeof (value as SecretRef).secret_id === 'string' && (value as SecretRef).secret_id);
}

/** Request headers for an Ava webhook tool. Prefer a SecretRef; a raw string is only for local tests. */
export function toolHeaders(secret: ToolSecret) {
  return { [TOOL_SECRET_HEADER]: isSecretRef(secret) ? { secret_id: secret.secret_id } : secret, 'Content-Type': 'application/json' };
}

const conversationIdParam = { type: 'string', dynamic_variable: 'system__conversation_id', description: '' };
const callerIdParam = { type: 'string', dynamic_variable: 'system__caller_id', description: '' };

export function callbackToolConfig(baseUrl: string, secret: ToolSecret) {
  return {
    tool_config: {
      type: 'webhook',
      name: 'book_callback',
      description:
        'Hold a real callback window so the team calls the caller back at a promised time. Call it first WITHOUT slot_start to get up to two windows, offer them, then call it again WITH the chosen slot_start. Only after it returns held: true may you tell the caller a callback time.',
      response_timeout_secs: 10,
      pre_tool_speech: 'force',
      api_schema: {
        url: `${baseUrl}/api/ava/callback`,
        method: 'POST',
        request_headers: toolHeaders(secret),
        request_body_schema: {
          type: 'object',
          required: [],
          description: 'Callback request.',
          properties: {
            slot_start: { type: 'string', description: 'Empty on the first call. On the second call, the slot_start the caller chose, copied exactly.' },
            preferred_date: { type: 'string', description: 'YYYY-MM-DD if the caller asked for a day, else empty.' },
            part_of_day: { type: 'string', enum: ['morning', 'afternoon', 'any'], description: 'morning, afternoon, or any.' },
            caller_name: { type: 'string', description: "Caller's full name (required with slot_start)." },
            caller_phone: { type: 'string', description: 'Confirmed callback number, digits only (required with slot_start).' },
            issue: { type: 'string', description: 'One short sentence: why they need a callback.' },
            text_ok: { type: 'boolean', description: 'true only if the caller said yes to the VERBAL SMS CONSENT script on this call.' },
            conversation_id: conversationIdParam,
          },
        },
      },
    },
  };
}

export function pageOnCallToolConfig(baseUrl: string, secret: ToolSecret) {
  return {
    tool_config: {
      type: 'webhook',
      name: 'page_on_call',
      description:
        "Page the business's on-call people about an emergency. Use it when an emergency transfer was not answered, or for an emergency when no transfer is available. Needs the caller's name, callback number, address and problem. Say only what the tool's message tells you.",
      response_timeout_secs: 12,
      pre_tool_speech: 'force',
      api_schema: {
        url: `${baseUrl}/api/ava/page-on-call`,
        method: 'POST',
        request_headers: toolHeaders(secret),
        request_body_schema: {
          type: 'object',
          required: ['caller_name', 'caller_phone', 'issue', 'reason'],
          description: 'Emergency page.',
          properties: {
            caller_name: { type: 'string', description: "Caller's full name." },
            caller_phone: { type: 'string', description: 'Confirmed callback number, digits only.' },
            address: { type: 'string', description: 'Service address with city, or empty.' },
            issue: { type: 'string', description: 'One short sentence about the emergency.' },
            reason: { type: 'string', enum: ['transfer_unanswered', 'no_transfer', 'after_hours'], description: 'Why you are paging.' },
            conversation_id: conversationIdParam,
          },
        },
      },
    },
  };
}

export function prepareTransferToolConfig(baseUrl: string, secret: ToolSecret) {
  return {
    tool_config: {
      type: 'webhook',
      name: 'prepare_transfer',
      description:
        'Before a screened transfer: saves the briefing the team member hears before they press 1 to accept. Call it right before transfer_to_number. Only transfer if it returns ok: true.',
      response_timeout_secs: 8,
      pre_tool_speech: 'auto',
      api_schema: {
        url: `${baseUrl}/api/ava/transfer/prepare`,
        method: 'POST',
        request_headers: toolHeaders(secret),
        request_body_schema: {
          type: 'object',
          required: ['caller_name', 'caller_phone', 'issue', 'urgent'],
          description: 'Transfer briefing.',
          properties: {
            caller_name: { type: 'string', description: "Caller's full name." },
            caller_phone: { type: 'string', description: 'Confirmed callback number, digits only.' },
            address: { type: 'string', description: 'Service address with city, or empty.' },
            issue: { type: 'string', description: 'One short sentence about why they need a person.' },
            urgent: { type: 'boolean', description: 'true for an emergency.' },
            conversation_id: conversationIdParam,
            caller_id: callerIdParam,
          },
        },
      },
    },
  };
}

export const CALLBACK_PROMPT_SECTION = `CALLBACKS (held windows)
When the caller needs someone to call them back (they ask to be called back, they want a person and nobody could take the call, it is after hours, they don't want to book a visit, or the office must confirm something), do not just say "someone will call you back". Call book_callback without slot_start, offer the windows it returns using the "say" phrase, and when the caller picks one, call book_callback again with that slot_start, their name, callback number and a one-sentence reason. Read the held window back. Only a window that book_callback returned with held: true is a promise you can make; never name a callback time otherwise. If it fails or nothing is open, say the team will call back as soon as they can, with no time.`;

export const PAGING_PROMPT_SECTION = `EMERGENCY PAGING
For an emergency, once you have the caller's name, callback number (read back), address and problem: if a transfer was not answered or none is available, call page_on_call. Say only what its message allows. Never say you paged anyone unless page_on_call said Paged. Never promise an arrival time. Gas smell, carbon monoxide, smoke or fire: tell them to get out and call 911 first, then page.`;

async function elevenLabsJson(path: string, init: RequestInit, apiKey: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(`https://api.elevenlabs.io/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `ElevenLabs returned ${response.status}.`);
  return data;
}

/**
 * Stores a tool secret in ElevenLabs workspace secret storage and returns the reference to put in tool
 * headers. The value is never logged or returned.
 */
export async function storeToolSecret(name: string, value: string, opts: { apiKey?: string; fetchImpl?: typeof fetch } = {}): Promise<SecretRef> {
  const apiKey = (opts.apiKey ?? process.env.ELEVENLABS_API_KEY ?? '').trim();
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured.');
  const data = await elevenLabsJson(
    '/convai/secrets',
    { method: 'POST', body: JSON.stringify({ type: 'new', name: name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100), value }) },
    apiKey,
    opts.fetchImpl,
  );
  if (typeof data.secret_id !== 'string' || !data.secret_id) throw new Error('ElevenLabs did not return a secret id.');
  return { secret_id: data.secret_id };
}
