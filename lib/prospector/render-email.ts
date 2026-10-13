import { escapeHtml } from '@/lib/ava/mail';

export function renderPlainEmail(body: string, footer: string): string {
  return `${body.trim()}\n${footer}`;
}

export function renderHtmlEmail(body: string, footer: string): string {
  const htmlBody = escapeHtml(body.trim()).replace(/\n/g, '<br>');
  const htmlFooter = escapeHtml(footer.trim()).replace(/\n/g, '<br>');
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#17201a">${htmlBody}<hr style="border:0;border-top:1px solid #d7ddd7;margin:24px 0"><p style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5;color:#5d675f">${htmlFooter}</p></div>`;
}
