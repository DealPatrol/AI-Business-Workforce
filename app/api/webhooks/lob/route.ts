import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyLobWebhook } from '@/lib/mail/lob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LobWebhook = {
  id?: string;
  event_type?: { id?: string; label?: string } | string;
  body?: { id?: string; date_modified?: string; date_created?: string };
};

function eventName(payload: LobWebhook): string {
  if (typeof payload.event_type === 'string') return payload.event_type;
  return payload.event_type?.id || payload.event_type?.label || 'unknown';
}

function mailStatus(name: string): string {
  const normalized = name.toLowerCase().replaceAll(' ', '_');
  const known = [
    'created',
    'rendered_pdf',
    'rendered_thumbnails',
    'mailed',
    'in_transit',
    'in_local_area',
    'processed_for_delivery',
    'delivered',
    're-routed',
    'returned_to_sender',
  ];
  return known.find((status) => normalized.endsWith(status)) ?? normalized.slice(0, 100);
}

export async function POST(request: NextRequest) {
  const secret = process.env.LOB_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }
  const rawBody = await request.text();
  const valid = verifyLobWebhook({
    rawBody,
    signature: request.headers.get('lob-signature'),
    timestamp: request.headers.get('lob-signature-timestamp'),
    secret,
  });
  if (!valid) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let payload: LobWebhook;
  try {
    payload = JSON.parse(rawBody) as LobWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const eventId = payload.id?.trim();
  const jobId = payload.body?.id?.trim();
  if (!eventId || !jobId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from('campaign_recipients')
    .select('id')
    .eq('mail_vendor', 'lob')
    .eq('mail_vendor_job_id', jobId)
    .maybeSingle();
  if (!recipient) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const name = eventName(payload);
  const occurredAt =
    payload.body?.date_modified || payload.body?.date_created || new Date().toISOString();
  const { error: eventError } = await admin.from('postcard_mail_events').insert({
    recipient_id: recipient.id,
    vendor: 'lob',
    vendor_event_id: eventId,
    event_type: name,
    occurred_at: occurredAt,
    payload,
  });
  if (eventError && eventError.code !== '23505') {
    console.error('Unable to store Lob webhook event', eventError);
    return NextResponse.json({ error: 'Could not store event.' }, { status: 500 });
  }
  if (eventError?.code !== '23505') {
    await admin
      .from('campaign_recipients')
      .update({ mail_status: mailStatus(name), mail_last_event_at: occurredAt })
      .eq('id', recipient.id);
  }
  return NextResponse.json({ received: true });
}
