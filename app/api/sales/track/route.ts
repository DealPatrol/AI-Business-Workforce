import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_EVENTS = new Set([
  'demo_open',
  'call_started',
  'call_ended',
  'pilot_clicked',
  'contacted',
  'replied',
  'conversation',
  'pilot_proposed',
]);

const STATUS_FROM_EVENT: Record<string, string> = {
  demo_open: 'opened',
  call_started: 'called_ava',
  call_ended: 'called_ava',
  pilot_clicked: 'pilot_proposed',
  contacted: 'contacted',
  replied: 'replied',
  conversation: 'conversation',
  pilot_proposed: 'pilot_proposed',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prospectSlug = String(body.prospectSlug || '').trim();
    const eventType = String(body.eventType || '').trim();

    if (!prospectSlug || !VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid tracking payload.' }, { status: 400 });
    }

    const metadata =
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    let supabase;
    try {
      supabase = await createClient();
    } catch {
      return NextResponse.json({ tracked: false, reason: 'storage_unavailable' });
    }
    const { error: insertError } = await supabase.from('sales_prospect_events').insert({
      prospect_slug: prospectSlug,
      event_type: eventType,
      metadata,
    });

    if (insertError) {
      console.error('Sales tracking insert failed', insertError);
      return NextResponse.json({ tracked: false, reason: 'storage_unavailable' });
    }

    const nextStatus = STATUS_FROM_EVENT[eventType];
    if (nextStatus) {
      await supabase.from('sales_prospect_status').upsert(
        {
          prospect_slug: prospectSlug,
          status: nextStatus,
          updated_at: new Date().toISOString(),
          ...(eventType === 'contacted' ? { contacted_at: new Date().toISOString() } : {}),
        },
        { onConflict: 'prospect_slug' },
      );
    }

    return NextResponse.json({ tracked: true });
  } catch (error) {
    console.error('Sales tracking error', error);
    return NextResponse.json({ tracked: false });
  }
}

export async function GET() {
  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      return NextResponse.json({ events: [], statuses: [], available: false });
    }

    const [eventsResult, statusResult] = await Promise.all([
      supabase
        .from('sales_prospect_events')
        .select('prospect_slug, event_type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('sales_prospect_status').select('prospect_slug, status, notes, contacted_at, updated_at'),
    ]);

    if (eventsResult.error) {
      return NextResponse.json({ events: [], statuses: [], available: false });
    }

    return NextResponse.json({
      available: true,
      events: eventsResult.data ?? [],
      statuses: statusResult.data ?? [],
    });
  } catch {
    return NextResponse.json({ events: [], statuses: [], available: false });
  }
}
