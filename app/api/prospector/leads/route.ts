import { NextResponse } from 'next/server';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, parseLeadStatus } from '@/lib/prospector/input';
import { addSuppressions, getCampaign, getLead, listLeads, updateLead } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const campaignId = new URL(request.url).searchParams.get('campaignId') ?? '';
    if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
    const campaign = await getCampaign(auth.supabase, auth.user.id, campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);
    const leads = await listLeads(auth.supabase, auth.user.id, campaignId);
    return NextResponse.json({ leads });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const { id, status } = parseLeadStatus(await readJson(request));
    const existing = await getLead(auth.supabase, auth.user.id, id);
    if (!existing) return jsonError('Lead not found.', 404);
    const lead = await updateLead(auth.supabase, auth.user.id, id, { status });
    if (status === 'do_not_contact') {
      await addSuppressions(auth.supabase, auth.user.id, existing.emails, 'do_not_contact');
    }
    return NextResponse.json({ lead });
  } catch (error) {
    return errorResponse(error);
  }
}
