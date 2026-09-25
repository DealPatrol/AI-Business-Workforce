import { NextRequest, NextResponse } from 'next/server';
import {
  isUuid,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ACCEPTED_CURRENT = new Set(['street_view', 'crew_photo', 'owner_upload']);

export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  const body = await parseJsonBody(request);
  const campaignId = String(body.campaignId ?? '').trim();
  if (!isUuid(campaignId)) {
    return NextResponse.json({ error: 'A valid campaignId is required.' }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await auth.ctx.admin
    .from('campaigns')
    .select('id, owner_id')
    .eq('id', campaignId)
    .eq('owner_id', auth.ctx.userId)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
  }

  const { data: recipients, error: recipientError } = await auth.ctx.admin
    .from('campaign_recipients')
    .select('id, current_image_url, current_image_source, after_image_url')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
    .limit(11);

  if (recipientError) {
    console.error('approve-ready recipient load failed', recipientError);
    return NextResponse.json({ error: 'Could not load campaign cards.' }, { status: 500 });
  }

  if (!recipients?.length || recipients.length > 10) {
    return NextResponse.json(
      { error: 'Demo Blast 10 must contain between 1 and 10 cards.' },
      { status: 409 },
    );
  }

  const unready = recipients.filter(
    (recipient) =>
      !recipient.current_image_url ||
      !recipient.after_image_url ||
      !recipient.current_image_source ||
      !ACCEPTED_CURRENT.has(recipient.current_image_source),
  );
  if (unready.length > 0) {
    return NextResponse.json(
      {
        error: `${unready.length} card${unready.length === 1 ? ' is' : 's are'} missing reviewable Current/After imagery.`,
      },
      { status: 409 },
    );
  }

  const approvedAt = new Date().toISOString();
  const { error: approvalError } = await auth.ctx.admin
    .from('campaign_recipients')
    .update({
      review_status: 'approved',
      postcard_approved_at: approvedAt,
      review_notes: null,
    })
    .in('id', recipients.map((recipient) => recipient.id));

  if (approvalError) {
    console.error('approve-ready card update failed', approvalError);
    return NextResponse.json({ error: 'Could not approve ready cards.' }, { status: 500 });
  }

  const { error: statusError } = await auth.ctx.admin
    .from('campaigns')
    .update({ status: 'ready_to_mail' })
    .eq('id', campaignId)
    .eq('owner_id', auth.ctx.userId);

  if (statusError) {
    console.error('approve-ready campaign update failed', statusError);
    return NextResponse.json(
      {
        error:
          'Cards were approved, but ready_to_mail is not available yet. Apply the Demo Blast 10 migration, then retry.',
      },
      { status: statusError.code === '23514' ? 503 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    campaignId,
    approvedCount: recipients.length,
    status: 'ready_to_mail',
    fulfillment: 'manual_ops_confirmation_required',
  });
}
