import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { avaOwnerEmail, escapeHtml, sendResendEmail } from '@/lib/ava/mail';

export const runtime = 'nodejs';

const LABELS: Record<string, string> = {
  business_line: 'Connect your business line',
  voice: "Choose your receptionist's voice",
};

function authorized(header: string | null) {
  const secret = process.env.SETUP_ALERT_SECRET?.trim();
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

function label(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Emails Cole when someone submits a setup form on executive-receptionist-marketing. */
export async function POST(request: Request) {
  if (!authorized(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { fields?: Record<string, unknown> } | null;
  const fields = body?.fields;
  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ ok: false, error: 'No fields' }, { status: 400 });
  }
  const formType = String(fields.form_type ?? 'unknown');
  const business = String(fields.business_name ?? 'Unknown business').slice(0, 120);
  const rows = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-weight:600;vertical-align:top">${escapeHtml(label(k))}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(String(v).slice(0, 4000))}</td></tr>`,
    )
    .join('');
  const title = LABELS[formType] ?? formType;
  const html = `<p>New setup form submission: <strong>${escapeHtml(title)}</strong></p><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table><p style="color:#666;font-size:12px">Saved to Supabase table public.receptionist_setup_requests.</p>`;
  const replyTo = typeof fields.email === 'string' && fields.email.includes('@') ? fields.email : undefined;
  try {
    const result = await sendResendEmail({
      to: avaOwnerEmail(),
      subject: `New setup form: ${title} - ${business}`,
      html,
      replyTo,
    });
    return NextResponse.json({ ok: true, id: result.id ?? null });
  } catch (error) {
    console.error('setup alert email failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
