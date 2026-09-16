import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  AvaSalesQualificationInput,
  AvaSalesQualificationRow,
  REQUIRED_QUALIFY_FIELDS,
  rowFromInput,
  sanitizeQualifyField,
  toPublicQualification,
} from '@/lib/ava/sales-qualify';

const escapeHtml = (value: unknown) =>
  String(value ?? 'Not provided').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] || c,
  );

async function notifySalesQualification(row: AvaSalesQualificationRow) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.AVA_LEAD_NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    return { sent: false, error: 'Email notification environment variables are not configured.' };
  }

  const subject = `Sales Ava qualification — ${row.business_name}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto;color:#17211b">
    <h1 style="font-size:22px">New Sales Ava qualification</h1>
    <p>A prospect finished the qualify conversation. Prefill onboarding with <code>qualificationId=${escapeHtml(row.id)}</code>.</p>
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
    conversationId: sanitizeQualifyField(body.conversationId || '') || null,
    setupCallBookedAt: body.setupCallBookedAt ? String(body.setupCallBookedAt) : null,
    setupCallMeetUrl: sanitizeQualifyField(body.setupCallMeetUrl || '') || null,
  };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || req.nextUrl.searchParams.get('qualificationId');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
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

    return NextResponse.json({ qualification: toPublicQualification(data as AvaSalesQualificationRow) });
  } catch (error) {
    console.error('Unable to load sales qualification', error);
    return NextResponse.json({ error: 'Qualification lookup is unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = parseBody(body);

    const missing = REQUIRED_QUALIFY_FIELDS.filter((key) => !input[key]);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const payload = rowFromInput(input);

    let data: AvaSalesQualificationRow | null = null;
    let error = null as { message: string } | null;

    if (payload.conversation_id) {
      const upsert = await supabase
        .from('ava_sales_qualifications')
        .upsert(payload, { onConflict: 'conversation_id' })
        .select()
        .single();
      data = upsert.data as AvaSalesQualificationRow | null;
      error = upsert.error;
    } else {
      const insert = await supabase.from('ava_sales_qualifications').insert(payload).select().single();
      data = insert.data as AvaSalesQualificationRow | null;
      error = insert.error;
    }

    if (error || !data) {
      console.error('Unable to save sales qualification', error);
      return NextResponse.json({ error: 'Could not save qualification.' }, { status: 503 });
    }

    let notification: { sent: boolean; skipped?: boolean; error?: string; id?: string; warning?: string } = {
      sent: Boolean(data.notified_at),
      skipped: Boolean(data.notified_at),
    };

    if (!data.notified_at) {
      notification = await notifySalesQualification(data);
      if (notification.sent) {
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

    return NextResponse.json({
      qualificationId: data.id,
      qualification: toPublicQualification(data),
      notification,
    });
  } catch (error) {
    console.error('Unable to save sales qualification', error);
    return NextResponse.json({ error: 'Could not save qualification.' }, { status: 503 });
  }
}
