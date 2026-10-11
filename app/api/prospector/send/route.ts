import { NextResponse } from 'next/server';
import { deliverDraft } from '@/lib/prospector/deliver';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, requireRecord } from '@/lib/prospector/input';
import { getCampaign, nextApprovedDraft } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const record = requireRecord(await readJson(request));
    const draftId = typeof record.draftId === 'string' ? record.draftId : '';
    const campaignId = typeof record.campaignId === 'string' ? record.campaignId : '';
    const toEmail = typeof record.toEmail === 'string' ? record.toEmail : undefined;

    let targetId = draftId;
    if (record.next === true) {
      if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
      const campaign = await getCampaign(auth.supabase, auth.user.id, campaignId);
      if (!campaign) return jsonError('Saved list not found.', 404);
      const next = await nextApprovedDraft(auth.supabase, auth.user.id, campaign.id);
      if (!next) return NextResponse.json({ done: true });
      targetId = next.id;
    }
    if (!isUuid(targetId)) return jsonError('Choose an approved draft to send.', 400);

    const outcome = await deliverDraft(auth.supabase, auth.user.id, targetId, toEmail);
    if (!outcome.ok) {
      return jsonError(outcome.message, outcome.status, {
        code: outcome.code,
        retryAfterSeconds: outcome.retryAfterSeconds,
        send: outcome.send,
      });
    }
    return NextResponse.json({
      done: false,
      alreadySent: outcome.alreadySent,
      send: outcome.send,
      lead: outcome.lead,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
