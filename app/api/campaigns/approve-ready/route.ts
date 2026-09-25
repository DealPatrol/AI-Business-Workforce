import { NextRequest, NextResponse } from 'next/server';
import {
  isUuid,
  parseJsonBody,
  requireCampaignOwner,
} from '@/lib/imagery/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  const { data: approvedCount, error: approvalError } = await auth.ctx.admin.rpc(
    'approve_demo10_campaign',
    {
      p_campaign_id: campaignId,
      p_owner_id: auth.ctx.userId,
    },
  );

  if (approvalError) {
    console.error('approve-ready transaction failed', approvalError);
    const migrationMissing = ['PGRST202', '42883'].includes(approvalError.code);
    return NextResponse.json(
      {
        error: migrationMissing
          ? 'Campaign approval is unavailable until the Demo Blast 10 migration is applied.'
          : approvalError.message,
      },
      { status: migrationMissing ? 503 : approvalError.code === '23514' ? 409 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    campaignId,
    approvedCount: Number(approvedCount),
    status: 'ready_to_mail',
    fulfillment: 'manual_ops_confirmation_required',
  });
}
