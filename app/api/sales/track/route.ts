import { NextRequest, NextResponse } from 'next/server';
import { listSalesEvents, recordSalesEvent } from '@/lib/sales-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await recordSalesEvent({
      prospectSlug: String(body.prospectSlug || ''),
      eventType: String(body.eventType || ''),
      metadata:
        body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
          ? body.metadata
          : {},
    });

    if (result.reason === 'invalid_payload') {
      return NextResponse.json({ error: 'Invalid tracking payload.' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sales tracking error', error);
    return NextResponse.json({ tracked: false });
  }
}

export async function GET() {
  const result = await listSalesEvents();
  return NextResponse.json(result);
}
