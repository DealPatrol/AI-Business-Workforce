import { NextResponse } from 'next/server';
import { isUuid, requireCampaignOwner } from '@/lib/imagery/auth';
import { mailStatus, sendTestPostcard, toLobAddress } from '@/lib/aerial-leads/mail';
import { renderPostcardForRow } from '@/lib/aerial-leads/render';
import { getOwnedLead } from '@/lib/aerial-leads/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Send ONE approved card to Lob in TEST mode. Lob test keys never print or
 * mail anything and are free. Live keys are refused in lib/aerial-leads/mail.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  const status = mailStatus();
  if (!status.enabled) return NextResponse.json({ error: status.reason, configured: false }, { status: 503 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  const row = await getOwnedLead(auth.ctx.admin, auth.ctx.userId, id);
  if (!row) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
  if (row.status !== 'approved') return NextResponse.json({ error: 'Approve this card first.' }, { status: 409 });
  if (!row.mailing) return NextResponse.json({ error: 'This parcel has no mailing address on file.' }, { status: 422 });

  try {
    const card = await renderPostcardForRow(row);
    const sent = await sendTestPostcard({
      to: toLobAddress(row.mailing),
      front: card.front,
      back: card.back,
      description: `Aerial lead test ${row.situs_address}`,
      approval: { status: row.status, approvedAt: row.approved_at, approvedBy: row.approved_by },
    });
    await auth.ctx.admin
      .from('aerial_leads')
      .update({ status: 'test_mailed', lob_postcard_id: sent.id, lob_test_url: sent.url, test_mailed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', auth.ctx.userId);
    return NextResponse.json({ ok: true, mode: 'test', lobId: sent.id, proofUrl: sent.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
