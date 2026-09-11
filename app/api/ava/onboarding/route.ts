import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_EMAIL = 'colecollins763@gmail.com';
const MAX_FIELD_LENGTH = 4_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type OnboardingField =
  | 'businessName'
  | 'businessHours'
  | 'services'
  | 'callHandlingRules'
  | 'staffName'
  | 'staffContact'
  | 'staffPhone'
  | 'staffEmail'
  | 'calendarPreference'
  | 'urgentCallRules'
  | 'timezone'
  | 'greetingNotes'
  | 'websiteUrl'
  | 'sessionId'
  | 'plan';

const fieldNames: OnboardingField[] = [
  'businessName',
  'businessHours',
  'services',
  'callHandlingRules',
  'staffName',
  'staffContact',
  'staffPhone',
  'staffEmail',
  'calendarPreference',
  'urgentCallRules',
  'timezone',
  'greetingNotes',
  'websiteUrl',
  'sessionId',
  'plan',
];

const requiredFields: OnboardingField[] = [
  'businessName',
  'businessHours',
  'services',
  'callHandlingRules',
  'staffName',
  'calendarPreference',
  'urgentCallRules',
];

function escapeHtml(value: string) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Treat a filled honeypot as accepted so bots receive no useful signal.
    if (body.companyWebsite) {
      return NextResponse.json({ sent: true });
    }

    const fields = Object.fromEntries(
      fieldNames.map((name) => [
        name,
        String(body[name] ?? '')
          .trim()
          .slice(0, MAX_FIELD_LENGTH),
      ]),
    ) as Record<OnboardingField, string>;

    if (requiredFields.some((name) => !fields[name])) {
      return NextResponse.json(
        { error: 'Complete each required setup field before submitting.' },
        { status: 400 },
      );
    }

    const staffContact = fields.staffContact || fields.staffPhone || fields.staffEmail;
    if (!staffContact) {
      return NextResponse.json(
        { error: 'Add a phone number or email for the staff contact.' },
        { status: 400 },
      );
    }

    if (fields.staffEmail && !EMAIL_PATTERN.test(fields.staffEmail)) {
      return NextResponse.json({ error: 'Enter a valid staff email address.' }, { status: 400 });
    }

    const replyTo = EMAIL_PATTERN.test(staffContact) ? staffContact : fields.staffEmail;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Online delivery is not configured yet.',
          emailFallback: NOTIFICATION_EMAIL,
        },
        { status: 503 },
      );
    }

    const submittedAt = new Date().toISOString();
    const rows: Array<[string, string]> = [
      ['Business', fields.businessName],
      ['Business hours', fields.businessHours],
      ['Services offered', fields.services],
      ['Call-handling rules', fields.callHandlingRules],
      ['Staff contact', fields.staffName],
      ['Staff phone or email', staffContact],
      ['Calendar preference', fields.calendarPreference],
      ['Urgent-call rules', fields.urgentCallRules],
      ['Stripe Checkout session', fields.sessionId || 'Not provided'],
      ['Selected plan', fields.plan || 'Not provided'],
      ['Submitted at', submittedAt],
    ];
    const htmlRows = rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;vertical-align:top"><b>${label}</b></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
      )
      .join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Workforce AI <onboarding@resend.dev>',
        to: [NOTIFICATION_EMAIL],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `Ava paid pilot setup — ${fields.businessName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#17211b"><h1>New Ava paid pilot onboarding</h1><p>Use these answers to configure the customer&apos;s Ava workflow and schedule one live test call before launch.</p><table style="border-collapse:collapse;width:100%">${htmlRows}</table></div>`,
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Ava onboarding email error', result);
      return NextResponse.json(
        {
          error: 'Online delivery is temporarily unavailable.',
          emailFallback: NOTIFICATION_EMAIL,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Ava onboarding error', error);
    return NextResponse.json(
      {
        error: 'Could not send your setup details.',
        emailFallback: NOTIFICATION_EMAIL,
      },
      { status: 500 },
    );
  }
}
