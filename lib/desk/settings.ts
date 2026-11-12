/** Validation for the Desk settings form. Pure: no network, no database. */

export const GREETING_MAX = 300;
export const HOURS_MAX = 600;

/** Shared demo agents (public demo line, website demo, sample shops): owners never edit these from a Desk. */
export const SHARED_AGENT_IDS = new Set([
  'agent_7401m6jkzsstf0evm2www8r46kj6', // Porchlight Heating & Air demo line (256) 952-4935
  'agent_8101m78w0ks0fv5vzwysbdr9s6z8', // website Talk to Ava
  'agent_9501m56myx6xfmaty2v1dxn56mve', // Executive Receptionist - Demo (/receptionist/live)
  'agent_0001m6k8pwnaebqver0sztwknn72',
  'agent_4801m6s744btehnrxs2agh4zv3zx',
  'agent_1301m6s74e21eb181gr5qhh9bb4b',
  'agent_4601m6s74jc0e1c9w0c5mepjsc18',
  'agent_9901m6s74qnwe11atenxfkvqh8pn',
  'agent_7301m727915ke55syb59xd04s1m4',
  'agent_9901m2prq33rfkrv6xmwkt5h3rbh',
]);

export function isEditableAgent(agentId: string | null | undefined) {
  const id = String(agentId || '').trim();
  return /^agent_[a-z0-9]+$/i.test(id) && !SHARED_AGENT_IDS.has(id);
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i;
const BANNED_NUMBER = /663[\s.\-)]*7007/;
const URLISH = /(https?:\/\/|www\.)/i;

export type DeskSettingsInput = { greeting?: string; notificationEmail?: string; businessHours?: string };
export type DeskSettingsResult = { ok: true; value: DeskSettingsInput } | { ok: false; error: string };

function clean(text: unknown) {
  return String(text ?? '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function cleanDeskSettings(body: unknown): DeskSettingsResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Nothing to save.' };
  const raw = body as Record<string, unknown>;
  const value: DeskSettingsInput = {};

  if ('greeting' in raw) {
    const greeting = clean(raw.greeting).replace(/\n+/g, ' ');
    if (greeting.length < 10) return { ok: false, error: 'Ava’s greeting needs at least a short sentence.' };
    if (greeting.length > GREETING_MAX) return { ok: false, error: `Keep the greeting under ${GREETING_MAX} characters.` };
    if (/[{}<>]/.test(greeting) || URLISH.test(greeting)) return { ok: false, error: 'Use plain words in the greeting (no links or brackets).' };
    if (BANNED_NUMBER.test(greeting)) return { ok: false, error: 'That phone number cannot be used in the greeting.' };
    value.greeting = greeting;
  }

  if ('notificationEmail' in raw) {
    const email = clean(raw.notificationEmail).toLowerCase();
    if (!EMAIL.test(email) || email.length > 200) return { ok: false, error: 'Enter a valid email for new-lead alerts.' };
    value.notificationEmail = email;
  }

  if ('businessHours' in raw) {
    const hours = clean(raw.businessHours);
    if (hours.length < 3) return { ok: false, error: 'Add your business hours.' };
    if (hours.length > HOURS_MAX) return { ok: false, error: `Keep hours under ${HOURS_MAX} characters.` };
    if (/[{}<>]/.test(hours) || URLISH.test(hours)) return { ok: false, error: 'Use plain words for your hours.' };
    if (BANNED_NUMBER.test(hours)) return { ok: false, error: 'That phone number cannot be used here.' };
    value.businessHours = hours;
  }

  if (!Object.keys(value).length) return { ok: false, error: 'Nothing to save.' };
  return { ok: true, value };
}

/** Leads: "Booked" is shown to owners as Won. */
export const LEAD_STATUS_LABEL: Record<string, string> = {
  New: 'New',
  Contacted: 'Contacted',
  Booked: 'Won',
  'Not a fit': 'Not a fit',
};
