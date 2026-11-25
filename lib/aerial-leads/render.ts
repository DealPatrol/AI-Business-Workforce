/** Build postcard PNGs for one stored lead (server only). */

import { aiCleanedPreview } from './ai-preview';
import { renderLeadImages } from './pipeline';
import { postcardBackSvg, postcardFrontSvg, qrSvgFor, renderPostcardPngs, type PostcardInput } from './postcard';
import { getAerialArea } from './sources';
import { rowToLead, type AerialLeadRow } from './store';

export async function postcardInputForRow(row: AerialLeadRow): Promise<PostcardInput> {
  const area = getAerialArea(row.area_id);
  if (!area) throw new Error(`Unknown area ${row.area_id}`);
  const lead = rowToLead(row);
  const images = await renderLeadImages(area, lead);
  const cleaned = await aiCleanedPreview(images.current, images.mask, images.cleaned);
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

export async function renderPostcardForRow(row: AerialLeadRow) {
  const input = await postcardInputForRow(row);
  return { ...(await renderPostcardPngs(input)), frontSvg: postcardFrontSvg(input), backSvg: postcardBackSvg(input), badge: input.previewBadge };
}
