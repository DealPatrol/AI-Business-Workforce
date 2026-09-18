import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  AvaSalesQualificationInput,
  AvaSalesQualificationRow,
  REQUIRED_QUALIFY_FIELDS,
  rowFromInput,
  sanitizeQualifyField,
  toPublicQualification,
  toSafePublicQualification,
} from '@/lib/ava/sales-qualify';
import {
  checkRateLimit,
  clientIp,
  mintPrefillToken,
  verifyPrefillToken,
  verifySalesConversation,
} from '@/lib/ava/sales-qualify-security';
import { formatSalesQualifySmsBody, sendAvaLeadSms } from '@/lib/ava/sms';

const escapeHtml = (value: unknown) =>
  String(value ?? 'Not provided').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] || c,
  );

async function notifySalesQualificationEmail(row: AvaSalesQualificationRow) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.AVA_LEAD_NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    return { sent: false, error: 'Email notification environment variables are not configured.' };
  }

  const subject = `Sales Ava qualification — ${row.business_name}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#17211b">
    <h1 style="font-size:22px">New Sales Ava qualification</h1>
    <p>A prospect finished the qualify conversation. Prefill onboarding with <code>qualificationId=${escapeHtml(row.id)}</code> plus a short-lived <code>prefillToken</code> for staff contact.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td><b>Business</b></td><td>${escapeHtml(row.business_name)} (${escapeHtml(row.business_type)})</td></tr>
      <tr><td><b>Hours</b></td><td>${escapeHtml(row.business_hours)}</td></tr>
      <tr><td><b>Services</b></td><td style="white-space:pre-wrap">${escapeHtml(row.services)}</td></tr>
      <tr><td><b>Call handling</b></td><td style="white-space:pre-wrap">${escapeHtml(row.call_handling_rules)}</td></tr>
      <tr><td><b>Urgent rules</b></td><td style="white-space:pre-wrap">${escapeHtml(row.urgent_call_rules)}</td></tr>
      <tr><td><b>Staff</b></td><td>${escapeHtml(row.staff_name)} · ${escapeHtml(row.staff_contact)}</td></tr>
      <tr><td><b>Calendar</b></td><td>${escapeHtml(row.calendar_preference)}</td></tr>
      <tr><td><b>Plan interest</b></td><td>${escapeHtml(row.plan_interest)}</td></tr>
      <tr><td><b>Website</b></td><td>${escapeHtml(row.company_website)}</td></tr>
    </table>
    <h2 style="font-size:16px;margin-top:20px">Summary</h2>
    <p style="white-space:pre-wrap">${escapeHtml(row.summary)}</p>
    <p style="font-size:12px;color:#66736b">Conversation: ${escapeHtml(row.conversation_id)} · Qualification: ${escapeHtml(row.id)}</p>
  </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'YardProof <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { sent: false, error: result?.message || `Resend returned ${response.status}` };
  }
  return { sent: true, id: result?.id };
}

function parseBody(body: Record<string, unknown>): AvaSalesQualificationInput {
  return {
    businessName: sanitizeQualifyField(body.businessName),
    businessType: sanitizeQualifyField(body.businessType),
    businessHours: sanitizeQualifyField(body.businessHours),
    services: sanitizeQualifyField(body.services),
    callHandlingRules: sanitizeQualifyField(body.callHandlingRules),
    urgentCallRules: sanitizeQualifyField(body.urgentCallRules),
    staffName: sanitizeQualifyField(body.staffName),
    staffContact: sanitizeQualifyField(body.staffContact),
    calendarPreference: sanitizeQualifyField(body.calendarPreference),
    companyWebsite: sanitizeQualifyField(body.companyWebsite || '') || null,
    planInterest: sanitizeQualifyField(body.planInterest || '') || null,
    summary: sanitizeQualifyField(body.summary),
    conversationId: sanitizeQualifyField(body.conversationId || ''),
    setupCallBookedAt: body.setupCallBookedAt ? String(body.setupCallBookedAt) : null,
    setupCallMeetUrl: sanitizeQualifyField(body.setupCallMeetUrl || '') || null,
  };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || req.nextUrl.searchParams.get('qualificationId');
  const token =
    req.nextUrl.searchParams.get('token') ||
    req.nextUrl.searchParams.get('prefillToken') ||
    req.headers.get('x-ava-prefill-token');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const ip = clientIp(req);
  const ipLimit = checkRateLimit(`qualify:get:ip:${ip}`, 60, 15 * 60_000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSec) } },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ava_sales_qualifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Unable to load sales qualification', error);
      return NextResponse.json({ error: 'Qualification lookup is unavailable.' }, { status: 503 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Qualification not found.' }, { status: 404 });
    }

    const row = data as AvaSalesQualificationRow;
    const fullAccess = verifyPrefillToken(token, row.id);

    if (fullAccess) {
      return NextResponse.json({
        qualification: toPublicQualification(row),
        access: 'full',
      });
    }

    // UUID alone is not enough for staff contact / conversationId (capability-URL risk).
    return NextResponse.json({
      qualification: toSafePublicQualification(row),
      access: 'safe',
      note: 'staffContact and conversationId require a valid short-lived prefillToken.',
    });
  } catch (error) {
    console.error('Unable to load sales qualification', error);
    return NextResponse.json({ error: 'Qualification lookup is unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipLimit = checkRateLimit(`qualify:post:ip:${ip}`, 8, 15 * 60_000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many qualification saves from this network. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSec) } },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const input = parseBody(body);

    const missing = REQUIRED_QUALIFY_FIELDS.filter((key) => !input[key]);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const convLimit = checkRateLimit(
      `qualify:post:conv:${input.conversationId}`,
      4,
      60 * 60_000,
    );
    if (!convLimit.ok) {
      return NextResponse.json(
        { error: 'Too many saves for this conversation. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(convLimit.retryAfterSec) } },
      );
    }

    const verified = await verifySalesConversation(input.conversationId);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    // Bind to the verified id so clients cannot upsert under a different key after verification.
    input.conversationId = verified.conversationId;

    const supabase = createAdminClient();
    const payload = rowFromInput(input);

    // Upsert only after ElevenLabs proof — prevents unauthenticated inserts and blind overwrites.
    const upsert = await supabase
      .from('ava_sales_qualifications')
      .upsert(payload, { onConflict: 'conversation_id' })
      .select()
      .single();

    const data = upsert.data as AvaSalesQualificationRow | null;
    const error = upsert.error;

    if (error || !data) {
      console.error('Unable to save sales qualification', error);
      return NextResponse.json({ error: 'Could not save qualification.' }, { status: 503 });
    }

    let notification: {
      sent: boolean;
      skipped?: boolean;
      error?: string;
      id?: string;
      warning?: string;
      sms?: {
        sent: boolean;
        skipped?: boolean;
        sid?: string;
        error?: string;
      };
    } = {
      sent: Boolean(data.notified_at),
      skipped: Boolean(data.notified_at),
      sms: { sent: false, skipped: true },
    };

    if (!data.notified_at) {
      const email = await notifySalesQualificationEmail(data);
      let sms;
      try {
        sms = await sendAvaLeadSms({
          body: formatSalesQualifySmsBody(data.business_name),
        });
      } catch (smsError) {
        console.error('Ava lead SMS failed', smsError);
        sms = {
          sent: false,
          error: smsError instanceof Error ? smsError.message : 'SMS send failed',
        };
      }
      notification = { ...email, sms };
      // Email remains primary for notified_at; SMS is additive and must not block the request.
      if (email.sent) {
        const notifiedAt = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('ava_sales_qualifications')
          .update({ notified_at: notifiedAt })
          .eq('id', data.id);
        if (updateError) {
          notification.warning = 'Email sent, but notified_at could not be saved.';
        } else {
          data.notified_at = notifiedAt;
        }
      }
    }

    const prefillToken = mintPrefillToken(data.id);

    return NextResponse.json({
      qualificationId: data.id,
      prefillToken,
      qualification: toPublicQualification(data),
      notification,
    });
  } catch (error) {
    console.error('Unable to save sales qualification', error);
    return NextResponse.json({ error: 'Could not save qualification.' }, { status: 503 });
  }
}
