import { NextResponse } from 'next/server';
import { proposeTargets } from '@/lib/prospector/ai';
import { PublicFetchError } from '@/lib/prospector/errors';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, requireRecord } from '@/lib/prospector/input';
import { fetchPublicHtml } from '@/lib/prospector/safe-fetch';
import { getCampaign, updateCampaign } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const record = requireRecord(await readJson(request));
    const campaignId = typeof record.campaignId === 'string' ? record.campaignId : '';
    if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
    const campaign = await getCampaign(auth.supabase, auth.user.id, campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);

    let pageTitle = '';
    let pageText = '';
    let usedPage = false;
    try {
      const page = await fetchPublicHtml(campaign.sourceUrl);
      pageTitle = page.title;
      pageText = page.text;
      usedPage = true;
    } catch (error) {
      if (!campaign.notes.trim()) {
        throw error instanceof PublicFetchError
          ? error
          : new PublicFetchError('The website could not be read. Add notes about who you sell to and try again.');
      }
      pageText = '';
    }

    const proposal = await proposeTargets({
      sourceUrl: campaign.sourceUrl,
      pageTitle,
      pageText,
      notes: campaign.notes,
      location: campaign.location,
    });
    const updated = await updateCampaign(auth.supabase, auth.user.id, campaign.id, {
      targets: proposal.targets,
      offer_summary: campaign.offerSummary.trim() ? campaign.offerSummary : proposal.summary,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({
      campaign: updated,
      summary: proposal.summary,
      usedPage,
      pageTitle,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
