import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';

/** 5 requests per 10 minutes per IP keeps the inbox from being flooded. */
const takeRequest = createRateLimiter(5, 10 * 60_000);

const NOTIFICATION_EMAIL = 'colecollins763@gmail.com';
const MAX_FIELD_LENGTH = 2_000;

type RequestField = 'business' | 'contact' | 'email' | 'phone' | 'industry' | 'serviceArea' | 'interest' | 'notes';

const fieldNames: RequestField[] = [
  'business',
  'contact',
  'email',
  'phone',
  'industry',
  'serviceArea',
  'interest',
  'notes',
];

const escapeHtml = (value: string) =>
  value.replace(
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

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const decision = takeRequest(ip);
  if (!decision.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const body = await request.json();

    if (body.website) {
      return NextResponse.json({ sent: true });
    }

    const fields = Object.fromEntries(
      fieldNames.map((name) => [name, String(body[name] ?? '').trim().slice(0, MAX_FIELD_LENGTH)]),
    ) as Record<RequestField, string>;

    if (!fields.business || !fields.contact || !fields.email) {
      return NextResponse.json({ error: 'Business, name, and email are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Online delivery is not configured yet.', emailFallback: 'hello@frontporchgrowth.com' },
        { status: 503 },
      );
    }

    const rows: Array<[string, string]> = [
      ['Business', fields.business],
      ['Contact', fields.contact],
      ['Email', fields.email],
      ['Phone', fields.phone || 'Not provided'],
      ['Trade', fields.industry || 'Not provided'],
      ['Service area', fields.serviceArea || 'Not provided'],
      ['Request', fields.interest || 'AI Visibility Gap Report'],
      ['Notes', fields.notes || 'Not provided'],
    ];
    const htmlRows = rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><b>${label}</b></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
      )
      .join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Front Porch Growth <onboarding@resend.dev>',
        to: [NOTIFICATION_EMAIL],
        reply_to: fields.email,
        subject: `${fields.interest.startsWith('Google profile care') ? 'Google profile care request' : 'Gap Report request'} — ${fields.business}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b"><h1>New AI Visibility Gap Report request</h1><table style="border-collapse:collapse;width:100%">${htmlRows}</table></div>`,
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Gap Report email error', result);
      return NextResponse.json(
        { error: 'Online delivery is temporarily unavailable.', emailFallback: 'hello@frontporchgrowth.com' },
        { status: 502 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Gap Report request error', error);
    return NextResponse.json(
      { error: 'Could not send the request.', emailFallback: 'hello@frontporchgrowth.com' },
      { status: 500 },
    );
  }
}
