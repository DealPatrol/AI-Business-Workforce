import { NextRequest, NextResponse } from 'next/server';
import { updateSalesStatus } from '@/lib/sales-events';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await updateSalesStatus({
      prospectSlug: String(body.prospectSlug || ''),
      status: String(body.status || ''),
      notes: body.notes != null ? String(body.notes) : undefined,
    });

    if (result.reason === 'invalid_payload') {
      return NextResponse.json({ error: 'Invalid status update.' }, { status: 400 });
    }

    if (!result.updated) {
      return NextResponse.json(
        { error: 'Could not update status.', reason: result.reason },
        { status: 503 },
      );
    }

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error('Status update error', error);
    return NextResponse.json({ error: 'Could not update status.' }, { status: 503 });
  }
}
