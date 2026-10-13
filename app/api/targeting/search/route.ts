import { NextRequest, NextResponse } from 'next/server';
import { requireCampaignOwner } from '@/lib/imagery/auth';
import { applyFilters, milesBetween } from '@/lib/targeting/filter';
import { fetchRegridParcels, isRegridConfigured } from '@/lib/targeting/regrid';
import { sampleParcels } from '@/lib/targeting/sample';
import { isShovelsConfigured, markRecentPermits } from '@/lib/targeting/shovels';
import type { TargetingFilters } from '@/lib/targeting/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function n(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined;
  const x = Number(v);
  return Number.isFinite(x) ? x : undefined;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const f: TargetingFilters = {
    zip: body.zip ? String(body.zip).replace(/[^0-9]/g, '').slice(0, 5) : undefined,
    lat: n(body.lat),
    lng: n(body.lng),
    radiusMiles: Math.min(n(body.radiusMiles) ?? 0.5, 5),
    minHomeAge: n(body.minHomeAge),
    maxHomeAge: n(body.maxHomeAge),
    minLotAcres: n(body.minLotAcres),
    maxLotAcres: n(body.maxLotAcres),
    ownerOccupiedOnly: Boolean(body.ownerOccupiedOnly),
    soldWithinMonths: n(body.soldWithinMonths),
    excludePermitYears: n(body.excludePermitYears),
    limit: Math.min(n(body.limit) ?? 200, 500),
  };
  if (!f.zip && (f.lat == null || f.lng == null)) {
    return NextResponse.json({ error: 'Enter a ZIP or a job location (lat/lng) with a radius.' }, { status: 400 });
  }

  const live = isRegridConfigured();
  try {
    let parcels;
    if (live) {
      // Real lookups use paid record allowance: require a signed-in client.
      const auth = await requireCampaignOwner();
      if (!auth.ok) return auth.response;
      parcels = await fetchRegridParcels(f);
    } else {
      parcels = sampleParcels({ zip: f.zip, lat: f.lat, lng: f.lng, count: 80 });
      if (f.lat != null && f.lng != null) {
        parcels = parcels.filter(
          (p) => p.lat != null && p.lng != null && milesBetween(f.lat!, f.lng!, p.lat, p.lng) <= (f.radiusMiles ?? 0.5) * 3,
        );
      }
    }
    let permitSource: 'shovels' | 'sample' | 'off' = 'off';
    if (f.excludePermitYears) {
      if (live && isShovelsConfigured() && f.zip) {
        parcels = await markRecentPermits(parcels, f.zip, f.excludePermitYears);
        permitSource = 'shovels';
      } else if (!live) {
        permitSource = 'sample';
      } else {
        parcels = parcels.map((p) => ({ ...p, recentPermit: false }));
      }
    } else {
      parcels = parcels.map((p) => ({ ...p, recentPermit: false }));
    }
    const matched = applyFilters(parcels, f);
    return NextResponse.json({
      source: live ? 'regrid' : 'sample',
      permitSource,
      scanned: parcels.length,
      count: matched.length,
      parcels: matched.slice(0, 200),
    });
  } catch (error) {
    console.error('targeting search error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed.' }, { status: 502 });
  }
}
