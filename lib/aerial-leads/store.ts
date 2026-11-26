/** Supabase persistence for aerial leads (RLS: owner_id = auth.uid()). */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AerialLead, ScanResult } from './pipeline';
import type { PostcardBusiness } from './postcard';

export type AerialLeadRow = {
  id: string;
  scan_id: string;
  area_id: string;
  parcel_id: string;
  pin: string | null;
  owner_name: string;
  mailing: AerialLead['mailing'];
  situs_address: string;
  stain_score: number;
  darker_pct: number;
  driveway_sqft: number;
  price_dollars: number;
  flagged: boolean;
  metrics: {
    driveway: AerialLead['driveway'];
    roof: AerialLead['roof'];
    reasons: string[];
    refs: AerialLead['refs'];
    nirRefs?: AerialLead['nirRefs'];
    cropExtent: AerialLead['cropExtent'];
    imagery: AerialLead['imagery'];
    centroid: AerialLead['centroid'];
    ownerOccupied: boolean;
    business: PostcardBusiness;
    ratePerSqft: number;
  };
  status: 'flagged' | 'approved' | 'rejected' | 'test_mailed';
  approved_at: string | null;
  approved_by: string | null;
  lob_postcard_id: string | null;
  lob_test_url: string | null;
  test_mailed_at: string | null;
  created_at: string;
};

export const LEAD_COLUMNS =
  'id, scan_id, area_id, parcel_id, pin, owner_name, mailing, situs_address, stain_score, darker_pct, driveway_sqft, price_dollars, flagged, metrics, status, approved_at, approved_by, lob_postcard_id, lob_test_url, test_mailed_at, created_at';

/** Rebuild the pipeline's lead shape from a stored row (for rendering). */
export function rowToLead(row: AerialLeadRow): AerialLead {
  return {
    id: row.id,
    areaId: row.area_id,
    parcelId: row.parcel_id,
    pin: row.pin ?? '',
    ownerName: row.owner_name,
    mailing: row.mailing,
    situsAddress: row.situs_address,
    ownerOccupied: row.metrics.ownerOccupied,
    centroid: row.metrics.centroid,
    driveway: row.metrics.driveway,
    roof: row.metrics.roof,
    stainScore: row.stain_score,
    flagged: row.flagged,
    reasons: row.metrics.reasons,
    priceDollars: row.price_dollars,
    cropExtent: row.metrics.cropExtent,
    refs: row.metrics.refs,
    nirRefs: row.metrics.nirRefs,
    imagery: row.metrics.imagery,
  };
}

export async function saveScan(
  db: SupabaseClient,
  ownerId: string,
  result: ScanResult,
  business: PostcardBusiness,
): Promise<{ scanId: string; leads: AerialLeadRow[] }> {
  const { data: scan, error } = await db
    .from('aerial_lead_scans')
    .insert({
      owner_id: ownerId,
      area_id: result.areaId,
      bbox: result.bbox,
      business,
      price: result.price,
      thresholds: result.thresholds,
      summary: {
        scannedParcels: result.scannedParcels,
        mailableParcels: result.mailableParcels,
        flaggedCount: result.flaggedCount,
        imagery: result.imagery,
        priorShiftPx: result.priorShiftPx,
      },
    })
    .select('id')
    .single();
  if (error || !scan) throw new Error(`Could not save scan: ${error?.message ?? 'unknown error'}`);

  const flagged = result.leads.filter((l) => l.flagged);
  if (!flagged.length) return { scanId: scan.id, leads: [] };
  const rows = flagged.map((lead) => ({
    owner_id: ownerId,
    scan_id: scan.id,
    area_id: lead.areaId,
    parcel_id: lead.parcelId,
    pin: lead.pin || null,
    owner_name: lead.ownerName,
    mailing: lead.mailing,
    situs_address: lead.situsAddress,
    stain_score: Math.max(0, Math.min(100, lead.stainScore)),
    darker_pct: lead.driveway.darkerPct,
    driveway_sqft: lead.driveway.sqft,
    price_dollars: lead.priceDollars,
    flagged: lead.flagged,
    metrics: {
      driveway: lead.driveway,
      roof: lead.roof,
      reasons: lead.reasons,
      refs: lead.refs,
      nirRefs: lead.nirRefs,
      cropExtent: lead.cropExtent,
      imagery: lead.imagery,
      centroid: lead.centroid,
      ownerOccupied: lead.ownerOccupied,
      business,
      ratePerSqft: result.price.ratePerSqft,
    },
  }));
  const { data, error: leadError } = await db.from('aerial_leads').insert(rows).select(LEAD_COLUMNS);
  if (leadError) throw new Error(`Could not save leads: ${leadError.message}`);
  return { scanId: scan.id, leads: (data ?? []) as unknown as AerialLeadRow[] };
}

export async function getOwnedLead(db: SupabaseClient, ownerId: string, id: string): Promise<AerialLeadRow | null> {
  const { data } = await db.from('aerial_leads').select(LEAD_COLUMNS).eq('id', id).eq('owner_id', ownerId).maybeSingle();
  return (data as unknown as AerialLeadRow) ?? null;
}

export async function listLeads(db: SupabaseClient, ownerId: string, limit = 100): Promise<AerialLeadRow[]> {
  const { data, error } = await db
    .from('aerial_leads')
    .select(LEAD_COLUMNS)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AerialLeadRow[];
}

/** Cached AI-cleaned preview (only stored for real model output). */
export async function getCachedPreview(db: SupabaseClient, ownerId: string, id: string): Promise<{ image: Buffer; model: string } | null> {
  const { data } = await db
    .from('aerial_leads')
    .select('cleaned_preview_jpeg_b64, cleaned_preview_model')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle();
  const row = data as { cleaned_preview_jpeg_b64: string | null; cleaned_preview_model: string | null } | null;
  if (!row?.cleaned_preview_jpeg_b64) return null;
  return { image: Buffer.from(row.cleaned_preview_jpeg_b64, 'base64'), model: row.cleaned_preview_model ?? 'ai' };
}

export async function saveCachedPreview(db: SupabaseClient, ownerId: string, id: string, image: Buffer, model: string): Promise<void> {
  const { error } = await db
    .from('aerial_leads')
    .update({ cleaned_preview_jpeg_b64: image.toString('base64'), cleaned_preview_model: model, cleaned_preview_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', ownerId);
  if (error) console.error('aerial-leads could not cache AI preview', error.message);
}
