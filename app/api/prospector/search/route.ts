import { NextResponse } from 'next/server';
import { placesSearchEstimate } from '@/lib/prospector/constants';
import { errorResponse, jsonError, readJson, requireUser } from '@/lib/prospector/http';
import { isUuid, requireRecord } from '@/lib/prospector/input';
import { searchGooglePlaces } from '@/lib/prospector/google-places';
import { queriesFromTargets } from '@/lib/prospector/places';
import { getCampaign, insertNewLeads, listLeads, newLeadRow } from '@/lib/prospector/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.response;
    const ownerId = auth.user.id;
    const record = requireRecord(await readJson(request));
    const campaignId = typeof record.campaignId === 'string' ? record.campaignId : '';
    if (!isUuid(campaignId)) return jsonError('Choose a saved list first.', 400);
    const campaign = await getCampaign(auth.supabase, auth.user.id, campaignId);
    if (!campaign) return jsonError('Saved list not found.', 404);

    const queries = queriesFromTargets(campaign.targets);
    const estimate = placesSearchEstimate(queries.length);
    if (queries.length === 0) {
      return jsonError('Select at least one business type with a Google Maps query.', 400);
    }
    if (record.confirm !== true) {
      return jsonError('Confirm the search before any Places API request is sent.', 400, { estimate });
    }

    const existing = await listLeads(auth.supabase, ownerId, campaign.id);
    const seen = new Set(existing.map((lead) => lead.placeId));
    const result = await searchGooglePlaces({
      queries,
      location: campaign.location,
      radiusMeters: campaign.radiusMeters,
    });
    const fresh = result.places.filter((place) => !seen.has(place.placeId));
    const inserted = await insertNewLeads(
      auth.supabase,
      fresh.map((place) => newLeadRow(ownerId, campaign.id, place)),
    );
    const leads = await listLeads(auth.supabase, ownerId, campaign.id);
    return NextResponse.json({
      estimate,
      inserted,
      duplicates: result.places.length - fresh.length,
      warnings: result.warnings,
      leads,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
