import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { recordPilotSale } from '@/lib/ava/pilot-sales';
import { createPilotSaleDeps } from '@/lib/ava/pilot-sales-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authorized(request: NextRequest, secret: string) {
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Admin-only: mark a lead as a booked job without the owner's link.
 * POST { "leadId": "<ava_call_leads.id>", "note": "optional" }
 * Authorization: Bearer $AVA_PROVISIONING_SECRET (same internal-ops secret as /api/ava/provision).
 * Idempotent per lead: repeating the call never adds a second charge.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.AVA_PROVISIONING_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Pilot sales admin API is not configured.' }, { status: 503 });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const leadId = String(body.leadId ?? '').trim();
  if (!UUID_PATTERN.test(leadId)) {
    return NextResponse.json({ error: 'A valid leadId is required.' }, { status: 400 });
  }
  const note = typeof body.note === 'string' ? body.note : null;

  try {
    const result = await recordPilotSale(createPilotSaleDeps(), { leadId, markedBy: 'admin', note });
    if (!result.ok) {
      const status =
        result.code === 'lead_not_found' ? 404 : result.code === 'not_pilot_customer' ? 409 : 503;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }
    const { sale } = result;
    return NextResponse.json(
      {
        duplicate: result.duplicate,
        billingPending: result.billingPending,
        sale: {
          id: sale.id,
          leadId: sale.lead_id,
          periodStart: sale.period_start,
          periodSeq: sale.period_seq,
          billingOutcome: sale.billing_outcome,
          billedCents: sale.billed_cents,
          baseCents: sale.base_cents,
          stripeInvoiceItemId: sale.stripe_invoice_item_id,
        },
      },
      { status: result.billingPending ? 202 : 200 },
    );
  } catch (error) {
    console.error('Pilot sale admin record failed', error);
    return NextResponse.json({ error: 'Could not record the sale.' }, { status: 500 });
  }
}
