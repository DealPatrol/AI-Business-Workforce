import { NextRequest, NextResponse } from 'next/server';
import { isUuid, requireCampaignOwner } from '@/lib/imagery/auth';
import { renderPostcardForRow } from '@/lib/aerial-leads/render';
import { getOwnedLead } from '@/lib/aerial-leads/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** GET ?side=front|back -> PNG proof of the card for one owned lead. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  const row = await getOwnedLead(auth.ctx.admin, auth.ctx.userId, id);
  if (!row) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });

  const side = request.nextUrl.searchParams.get('side') === 'back' ? 'back' : 'front';
  try {
    const card = await renderPostcardForRow(row, {
      needCleaned: side === 'back',
      cache: { db: auth.ctx.admin, ownerId: auth.ctx.userId },
    });
    return new NextResponse(new Uint8Array(side === 'back' ? card.back : card.front), {
      headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=600' },
    });
  } catch (error) {
    console.error('aerial-leads postcard render failed', error);
    return NextResponse.json({ error: 'Could not render this card from the public imagery right now.' }, { status: 502 });
  }
}
