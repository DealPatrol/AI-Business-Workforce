import { DEFAULT_DAILY_CAP, DEFAULT_SEND_SPACING_SECONDS } from '@/lib/prospector/constants';
import { isJunkEmail } from '@/lib/prospector/email-extract';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSingleEmail(email: string): boolean {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim()) && !/[\s,;<>]/.test(email);
}

export function isSuppressed(email: string, suppressedEmails: readonly string[]): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return suppressedEmails.some((item) => normalizeEmail(item) === normalized);
}

export function cleanHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatFromHeader(name: string, email: string): string {
  const safeName = cleanHeaderText(name).replace(/[<>"]/g, '').trim();
  const safeEmail = email.trim();
  return `${safeName} <${safeEmail}>`;
}

export type SendBlockCode =
  | 'not_approved'
  | 'empty_draft'
  | 'bad_recipient'
  | 'suppressed'
  | 'missing_sender'
  | 'bad_sender'
  | 'missing_address'
  | 'daily_cap'
  | 'spacing';

export type SendGateInput = {
  approved: boolean;
  toEmail: string;
  subject: string;
  body: string;
  suppressedEmails: readonly string[];
  sentToday: number;
  dailyCap: number;
  lastSentAtMs: number | null;
  nowMs: number;
  spacingSeconds: number;
  mailingAddress: string;
  senderName: string;
  senderEmail: string;
};

export type SendGateResult =
  | { ok: true; toEmail: string; fromHeader: string; subject: string }
  | { ok: false; code: SendBlockCode; message: string; retryAfterSeconds?: number };

export function evaluateSend(input: SendGateInput): SendGateResult {
  const subject = cleanHeaderText(input.subject);
  const body = input.body.replace(/\r\n/g, '\n').trim();
  const toEmail = normalizeEmail(input.toEmail);
  const senderEmail = input.senderEmail.trim();
  const senderName = cleanHeaderText(input.senderName);
  const mailingAddress = input.mailingAddress.trim();
  const dailyCap = Number.isFinite(input.dailyCap) && input.dailyCap > 0 ? input.dailyCap : DEFAULT_DAILY_CAP;
  const spacingSeconds =
    Number.isFinite(input.spacingSeconds) && input.spacingSeconds > 0
      ? input.spacingSeconds
      : DEFAULT_SEND_SPACING_SECONDS;

  if (!input.approved) {
    return { ok: false, code: 'not_approved', message: 'Approve this draft before it can be sent.' };
  }
  if (!subject || !body) {
    return { ok: false, code: 'empty_draft', message: 'Add a subject and body before sending.' };
  }
  if (!isSingleEmail(toEmail) || isJunkEmail(toEmail)) {
    return { ok: false, code: 'bad_recipient', message: 'This lead does not have a usable email address.' };
  }
  if (isSuppressed(toEmail, input.suppressedEmails)) {
    return {
      ok: false,
      code: 'suppressed',
      message: 'This address is on the do-not-contact list. It was not emailed.',
    };
  }
  if (!senderName || !senderEmail) {
    return {
      ok: false,
      code: 'missing_sender',
      message: 'Set a sender name and email in Lead Finder settings before sending.',
    };
  }
  if (!isSingleEmail(senderEmail)) {
    return { ok: false, code: 'bad_sender', message: 'Sender email must be a single address on your domain.' };
  }
  if (mailingAddress.length < 10) {
    return {
      ok: false,
      code: 'missing_address',
      message: 'Add your physical mailing address in Lead Finder settings before sending.',
    };
  }
  if (input.sentToday >= dailyCap) {
    return {
      ok: false,
      code: 'daily_cap',
      message: `Daily send cap of ${dailyCap} has been reached. It resets at 00:00 UTC.`,
    };
  }
  if (input.lastSentAtMs != null) {
    const elapsed = input.nowMs - input.lastSentAtMs;
    const required = spacingSeconds * 1000;
    if (elapsed < required) {
      const retryAfterSeconds = Math.ceil((required - elapsed) / 1000);
      return {
        ok: false,
        code: 'spacing',
        message: `Waiting ${retryAfterSeconds}s so sends stay spaced ${spacingSeconds}s apart.`,
        retryAfterSeconds,
      };
    }
  }

  return {
    ok: true,
    toEmail,
    fromHeader: formatFromHeader(senderName, senderEmail),
    subject,
  };
}

export function buildCanSpamFooter(input: {
  senderName: string;
  mailingAddress: string;
  unsubscribeUrl: string;
}): string {
  const senderName = cleanHeaderText(input.senderName);
  const mailingAddress = input.mailingAddress.trim();
  const unsubscribeUrl = input.unsubscribeUrl.trim();
  if (!senderName || mailingAddress.length < 10 || !unsubscribeUrl) {
    throw new Error('A sender name, physical mailing address, and unsubscribe link are required.');
  }
  return [
    '',
    '--',
    `This is a commercial message from ${senderName}.`,
    senderName,
    mailingAddress,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}

export function startOfUtcDay(nowMs: number): string {
  const date = new Date(nowMs);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}
