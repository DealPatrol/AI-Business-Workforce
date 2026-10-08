const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';
const DEFAULT_OWNER_EMAIL = 'colecollins763@gmail.com';

export const AVA_PHONE_RUNBOOK_PATH = 'docs/AVA_PHONE_SETUP_RUNBOOK.md';
export const AVA_PHONE_RUNBOOK_URL =
  'https://github.com/DealPatrol/AI-Business-Workforce/blob/main/docs/AVA_PHONE_SETUP_RUNBOOK.md';

/** Resend From address. AVA_FROM_EMAIL may be a bare address or a full "Name <email>" value. */
export function avaFromAddress() {
  const raw = process.env.AVA_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  if (raw.includes('<') && raw.includes('>')) return raw;
  return `Ava <${raw}>`;
}

export function avaOwnerEmail() {
  return process.env.AVA_LEAD_NOTIFICATION_EMAIL?.trim() || DEFAULT_OWNER_EMAIL;
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

export function avaOnboardingUrl(sessionId: string, plan?: string) {
  const url = new URL('/onboarding/ava', appBaseUrl());
  if (sessionId) url.searchParams.set('session_id', sessionId);
  if (plan) url.searchParams.set('plan', plan);
  return url.toString();
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendResendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const to = (Array.isArray(input.to) ? input.to : [input.to]).map((item) => item.trim()).filter(Boolean);
  if (to.length === 0) {
    throw new Error('No email recipient.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: avaFromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string; id?: string };
  if (!response.ok) {
    throw new Error(result.message || `Resend returned ${response.status}`);
  }
  return result;
}
