/** Build postcard PNGs for one stored lead (server only). */

import type { SupabaseClient } from '@supabase/supabase-js';
import { aiCleanedPreview, type CleanedPreview } from './ai-preview';
import { renderLeadImages } from './pipeline';
import { postcardBackSvg, postcardFrontSvg, qrSvgFor, renderPostcardPngs, type PostcardInput } from './postcard';
import { getAerialArea } from './sources';
import { getCachedPreview, rowToLead, saveCachedPreview, type AerialLeadRow } from './store';

export type RenderOptions = {
  /** The front never shows the cleaned image, so front-only proofs skip the paid AI call. */
  needCleaned?: boolean;
  /** When given, the AI preview is read from / written to the lead row so the model runs once per card. */
  cache?: { db: SupabaseClient; ownerId: string };
};

async function cleanedFor(row: AerialLeadRow, images: { current: Buffer; mask: Buffer; cleaned: Buffer }, opts: RenderOptions): Promise<CleanedPreview> {
  if (opts.needCleaned === false) return { image: images.cleaned, badge: 'Digital preview', model: null };
  if (opts.cache) {
    const hit = await getCachedPreview(opts.cache.db, opts.cache.ownerId, row.id);
    if (hit) return { image: hit.image, badge: 'AI preview', model: hit.model };
  }
  const cleaned = await aiCleanedPreview(images.current, images.mask, images.cleaned);
  if (opts.cache && cleaned.badge === 'AI preview' && cleaned.model) {
    await saveCachedPreview(opts.cache.db, opts.cache.ownerId, row.id, cleaned.image, cleaned.model);
  }
  return cleaned;
}

export async function postcardInputForRow(row: AerialLeadRow, opts: RenderOptions = {}): Promise<PostcardInput> {
  const area = getAerialArea(row.area_id);
  if (!area) throw new Error(`Unknown area ${row.area_id}`);
  const lead = rowToLead(row);
  const images = await renderLeadImages(area, lead);
  const cleaned = await cleanedFor(row, images, opts);
  return {
    business: row.metrics.business,
    priceDollars: row.price_dollars,
    drivewaySqft: row.driveway_sqft,
    ratePerSqft: row.metrics.ratePerSqft,
    currentImage: images.current,
    cleanedImage: cleaned.image,
    imageryLabel: lead.imagery.current,
    previewBadge: cleaned.badge,
    qrSvg: await qrSvgFor(row.metrics.business.qrUrl),
  };
}

export async function renderPostcardForRow(row: AerialLeadRow, opts: RenderOptions = {}) {
  const input = await postcardInputForRow(row, opts);
  return { ...(await renderPostcardPngs(input)), frontSvg: postcardFrontSvg(input), backSvg: postcardBackSvg(input), badge: input.previewBadge };
}
