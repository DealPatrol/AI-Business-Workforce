import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = new Set([
  'queued',
  'contacted',
  'demo_sent',
  'opened',
  'called_ava',
  'replied',
  'conversation',
  'pilot_proposed',
  'passed',
]);

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const prospectSlug = String(body.prospectSlug || '').trim();
    const status = String(body.status || '').trim();
    const notes = body.notes != null ? String(body.notes) : undefined;

    if (!prospectSlug || !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = await createClient();
    } catch {
      return NextResponse.json({ error: 'Tracking storage is not configured.' }, { status: 503 });
    }
    const payload: Record<string, unknown> = {
      prospect_slug: prospectSlug,
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) payload.notes = notes;
    if (status === 'contacted' || status === 'demo_sent') {
      payload.contacted_at = new Date().toISOString();
    }

    const { error } = await supabase.from('sales_prospect_status').upsert(payload, {
      onConflict: 'prospect_slug',
    });

    if (error) {
      console.error('Status update failed', error);
      return NextResponse.json({ error: 'Could not update status.' }, { status: 503 });
    }

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error('Status update error', error);
    return NextResponse.json({ error: 'Could not update status.' }, { status: 503 });
  }
}
