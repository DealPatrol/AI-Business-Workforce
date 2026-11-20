import {
  callbackToolConfig,
  pageOnCallToolConfig,
  storeToolSecret,
  toolHeaders,
  type ToolSecret,
} from '@/lib/ava/capabilities/tools';
import { getSiteUrl } from '@/lib/site-url';

/** Where ElevenLabs should call the booking tools. Preview deployments point at their own branch URL. */
export function toolBaseUrl() {
  const explicit = process.env.AVA_TOOL_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  return getSiteUrl();
}

/** The two ElevenLabs webhook tools. `secret` authenticates the agent to exactly one calendar. */
export function bookingToolConfigs(baseUrl: string, secret: ToolSecret) {
  // A SecretRef keeps the value in ElevenLabs secret storage; it never sits in the tool config as text.
  const headers = toolHeaders(secret);
  return [
    {
      tool_config: {
        type: 'webhook',
        name: 'check_availability',
        description:
          'Get real open appointment windows from the business calendar. Call this once you have the caller\'s name, callback number, address and issue and they want someone to come out. Returns a few windows with a "say" phrase and a slot_start value.',
        response_timeout_secs: 10,
        pre_tool_speech: 'force',
        api_schema: {
          url: `${baseUrl}/api/ava/availability`,
          method: 'POST',
          request_headers: headers,
          request_body_schema: {
            type: 'object',
            required: [],
            description: 'What the caller prefers.',
            properties: {
              preferred_date: {
                type: 'string',
                description: 'The day the caller asked for as YYYY-MM-DD in the business time zone, or empty if they have no preference. Use the current date from the system time to resolve words like "tomorrow".',
              },
              part_of_day: { type: 'string', enum: ['morning', 'afternoon', 'any'], description: 'morning, afternoon, or any.' },
            },
          },
        },
      },
    },
    {
      tool_config: {
        type: 'webhook',
        name: 'book_appointment',
        description:
          'Book the window the caller chose. Only call after the caller clearly picks one window from check_availability and you have their name and callback number. Pass slot_start exactly as returned.',
        response_timeout_secs: 10,
        pre_tool_speech: 'force',
        api_schema: {
          url: `${baseUrl}/api/ava/book`,
          method: 'POST',
          request_headers: headers,
          request_body_schema: {
            type: 'object',
            required: ['slot_start', 'caller_name', 'caller_phone'],
            description: 'The chosen window and the caller details.',
            properties: {
              slot_start: { type: 'string', description: 'slot_start of the chosen window, copied exactly from check_availability.' },
              caller_name: { type: 'string', description: "Caller's full name." },
              caller_phone: { type: 'string', description: 'Callback number, digits only.' },
              service_address: { type: 'string', description: 'Service address with city, or empty.' },
              issue: { type: 'string', description: 'One short sentence about the problem.' },
              text_ok: {
                type: 'boolean',
                description:
                  'true only if check_availability said text_confirmations is true AND the caller said yes to a text confirmation at that number. Otherwise false.',
              },
              conversation_id: { type: 'string', dynamic_variable: 'system__conversation_id', description: '' },
            },
          },
        },
      },
    },
  ];
}

const callerPhoneProp = { type: 'string', description: 'The phone number the appointment was booked under, digits only.' };
const bookingIdProp = { type: 'string', description: 'booking_id exactly as returned by find_booking.' };

/** Reschedule/cancel-by-phone tools. Each one only touches bookings on this agent's calendar that match the caller's number. */
export function manageBookingToolConfigs(baseUrl: string, secret: ToolSecret) {
  const headers = toolHeaders(secret);
  const tool = (name: string, path: string, description: string, required: string[], properties: Record<string, unknown>) => ({
    tool_config: {
      type: 'webhook',
      name,
      description,
      response_timeout_secs: 10,
      pre_tool_speech: 'force',
      api_schema: {
        url: `${baseUrl}${path}`,
        method: 'POST',
        request_headers: headers,
        request_body_schema: { type: 'object', required, description: 'Caller details.', properties },
      },
    },
  });
  return [
    tool(
      'find_booking',
      '/api/ava/find-booking',
      'Look up the caller\'s upcoming appointments by the phone number it was booked under. Use when a caller wants to check, move, or cancel an appointment.',
      ['caller_phone'],
      { caller_phone: callerPhoneProp },
    ),
    tool(
      'reschedule_appointment',
      '/api/ava/reschedule',
      'Move the caller\'s appointment. Call first without new_slot_start to get open windows, then again with the chosen new_slot_start copied exactly.',
      ['booking_id', 'caller_phone'],
      {
        booking_id: bookingIdProp,
        caller_phone: callerPhoneProp,
        new_slot_start: { type: 'string', description: 'slot_start of the chosen new window, or empty to get options.' },
        preferred_date: { type: 'string', description: 'YYYY-MM-DD the caller prefers, or empty.' },
        part_of_day: { type: 'string', enum: ['morning', 'afternoon', 'any'], description: 'morning, afternoon, or any.' },
      },
    ),
    tool(
      'cancel_appointment',
      '/api/ava/cancel-booking',
      'Cancel the caller\'s appointment after they clearly confirm which one and that they want it canceled.',
      ['booking_id', 'caller_phone'],
      { booking_id: bookingIdProp, caller_phone: callerPhoneProp },
    ),
  ];
}

