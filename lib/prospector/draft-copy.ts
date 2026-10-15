import { ValidationError } from '@/lib/prospector/errors';
import type { DraftKind, ProspectorLead } from '@/lib/prospector/types';

export const SENDER_NAME_REQUIRED = 'Add your sender name in settings first.';

export type DraftIdentity = {
  kind: DraftKind;
  subject: string;
  body: string;
};

export function requireSenderName(senderName: string): string {
  const name = senderName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name) throw new ValidationError(SENDER_NAME_REQUIRED);
  return name.slice(0, 80);
}

function bookingLine(bookingUrl: string): string {
  const booking = bookingUrl.replace(/[\r\n]+/g, '').trim();
  if (!booking) {
    return '- Do not invent a scheduling link or any URL that was not provided below.';
  }
  return `- Put this exact booking link on its own line in the initial email: ${booking}
- Follow-ups may repeat that same link. Do not invent a different scheduling link.`;
}

export function buildDraftInstructions(input: {
  lead: ProspectorLead;
  offerSummary: string;
  sourceUrl: string;
  notes: string;
  senderName: string;
  bookingUrl: string;
}): string {
  const senderName = requireSenderName(input.senderName);
  const booking = input.bookingUrl.replace(/[\r\n]+/g, '').trim();
  const lead = input.lead;
  return `Write a short cold email sequence from ${senderName} to one local business. Return JSON only:
{"emails":[{"kind":"initial","subject":"...","body":"..."},{"kind":"followup_1","subject":"...","body":"..."},{"kind":"followup_2","subject":"...","body":"..."}]}

Rules:
- Plain text. No HTML.
- Initial email under 120 words. Each follow-up under 80 words.
- Use only the public facts below. Do not invent a relationship, a visit, a mutual contact, or a review quote.
- Mention the lead's business name and city or category when that helps the email feel specific.
- Describe the offer without guaranteed results.
${bookingLine(booking)}
- Do not include a physical mailing address or an unsubscribe line. The app adds those later.
- Do not use deceptive subjects. The subject must match the body.
- End every email with this exact name on its own line: ${senderName}
- Do not invent a stand-in, a title, or a blank where the name belongs.
- Follow-ups assume no reply. Do not pretend they replied.

From: ${senderName}
Website: ${input.sourceUrl}
What they sell: ${input.offerSummary || 'not summarized'}
Notes: ${input.notes || 'none'}
Booking link: ${booking || 'not set'}

Lead:
Name: ${lead.name}
Category: ${lead.category || 'unknown'}
Address: ${lead.address || 'unknown'}
Phone: ${lead.phone || 'unknown'}
Website: ${lead.website || 'none'}
Rating: ${lead.rating ?? 'unknown'} (${lead.reviewCount ?? 0} reviews)
Contact name: ${lead.contactName || 'unknown'}
Public email: ${lead.emails[0] || 'unknown'}`;
}

function standInName(): RegExp {
  return /\bthe sender\b|\[(?:your name|sender name|sender|name)\]|\{\{?\s*(?:sender_name|sender|your_name|your name|name)\s*\}?\}/gi;
}

export function applySenderIdentity<T extends DraftIdentity>(
  drafts: T[],
  senderName: string,
  bookingUrl: string,
): T[] {
  const name = requireSenderName(senderName);
  const booking = bookingUrl.replace(/[\r\n]+/g, '').trim();
  return drafts.map((draft) => {
    const subject = draft.subject.replace(standInName(), name).replace(/\s+/g, ' ').trim().slice(0, 180);
    let body = draft.body.replace(standInName(), name);
    body = body
      .split('\n')
      .map((line) => (/^(sender|your name)$/i.test(line.trim()) ? name : line))
      .join('\n')
      .trim();
    if (!body.toLowerCase().includes(name.toLowerCase())) {
      body = `${body}\n\n${name}`;
    }
    if (booking && !body.includes(booking)) {
      body = `${body}\n\n${booking}`;
    }
    return { ...draft, subject, body: body.trim().slice(0, 4000) };
  });
}
