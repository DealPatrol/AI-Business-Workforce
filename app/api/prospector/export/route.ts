import { NextResponse } from 'next/server';
import { leadsToCsv } from '@/lib/prospector/csv';
import { errorResponse, jsonError, requireUser } from '@/lib/prospector/http';
import { isUuid } from '@/lib/prospector/input';
import { getCampaign, listLeads } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const campaignId = new URL(request.url).searchParams.get('campaignId') ?? '';
    if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
    const campaign = await getCampaign(auth.supabase, auth.user.id, campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);
    const leads = await listLeads(auth.supabase, auth.user.id, campaign.id);
    const csv = leadsToCsv(leads);
    const filename = `${campaign.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'leads'}.csv`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
