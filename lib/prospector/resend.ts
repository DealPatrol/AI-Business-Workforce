import { escapeHtml } from '@/lib/ava/mail';
import { ProspectorSetupError } from '@/lib/prospector/errors';

export function renderPlainEmail(body: string, footer: string): string {
  return `${body.trim()}\n${footer}`;
}

export function renderHtmlEmail(body: string, footer: string): string {
  const htmlBody = escapeHtml(body.trim()).replace(/\n/g, '<br>');
  const htmlFooter = escapeHtml(footer.trim()).replace(/\n/g, '<br>');
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#17201a">${htmlBody}<hr style="border:0;border-top:1px solid #d7ddd7;margin:24px 0"><p style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5;color:#5d675f">${htmlFooter}</p></div>`;
}

export async function sendProspectorEmail(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl: string;
}): Promise<{ id: string | null }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new ProspectorSetupError(
      'Resend is not configured. Set RESEND_API_KEY and a verified From domain to send. Drafts can still be copied or exported.',
    );
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      headers: {
        'List-Unsubscribe': `<${input.unsubscribeUrl}>`,
      },
    }),
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string; id?: string };
  if (!response.ok) {
    throw new Error(result.message || `Resend returned ${response.status}.`);
  }
  return { id: result.id ?? null };
}
