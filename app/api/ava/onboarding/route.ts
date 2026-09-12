import { NextRequest, NextResponse } from 'next/server';
import {
  provisionStoredAvaOnboarding,
  saveAvaOnboarding,
} from '@/lib/ava/onboarding-store';
import { AvaProvisioningResult } from '@/lib/ava/provisioning';

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

    const submittedAt = new Date().toISOString();
    let onboardingId: string | null = null;
    let persistenceWarning: string | null = null;
    let provisioning: AvaProvisioningResult = {
      status: 'pending_manual',
      agentId: null,
      phoneStatus: 'pending_manual',
      message: 'Cole must trigger agent creation; phone number setup remains manual.',
    };

    try {
      const onboarding = await saveAvaOnboarding({
        businessName: fields.businessName,
        businessHours: fields.businessHours,
        services: fields.services,
        callHandlingRules: fields.callHandlingRules,
        staffName: fields.staffName,
        staffContact,
        calendarPreference: fields.calendarPreference,
        urgentCallRules: fields.urgentCallRules,
        sessionId: fields.sessionId,
        plan: fields.plan,
      });
      onboardingId = onboarding.id;

      if (process.env.AVA_AUTO_PROVISION_AGENT?.toLowerCase() === 'true') {
        provisioning = await provisionStoredAvaOnboarding(onboarding);
      } else if (onboarding.elevenlabs_agent_id) {
        provisioning = {
          status: 'agent_ready_phone_pending',
          agentId: onboarding.elevenlabs_agent_id,
          phoneStatus: 'pending_manual',
          message: 'Customer agent already exists; phone number setup remains manual.',
        };
      }
    } catch (persistenceError) {
      persistenceWarning =
        persistenceError instanceof Error
          ? persistenceError.message
          : 'Onboarding persistence is unavailable.';
      console.error('Ava onboarding persistence/provisioning error', persistenceError);
    }

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
      ['Onboarding record', onboardingId || 'Not persisted — use the answers in this email'],
      ['Agent status', provisioning.status],
      ['ElevenLabs agent ID', provisioning.agentId || 'Not created'],
      ['Phone status', provisioning.phoneStatus],
      ['Next provisioning step', provisioning.message],
      ['Persistence warning', persistenceWarning || 'None'],
      ['Submitted at', submittedAt],
    ];
    const htmlRows = rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;vertical-align:top"><b>${label}</b></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
      )
      .join('');

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Online delivery is not configured yet.',
          emailFallback: NOTIFICATION_EMAIL,
          onboardingId,
          provisioning,
          ...(persistenceWarning ? { warning: persistenceWarning } : {}),
        },
        { status: 503 },
      );
    }

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

    return NextResponse.json({
      sent: true,
      onboardingId,
      provisioning,
      ...(persistenceWarning ? { warning: persistenceWarning } : {}),
    });
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
