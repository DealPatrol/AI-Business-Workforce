import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCustomerEmail, sendCustomerSms } from '@/lib/outbound';
import { requestEmailHtml, requestSmsBody, reviewPageUrl, type RfBusiness } from '@/lib/reputation/store';

export const dynamic = 'force-dynamic';

/** Daily cron: one follow-up, 3+ days after a request that was never opened. Never more than one. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 3 * 86400_000).toISOString();
  const { data } = await admin
    .from('rf_requests')
    .select('*, rf_businesses(*)')
    .eq('status', 'sent')
    .is('opened_at', null)
    .is('reminder_sent_at', null)
    .lt('sent_at', cutoff)
    .limit(50);
  let sent = 0;
  for (const row of data ?? []) {
    const business = row.rf_businesses as RfBusiness;
    const link = reviewPageUrl(business.slug, row.id);
    const result =
      row.channel === 'sms'
        ? row.consent_confirmed && row.customer_phone
          ? await sendCustomerSms({ to: row.customer_phone, body: requestSmsBody(business, row.customer_name || '', link, true) })
          : { sent: false }
        : await sendCustomerEmail({ to: row.customer_email, subject: `Quick reminder — ${business.name}`, html: requestEmailHtml(business, row.customer_name || '', link, true) });
    await admin.from('rf_requests').update({ reminder_sent_at: new Date().toISOString() }).eq('id', row.id);
    if (result.sent) sent += 1;
  }
  return NextResponse.json({ checked: data?.length || 0, sent });
}
