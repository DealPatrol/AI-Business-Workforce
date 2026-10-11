import { NextResponse } from 'next/server';
import { proposeDrafts } from '@/lib/prospector/ai';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, parseDraftWrite, requireRecord } from '@/lib/prospector/input';
import {
  getCampaign,
  getDraft,
  getLead,
  getSettings,
  listDrafts,
  replaceDrafts,
  updateLead,
  writeDraft,
} from '@/lib/prospector/store';
import { DRAFT_KINDS } from '@/lib/prospector/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function sortDrafts<T extends { kind: (typeof DRAFT_KINDS)[number] }>(drafts: T[]) {
  return [...drafts].sort((left, right) => DRAFT_KINDS.indexOf(left.kind) - DRAFT_KINDS.indexOf(right.kind));
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const record = requireRecord(await readJson(request));
    const leadId = typeof record.leadId === 'string' ? record.leadId : '';
    if (!isUuid(leadId)) return jsonError('Choose a lead first.', 400);
    const lead = await getLead(auth.supabase, auth.user.id, leadId);
    if (!lead) return jsonError('Lead not found.', 404);
    if (lead.status === 'do_not_contact') {
      return jsonError('This lead is on the do-not-contact list.', 400);
    }
    const campaign = await getCampaign(auth.supabase, auth.user.id, lead.campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);
    const settings = await getSettings(auth.supabase, auth.user.id);
    const copies = await proposeDrafts({
      lead,
      offerSummary: campaign.offerSummary,
      sourceUrl: campaign.sourceUrl,
      notes: campaign.notes,
      senderName: settings.senderName,
      bookingUrl: settings.bookingUrl,
    });
    const drafts = sortDrafts(await replaceDrafts(auth.supabase, auth.user.id, lead.id, copies));
    const nextStatus = lead.status === 'sent' || lead.status === 'replied' || lead.status === 'booked' ? lead.status : 'drafted';
    const updated = await updateLead(auth.supabase, auth.user.id, lead.id, { status: nextStatus });
    return NextResponse.json({ drafts, lead: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const input = parseDraftWrite(await readJson(request));
    const existing = await getDraft(auth.supabase, auth.user.id, input.id);
    if (!existing) return jsonError('Draft not found.', 404);
    const lead = await getLead(auth.supabase, auth.user.id, existing.leadId);
    if (!lead) return jsonError('Lead not found.', 404);
    if (lead.status === 'do_not_contact') return jsonError('This lead is on the do-not-contact list.', 400);

    const approvedAt = input.action === 'approve' ? new Date().toISOString() : null;
    const draft = await writeDraft(auth.supabase, auth.user.id, input.id, {
      subject: input.subject,
      body: input.body,
      approvedAt,
    });
    let status = lead.status;
    if (input.action === 'approve' && (status === 'new' || status === 'drafted' || status === 'approved')) {
      status = 'approved';
    }
    if (input.action === 'save' && status === 'approved') status = 'drafted';
    const updated = status === lead.status ? lead : await updateLead(auth.supabase, auth.user.id, lead.id, { status });
    const drafts = sortDrafts(await listDrafts(auth.supabase, auth.user.id, lead.id));
    return NextResponse.json({ draft, drafts, lead: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
