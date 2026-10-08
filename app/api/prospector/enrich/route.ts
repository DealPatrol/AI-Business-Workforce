import { NextResponse } from 'next/server';
import { ENRICH_BATCH_SIZE, ENRICH_CONCURRENCY } from '@/lib/prospector/constants';
import { enrichWebsite } from '@/lib/prospector/enrich';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, requireRecord } from '@/lib/prospector/input';
import { mapPool } from '@/lib/prospector/pool';
import { getCampaign, listLeads, updateLead } from '@/lib/prospector/store';
import type { ProspectorLead } from '@/lib/prospector/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function idsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && isUuid(item)).slice(0, ENRICH_BATCH_SIZE);
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const ownerId = auth.user.id;
    const record = requireRecord(await readJson(request));
    const campaignId = typeof record.campaignId === 'string' ? record.campaignId : '';
    if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
    const campaign = await getCampaign(auth.supabase, ownerId, campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);

    const requested = new Set(idsOf(record.leadIds));
    const leads = await listLeads(auth.supabase, ownerId, campaign.id);
    const batch = leads
      .filter((lead) => lead.website && lead.status !== 'do_not_contact')
      .filter((lead) => (requested.size > 0 ? requested.has(lead.id) : lead.enrichmentStatus !== 'enriched'))
      .slice(0, ENRICH_BATCH_SIZE);

    let enriched = 0;
    let failed = 0;
    await mapPool(batch, ENRICH_CONCURRENCY, async (lead) => {
      const website = lead.website;
      if (!website) return;
      const result = await enrichWebsite(website);
      const patch: Record<string, unknown> = {};
      if (!result.ok) {
        failed += 1;
        patch.enrichment_status = 'failed';
        if (lead.emails.length === 0) patch.channel = lead.phone ? 'call_only' : 'unknown';
      } else {
        enriched += 1;
        patch.enrichment_status = 'enriched';
        patch.emails = result.emails;
        patch.contact_name = result.contactName;
        patch.channel = result.emails.length > 0 ? 'email' : 'call_only';
      }
      if (lead.status !== 'do_not_contact') {
        await updateLead(auth.supabase, ownerId, lead.id, patch);
      }
    });

    const updated = await listLeads(auth.supabase, ownerId, campaign.id);
    return NextResponse.json({
      leads: updated satisfies ProspectorLead[],
      enriched,
      failed,
      processed: batch.length,
      remaining: Math.max(
        leads.filter((lead) => lead.website && lead.enrichmentStatus !== 'enriched' && lead.status !== 'do_not_contact')
          .length - batch.length,
        0,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
