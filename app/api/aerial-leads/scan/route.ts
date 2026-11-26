import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody, requireCampaignOwner } from '@/lib/imagery/auth';
import { parseScanRequest } from '@/lib/aerial-leads/input';
import { scanArea } from '@/lib/aerial-leads/pipeline';
import { maskOwnerName } from '@/lib/aerial-leads/parcels';
import { saveScan } from '@/lib/aerial-leads/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Scan one neighborhood with free public imagery + parcel data and save the
 * flagged homes for review. Nothing is mailed here.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  let parsed;
  try {
    parsed = parseScanRequest(await parseJsonBody(request));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    const result = await scanArea({ area: parsed.area, bbox: parsed.bbox, thresholds: parsed.thresholds, price: parsed.price });
    const saved = await saveScan(auth.ctx.admin, auth.ctx.userId, result, parsed.business);
    return NextResponse.json({
      scanId: saved.scanId,
      scannedParcels: result.scannedParcels,
      mailableParcels: result.mailableParcels,
      flaggedCount: result.flaggedCount,
      imagery: result.imagery,
      // Closest non-flagged homes, so the operator can see why nothing passed.
      nearMisses: result.leads
        .filter((l) => !l.flagged && l.driveway.sqft >= result.thresholds.minDrivewaySqft)
        .slice(0, 5)
        .map((l) => ({ owner: maskOwnerName(l.ownerName), situs: l.situsAddress, stainedPct: l.driveway.stainedPct, darkerPct: l.driveway.darkerPct, reasons: l.reasons })),
      leadIds: saved.leads.map((l) => l.id),
    });
  } catch (error) {
    console.error('aerial-leads scan failed', error);
    return NextResponse.json({ error: (error as Error).message || 'Scan failed.' }, { status: 502 });
  }
}
