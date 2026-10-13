import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentUserEmail } from '@/lib/ava/client-access';
import { sendCustomerEmail, sendCustomerSms } from '@/lib/outbound';
import { ownedBusiness, requestEmailHtml, requestSmsBody, reviewPageUrl } from '@/lib/reputation/store';
import { toE164 } from '@/lib/analytics/contact';

export const dynamic = 'force-dynamic';

/** "Job done" → one review request by email or text. One request per customer per job; no gating. */
export async function POST(req: NextRequest) {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const business = await ownedBusiness(email, String(body.businessId || ''));
  if (!business) return NextResponse.json({ error: 'Not your business.' }, { status: 403 });
  if (!business.google_review_url && !business.facebook_url && !business.yelp_url) {
    return NextResponse.json({ error: 'Add your Google review link first.' }, { status: 400 });
  }
  const channel = body.channel === 'sms' ? 'sms' : 'email';
  const customerName = String(body.customerName || '').trim().slice(0, 80);
  const customerEmail = String(body.customerEmail || '').trim().slice(0, 200);
  const customerPhone = toE164(String(body.customerPhone || ''));
  const consent = body.consent === true;
  if (channel === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Valid customer email required.' }, { status: 400 });
  }
  if (channel === 'sms' && (!customerPhone || !consent)) {
    return NextResponse.json(
      { error: 'Texts need a phone number and your confirmation that this customer agreed to get texts from you (TCPA).' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from('rf_requests')
    .insert({
      business_id: business.id,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      job_note: String(body.jobNote || '').slice(0, 300) || null,
      channel,
      consent_confirmed: consent,
    })
    .select('id')
    .single();
  if (error || !row) return NextResponse.json({ error: error?.message || 'Could not save.' }, { status: 500 });

  const link = reviewPageUrl(business.slug, row.id);
  const result =
    channel === 'email'
      ? await sendCustomerEmail({ to: customerEmail, subject: `How did we do? — ${business.name}`, html: requestEmailHtml(business, customerName, link), replyTo: business.owner_email })
      : await sendCustomerSms({ to: customerPhone, body: requestSmsBody(business, customerName, link) });
  await admin
    .from('rf_requests')
    .update({ status: result.sent ? 'sent' : 'failed', sent_at: result.sent ? new Date().toISOString() : null, error: result.error || null })
    .eq('id', row.id);
  return NextResponse.json({ id: row.id, link, ...result });
}
