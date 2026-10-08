import { NextResponse } from 'next/server';
import { errorResponse, readJson, requireUser } from '@/lib/prospector/http';
import { parseCampaignInput, parseCampaignPatch } from '@/lib/prospector/input';
import { getCampaign, insertCampaign, listCampaigns, updateCampaign } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const campaigns = await listCampaigns(auth.supabase, auth.user.id);
    return NextResponse.json({ campaigns });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const input = parseCampaignInput(await readJson(request));
    const campaign = await insertCampaign(auth.supabase, auth.user.id, input);
    return NextResponse.json({ campaign });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const { id, patch } = parseCampaignPatch(await readJson(request));
    const existing = await getCampaign(auth.supabase, auth.user.id, id);
    if (!existing) return NextResponse.json({ error: 'Saved list not found.' }, { status: 404 });
    const campaign = await updateCampaign(auth.supabase, auth.user.id, id, patch);
    return NextResponse.json({ campaign });
  } catch (error) {
    return errorResponse(error);
  }
}
