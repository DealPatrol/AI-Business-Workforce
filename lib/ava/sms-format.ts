/**
 * Owner lead-alert SMS formatting.
 *
 * Carriers expect business-to-owner texts to identify the sender and carry opt-out
 * wording. Any character outside the GSM-7 alphabet (em dashes, curly quotes, emoji)
 * switches the whole message to UCS-2, which drops a segment from 160 to 70 characters,
 * so everything is folded to GSM-7 here and long fields are truncated to keep a typical
 * lead in a single 160-septet segment.
 */

export const SMS_OPT_OUT = 'Reply STOP to opt out.';
export const SMS_SINGLE_SEGMENT_SEPTETS = 160;
export const SMS_MULTI_SEGMENT_SEPTETS = 153;
export const SMS_UCS2_SINGLE_SEGMENT = 70;
export const SMS_UCS2_MULTI_SEGMENT = 67;

const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
// Each of these costs two septets (escape + character).
const GSM7_EXTENDED = '^{}\\[~]|€';

const BASIC_SET = new Set(GSM7_BASIC);
const EXTENDED_SET = new Set(GSM7_EXTENDED);

const REPLACEMENTS: Record<string, string> = {
  '\u2014': '-', // em dash
  '\u2013': '-', // en dash
  '\u2212': '-', // minus sign
  '\u2018': "'",
  '\u2019': "'",
  '\u201A': "'",
  '\u201B': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u201E': '"',
  '\u2026': '...',
  '\u00A0': ' ',
  '\u2022': '-',
  '\u00B7': '-',
  '\u2009': ' ',
  '\u200A': ' ',
  '\u202F': ' ',
  '\t': ' ',
  '\n': ' ',
  '\r': ' ',
};

function isGsm7(char: string) {
  return BASIC_SET.has(char) || EXTENDED_SET.has(char);
}

/** Fold text to GSM-7: map known punctuation, strip accents where possible, drop the rest (emoji etc.). */
export function toGsm7(text: string): string {
  let out = '';
  for (const char of String(text ?? '')) {
    if (REPLACEMENTS[char] !== undefined) {
      out += REPLACEMENTS[char];
    } else if (isGsm7(char)) {
      out += char;
    } else {
      const stripped = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const part of stripped) {
        if (isGsm7(part) && !/[\n\r]/.test(part)) out += part;
      }
    }
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

/** Septet length of a GSM-7 string (extension characters count double). */
export function gsm7Length(text: string): number {
  let length = 0;
  for (const char of text) length += EXTENDED_SET.has(char) ? 2 : 1;
  return length;
}

export type SmsSegmentInfo = {
  encoding: 'GSM-7' | 'UCS-2';
  /** Septets (GSM-7) or UTF-16 code units (UCS-2). */
  length: number;
  segments: number;
};

export function smsSegmentInfo(text: string): SmsSegmentInfo {
  const body = String(text ?? '');
  if ([...body].every(isGsm7)) {
    const length = gsm7Length(body);
    const segments =
      length === 0
        ? 0
        : length <= SMS_SINGLE_SEGMENT_SEPTETS
          ? 1
          : Math.ceil(length / SMS_MULTI_SEGMENT_SEPTETS);
    return { encoding: 'GSM-7', length, segments };
  }
  const length = body.length;
  const segments =
    length === 0
      ? 0
      : length <= SMS_UCS2_SINGLE_SEGMENT
        ? 1
        : Math.ceil(length / SMS_UCS2_MULTI_SEGMENT);
  return { encoding: 'UCS-2', length, segments };
}

function clip(value: string | null | undefined, max: number) {
  const text = toGsm7(value ?? '');
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd();
}

export type AvaLeadSmsFields = {
  caller_name?: string | null;
  caller_phone?: string | null;
  service_job_type?: string | null;
  business_name?: string | null;
};

// Matches the message samples in 06-sops/10dlc-registration-packet-draft.md section 5.
const BRAND = 'Executive Receptionist';

/**
 * "Executive Receptionist: New lead for Porchlight Heating & Air. Dana Whitfield, +12565550142.
 *  Need: No heat. Reply STOP to opt out."
 *
 * Plain GSM-7 with the opt-out included. The opt-out and brand are never truncated; when a lead
 * would not fit in one 160-septet segment the need, then business, then name shrink first.
 */
export function formatAvaLeadSmsBody(lead: AvaLeadSmsFields): string {
  const phone = clip(lead.caller_phone, 16);
  let name = clip(lead.caller_name, 24);
  let need = clip(lead.service_job_type, 40);
  let business = clip(lead.business_name, 30);

  const build = () => {
    const who = [name, phone].filter(Boolean).join(', ');
    let body = `${BRAND}: New lead${business ? ` for ${business}` : ''}.`;
    if (who) body += ` ${who}.`;
    if (need) body += ` Need: ${need}.`;
    if (!who && !need) body += ' Details are in your email.';
    return `${body} ${SMS_OPT_OUT}`;
  };

  let body = build();
  const shrink = (current: string, min: number) =>
    clip(current, Math.max(min, current.length - (gsm7Length(body) - SMS_SINGLE_SEGMENT_SEPTETS)));
  if (gsm7Length(body) > SMS_SINGLE_SEGMENT_SEPTETS) {
    need = shrink(need, 10);
    body = build();
  }
  if (gsm7Length(body) > SMS_SINGLE_SEGMENT_SEPTETS) {
    business = shrink(business, 12);
    body = build();
  }
  if (gsm7Length(body) > SMS_SINGLE_SEGMENT_SEPTETS) {
    name = shrink(name, 8);
    body = build();
  }
  return body;
}

export function formatSalesQualifySmsBody(businessName: string): string {
  const name = clip(businessName || 'Unknown business', 60) || 'Unknown business';
  return `Executive Receptionist qualify: ${name}`;
}