export const MANAGE_BOOKING_PROMPT_SECTION = `CHANGING AN APPOINTMENT
If a caller wants to check, move, or cancel an appointment, ask for the phone number it was booked under and call find_booking. Read the window back and confirm it is the right one. To move it, call reschedule_appointment without new_slot_start, offer two of the windows it returns, then call it again with the chosen new_slot_start copied exactly, and read the new window back only after it says rescheduled. To cancel, confirm once ("Just to confirm, cancel your Tuesday 8 to 10 visit?") and only then call cancel_appointment. If nothing is found or a tool fails, take their details and say the team will call back about it. Never change an appointment for a number that does not match.`;

export const BOOKING_PROMPT_SECTION = `BOOKING (the booking calendar is turned on)
After you have the caller's name, callback number, service address and issue, and it is not an emergency you are transferring, offer to put them on the schedule. Ask if they prefer a day or morning versus afternoon, then call check_availability. Offer two windows using the "say" phrase, never more than three. When the caller picks one, call book_appointment with that window's slot_start copied exactly. If check_availability returned text_confirmations: true, and the caller already said yes to the VERBAL SMS CONSENT script on this call, pass text_ok true and do not re-ask a short "want a text?" question. If they have not yet been asked, read the full VERBAL SMS CONSENT script first and pass text_ok true only if they say yes. If they said no, pass text_ok false and do not mention texts again. Read the booked window back. Say the team will confirm before the visit. Never invent a time that check_availability did not return, never promise an exact arrival minute, and if the tools fail or nothing is open, take the details and say the team will call to schedule.`;

async function elevenLabs(path: string, init: RequestInit) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured.');
  const response = await fetch(`https://api.elevenlabs.io/v1${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `ElevenLabs returned ${response.status}.`;
    throw new Error(detail);
  }
  return data;
}

async function agentToolIds(agentId: string) {
  const agent = await elevenLabs(`/convai/agents/${encodeURIComponent(agentId)}`, { method: 'GET' });
  const prompt = ((agent.conversation_config as Record<string, unknown>)?.agent as Record<string, unknown>)?.prompt as
    | Record<string, unknown>
    | undefined;
  return Array.isArray(prompt?.tool_ids) ? (prompt!.tool_ids as string[]) : [];
}

/**
 * Creates the booking tools (check_availability, book_appointment) plus book_callback and page_on_call for a
 * customer's agent and attaches them, along with the prompt that tells Ava how to use them. The shared tool
 * secret is first stored in ElevenLabs secret storage, and the tools reference it by id, so the value never
 * appears in any tool config. Returns the new tool ids so they can be detached later.
 */
export async function attachBookingTools(agentId: string, secret: string, prompt: string) {
  const ref = await storeToolSecret(`ava_tool_secret_${agentId}`, secret);
  const created: string[] = [];
  const base = toolBaseUrl();
  for (const config of [...bookingToolConfigs(base, ref), ...manageBookingToolConfigs(base, ref), callbackToolConfig(base, ref), pageOnCallToolConfig(base, ref)]) {
    const tool = await elevenLabs('/convai/tools', { method: 'POST', body: JSON.stringify(config) });
    if (typeof tool.id !== 'string') throw new Error('ElevenLabs did not return a tool id.');
    created.push(tool.id);
  }
  const existing = await agentToolIds(agentId);
  await elevenLabs(`/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: { agent: { prompt: { prompt, tool_ids: [...new Set([...existing, ...created])] } } },
    }),
  });
  return created;
}

/** Detaches and deletes the booking tools, and restores the no-booking prompt. */
export async function detachBookingTools(agentId: string, toolIds: string[], prompt: string) {
  const existing = await agentToolIds(agentId);
  await elevenLabs(`/convai/agents/${encodeURIComponent(agentId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: { agent: { prompt: { prompt, tool_ids: existing.filter((id) => !toolIds.includes(id)) } } },
    }),
  });
  for (const id of toolIds) {
    await elevenLabs(`/convai/tools/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
  }
}
