/**
 * Aerial postcard leads pipeline (server only).
 *
 * bbox -> current + prior NAIP tiles -> county parcels + building footprints
 * -> per-parcel driveway mask + staining score -> price -> lead records.
 *
 * All sources are free public services; nothing here mails or spends money.
 */

import { fetchGridBand, fetchGridRgb, queryPolygons, type Feature } from './arcgis';
import {
  bboxToMercatorExtent,
  dilate,
  extentGroundSize,
  makeGrid,
  mercatorToLonLat,
  pointInExtent,
  rasterizeRings,
  ringCentroid,
  ringsExtent,
  type Extent,
  type Grid,
} from './geo';
import { isMailableHomeowner, parseParcel, type MailingAddress } from './parcels';
import { estimatePrice, type PriceConfig, DEFAULT_PRICE_CONFIG } from './pricing';
import { cleanReference, estimateShift, isHardscape, nirReference, scoreParcel, type NirInput, shiftRgb, simulateCleaned, type ScoreThresholds, type SurfaceStats, DEFAULT_THRESHOLDS } from './scoring';
import type { AerialArea } from './sources';

/** Largest scan side in ground meters (keeps one request well under the 4000 px service cap). */
export const MAX_SCAN_SIDE_METERS = 900;
export const SCAN_GROUND_RES = 0.3;
/** Prior flights can be offset locally by up to ~10 m from the current one. */
export const LOCAL_MAX_SHIFT_M = 12;
const LOCAL_MARGIN_M = 15;

/** Pixel window around a Mercator extent, padded by `marginM` ground meters. */
export function pixelWindow(grid: Grid, e: Extent, marginM: number) {
  const [, lat] = mercatorToLonLat([(e[0] + e[2]) / 2, (e[1] + e[3]) / 2]);
  const pad = marginM / Math.cos((lat * Math.PI) / 180);
  return {
    c0: Math.max(0, Math.floor((e[0] - pad - grid.extent[0]) / grid.res)),
    c1: Math.min(grid.width - 1, Math.ceil((e[2] + pad - grid.extent[0]) / grid.res)),
    r0: Math.max(0, Math.floor((grid.extent[3] - (e[3] + pad)) / grid.res)),
    r1: Math.min(grid.height - 1, Math.ceil((grid.extent[3] - (e[1] - pad)) / grid.res)),
  };
}

export type AerialLead = {
  id: string;
  areaId: string;
  parcelId: string;
  pin: string;
  ownerName: string;
  mailing: MailingAddress | null;
  situsAddress: string;
  ownerOccupied: boolean;
  centroid: [number, number];
  driveway: SurfaceStats;
  roof: SurfaceStats | null;
  stainScore: number;
  flagged: boolean;
  reasons: string[];
  priceDollars: number;
  /** Mercator crop used for card art. */
  cropExtent: Extent;
  refs: { now: number; prior: number };
  /** Tile NIR references used for shadow rejection (absent when NIR was unavailable). */
  nirRefs?: { refNow: number; refPrior: number };
  imagery: { current: string; prior: string };
};

export type ScanOptions = {
  area: AerialArea;
  /** [west, south, east, north] in degrees. */
  bbox: [number, number, number, number];
  thresholds?: Partial<ScoreThresholds>;
  price?: PriceConfig;
  /** Include parcels that are not mailable homeowners (for debugging). Default false. */
  includeNonMailable?: boolean;
};

export type ScanContext = {
  grid: Grid;
  now: Uint8Array;
  prior: Uint8Array;
  masks: Map<string, Uint8Array>;
};

export type ScanResult = {
  areaId: string;
  bbox: [number, number, number, number];
  scannedParcels: number;
  mailableParcels: number;
  flaggedCount: number;
  thresholds: ScoreThresholds;
  price: PriceConfig;
  imagery: { current: string; prior: string };
  refs: { now: number; prior: number };
  /** Pixel shift applied to the prior flight to register it to the current one. */
  priorShiftPx: { dx: number; dy: number };
  leads: AerialLead[];
};

export function validateBbox(bbox: unknown): [number, number, number, number] {
  if (!Array.isArray(bbox) || bbox.length !== 4 || bbox.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new Error('bbox must be [west, south, east, north] in degrees.');
  }
  const [w, s, e, n] = bbox as number[];
  if (!(w < e && s < n) || w < -180 || e > 180 || s < -85 || n > 85) throw new Error('bbox is out of range.');
  const { widthM, heightM } = extentGroundSize(bboxToMercatorExtent([w, s, e, n]));
  if (widthM > MAX_SCAN_SIDE_METERS || heightM > MAX_SCAN_SIDE_METERS) {
    throw new Error(`Scan one neighborhood at a time: each side must be under ${MAX_SCAN_SIDE_METERS} m (this one is ${Math.round(widthM)} x ${Math.round(heightM)} m).`);
  }
  return [w, s, e, n];
}

/** Shift a single-channel band (same rules as shiftRgb). */
export function shiftBand(band: Uint8Array, width: number, height: number, dx: number, dy: number, window?: { c0: number; r0: number; c1: number; r1: number }): Uint8Array {
  if (!dx && !dy) return band;
  const rgb = new Uint8Array(band.length * 3);
  for (let i = 0; i < band.length; i++) rgb[i * 3] = band[i];
  const shifted = shiftRgb(rgb, width, height, dx, dy, window);
  const out = new Uint8Array(band.length);
  for (let i = 0; i < band.length; i++) out[i] = shifted[i * 3];
  return out;
}

/** Mercator bounds of the set pixels in a mask, or null when empty. */
export function maskExtent(grid: Grid, mask: Uint8Array): Extent | null {
  let c0 = Infinity, r0 = Infinity, c1 = -Infinity, r1 = -Infinity;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const c = i % grid.width;
    const r = (i - c) / grid.width;
    if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r;
  }
  if (!Number.isFinite(c0)) return null;
  return [grid.extent[0] + c0 * grid.res, grid.extent[3] - (r1 + 1) * grid.res, grid.extent[0] + (c1 + 1) * grid.res, grid.extent[3] - r0 * grid.res];
}

export function unionExtent(a: Extent | null, b: Extent | null): Extent | null {
  if (!a) return b;
  if (!b) return a;
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

/** Card-art crop: the driveway + house padded to the postcard aspect ratio, at least 50 m wide. */
export function cropExtentFor(parcel: Extent, aspect = 1875 / 1275, minWidthGroundM = 50): Extent {
  const cx = (parcel[0] + parcel[2]) / 2;
  const cy = (parcel[1] + parcel[3]) / 2;
  const [, lat] = mercatorToLonLat([cx, cy]);
  const k = Math.cos((lat * Math.PI) / 180);
  let w = (parcel[2] - parcel[0]) * 1.25;
  let h = (parcel[3] - parcel[1]) * 1.25;
  w = Math.max(w, minWidthGroundM / k);
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
}

function buildingIndex(buildings: Feature[], pinField: string) {
  const byPin = new Map<string, Feature[]>();
  for (const b of buildings) {
    const raw = b.attributes[pinField];
    const pin = raw === null || raw === undefined ? '' : String(Math.round(Number(raw)));
    if (!pin) continue;
    const list = byPin.get(pin) ?? [];
    list.push(b);
    byPin.set(pin, list);
  }
  return byPin;
}

export async function scanAreaWithPixels(options: ScanOptions): Promise<{ result: ScanResult; context: ScanContext }> {
  const { area } = options;
  const bbox = validateBbox(options.bbox);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds ?? {}) };
  const price = options.price ?? DEFAULT_PRICE_CONFIG;
  const extent = bboxToMercatorExtent(bbox);
  const grid = makeGrid(extent, SCAN_GROUND_RES);

  const [nowImg, priorImg, nirNowRaw, nirPriorRaw, parcels, buildings] = await Promise.all([
    fetchGridRgb(area.current, grid),
    fetchGridRgb(area.prior, grid),
    area.current.nirBand !== undefined ? fetchGridBand(area.current, grid, area.current.nirBand).catch(() => null) : Promise.resolve(null),
    area.prior.nirBand !== undefined ? fetchGridBand(area.prior, grid, area.prior.nirBand).catch(() => null) : Promise.resolve(null),
    queryPolygons(area.parcels.featureLayer, extent),
    area.buildings ? queryPolygons(area.buildings.featureLayer, extent, { outFields: [area.buildings.pinField] }) : Promise.resolve([]),
  ]);

  const pixelCount = grid.width * grid.height;
  // Register the prior flight onto the current one (NAIP years can be several meters apart).
  const shift = estimateShift(nowImg.rgb, priorImg.rgb, grid.width, grid.height, 50);
  priorImg.rgb = shiftRgb(priorImg.rgb, grid.width, grid.height, shift.dx, shift.dy);
  const nirPriorShifted = nirPriorRaw ? shiftBand(nirPriorRaw, grid.width, grid.height, shift.dx, shift.dy) : null;
  const refs = { now: cleanReference(nowImg.rgb, pixelCount), prior: cleanReference(priorImg.rgb, pixelCount) };
  const nirRefs = nirNowRaw && nirPriorShifted
    ? { refNow: nirReference(nowImg.rgb, nirNowRaw, pixelCount), refPrior: nirReference(priorImg.rgb, nirPriorShifted, pixelCount) }
    : null;
  const allBuildings = rasterizeRings(grid, buildings.map((b) => b.rings));
  const allBuildingsDilated = dilate(allBuildings, grid.width, grid.height, 2);
  const byPin = area.buildings ? buildingIndex(buildings, area.buildings.pinField) : new Map<string, Feature[]>();

  const leads: AerialLead[] = [];
  const masks = new Map<string, Uint8Array>();
  let mailableParcels = 0;
  const imagery = { current: area.current.label, prior: area.prior.label };

  for (const parcel of parcels) {
    const outer = parcel.rings[0];
    if (!outer?.length) continue;
    const centroid = ringCentroid(outer);
    if (!pointInExtent(centroid, extent)) continue;
    const record = parseParcel(area, parcel.attributes);
    const ownerRaw = String(parcel.attributes[area.parcels.fields.owner] ?? '');
    const mailable = isMailableHomeowner(record, ownerRaw);
    if (mailable) mailableParcels += 1;
    if (!mailable && !options.includeNonMailable) continue;

    const parcelMask = rasterizeRings(grid, [parcel.rings]);
    // Local registration: ortho errors differ across a tile, so re-align the prior flight around this parcel.
    const win = pixelWindow(grid, ringsExtent(parcel.rings), LOCAL_MARGIN_M);
    const local = estimateShift(nowImg.rgb, priorImg.rgb, grid.width, grid.height, Math.round(LOCAL_MAX_SHIFT_M / SCAN_GROUND_RES), win);
    const priorLocal = local.error < Infinity ? shiftRgb(priorImg.rgb, grid.width, grid.height, local.dx, local.dy, win) : priorImg.rgb;
    const nir: NirInput | undefined = nirRefs && nirNowRaw && nirPriorShifted
      ? { now: nirNowRaw, prior: local.error < Infinity ? shiftBand(nirPriorShifted, grid.width, grid.height, local.dx, local.dy, win) : nirPriorShifted, ...nirRefs }
      : undefined;
    const roofOwn = byPin.get(record.pin);
    const roofMask = roofOwn?.length ? rasterizeRings(grid, roofOwn.map((b) => b.rings)) : undefined;
    if (roofMask) for (let i = 0; i < roofMask.length; i++) roofMask[i] = roofMask[i] & parcelMask[i];

    const score = scoreParcel({
      now: nowImg.rgb,
      prior: priorLocal,
      width: grid.width,
      height: grid.height,
      parcelMask,
      buildingMask: allBuildingsDilated,
      roofMask,
      refs,
      sqftPerPixel: grid.sqftPerPixel,
      thresholds,
      nir,
    });
    const id = `${area.id}:${record.parcelId || record.pin}`;
    masks.set(id, score.mask);
    leads.push({
      id,
      areaId: area.id,
      parcelId: record.parcelId,
      pin: record.pin,
      ownerName: record.ownerName,
      mailing: record.mailing,
      situsAddress: record.situsAddress,
      ownerOccupied: record.ownerOccupied,
      centroid: mercatorToLonLat(centroid),
      driveway: score.driveway,
      roof: score.roof,
      stainScore: score.stainScore,
      flagged: score.flagged && mailable,
      reasons: mailable ? score.reasons : [...score.reasons, 'not a mailable homeowner record'],
      priceDollars: estimatePrice(score.driveway.sqft, price),
      cropExtent: cropExtentFor(
        unionExtent(maskExtent(grid, score.mask), roofOwn?.length ? ringsExtent(roofOwn.flatMap((b) => b.rings)) : null) ?? ringsExtent(parcel.rings),
      ),
      refs,
      nirRefs: nirRefs ?? undefined,
      imagery,
    });
  }

  leads.sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.driveway.darkerPct + b.stainScore - (a.driveway.darkerPct + a.stainScore));
  return {
    result: {
      areaId: area.id,
      bbox,
      scannedParcels: parcels.length,
      mailableParcels,
      flaggedCount: leads.filter((l) => l.flagged).length,
      thresholds,
      price,
      imagery,
      refs,
      priorShiftPx: { dx: shift.dx, dy: shift.dy },
      leads,
    },
    context: { grid, now: nowImg.rgb, prior: priorImg.rgb, masks },
  };
}

export async function scanArea(options: ScanOptions): Promise<ScanResult> {
  return (await scanAreaWithPixels(options)).result;
}

export type LeadImages = {
  /** Current (dirty) aerial crop, JPEG. */
  current: Buffer;
  /** Prior-flight crop, JPEG. */
  prior: Buffer;
  /** Free simulated "cleaned" crop, JPEG (no AI). */
  cleaned: Buffer;
  /** Driveway mask as a PNG (white = driveway) for an image-model edit. */
  mask: Buffer;
  width: number;
  height: number;
};

/**
 * Card art for one lead, re-fetched for just its crop so it works from a
 * stored lead record (no tile buffers needed).
 */
export async function renderLeadImages(area: AerialArea, lead: AerialLead, outWidth = 1200): Promise<LeadImages> {
  const sharp = (await import('sharp')).default;
  const crop = lead.cropExtent;
  const [, lat] = mercatorToLonLat([(crop[0] + crop[2]) / 2, (crop[1] + crop[3]) / 2]);
  const k = Math.cos((lat * Math.PI) / 180);
  // Fetch a margin around the crop so the prior flight can be registered, then cut the crop back out.
  const pad = (LOCAL_MAX_SHIFT_M + 3) / k;
  const fetchExtent: Extent = [crop[0] - pad, crop[1] - pad, crop[2] + pad, crop[3] + pad];
  const groundRes = 0.2;
  const grid = makeGrid(fetchExtent, groundRes);
  const [nowImg, priorImg, nirNow, nirPriorRaw, parcels, buildings] = await Promise.all([
    fetchGridRgb(area.current, grid),
    fetchGridRgb(area.prior, grid),
    lead.nirRefs && area.current.nirBand !== undefined ? fetchGridBand(area.current, grid, area.current.nirBand).catch(() => null) : Promise.resolve(null),
    lead.nirRefs && area.prior.nirBand !== undefined ? fetchGridBand(area.prior, grid, area.prior.nirBand).catch(() => null) : Promise.resolve(null),
    queryPolygons(area.parcels.featureLayer, crop, { where: `${area.parcels.fields.parcelId}='${lead.parcelId.replace(/'/g, "''")}'` }),
    area.buildings ? queryPolygons(area.buildings.featureLayer, fetchExtent, { outFields: [area.buildings.pinField] }) : Promise.resolve([]),
  ]);
  const win = pixelWindow(grid, crop, 0);
  const shift = estimateShift(nowImg.rgb, priorImg.rgb, grid.width, grid.height, Math.round(LOCAL_MAX_SHIFT_M / groundRes), win);
  const ok = shift.error < Infinity;
  if (ok) priorImg.rgb = shiftRgb(priorImg.rgb, grid.width, grid.height, shift.dx, shift.dy);
  const nirPrior = nirPriorRaw && ok ? shiftBand(nirPriorRaw, grid.width, grid.height, shift.dx, shift.dy) : nirPriorRaw;
  const nir: NirInput | undefined = lead.nirRefs && nirNow && nirPrior ? { now: nirNow, prior: nirPrior, ...lead.nirRefs } : undefined;
  const parcelMask = rasterizeRings(grid, parcels.map((p) => p.rings));
  const buildingMask = dilate(rasterizeRings(grid, buildings.map((b) => b.rings)), grid.width, grid.height, 3);
  const score = scoreParcel({
    now: nowImg.rgb,
    prior: priorImg.rgb,
    width: grid.width,
    height: grid.height,
    parcelMask,
    buildingMask,
    refs: lead.refs,
    sqftPerPixel: grid.sqftPerPixel,
    nir,
  });
  // Clean a slightly grown mask (paved, non-vegetation, outside buildings) so the preview covers the whole slab edge.
  const grown = dilate(score.mask, grid.width, grid.height, 2);
  for (let i = 0; i < grown.length; i++) {
    if (!grown[i]) continue;
    const r = nowImg.rgb[i * 3], g = nowImg.rgb[i * 3 + 1], b = nowImg.rgb[i * 3 + 2];
    if (!parcelMask[i] || buildingMask[i] || !isHardscape(r, g, b)) grown[i] = 0;
  }
  const cleanedRgb = simulateCleaned(nowImg.rgb, grown, grid.width, grid.height, lead.refs.now);
  const region = { left: win.c0, top: win.r0, width: win.c1 - win.c0 + 1, height: win.r1 - win.r0 + 1 };
  const outHeight = Math.round((outWidth * region.height) / region.width);
  const toJpeg = (rgb: Uint8Array) =>
    sharp(Buffer.from(rgb), { raw: { width: grid.width, height: grid.height, channels: 3 } })
      .extract(region)
      .resize(outWidth, outHeight, { kernel: 'lanczos3' })
      .sharpen({ sigma: 0.8 })
      .jpeg({ quality: 88 })
      .toBuffer();
  const maskRgb = new Uint8Array(grid.width * grid.height);
  for (let i = 0; i < maskRgb.length; i++) maskRgb[i] = score.mask[i] ? 255 : 0;
  const [current, prior, cleaned, mask] = await Promise.all([
    toJpeg(nowImg.rgb),
    toJpeg(priorImg.rgb),
    toJpeg(cleanedRgb),
    sharp(Buffer.from(maskRgb), { raw: { width: grid.width, height: grid.height, channels: 1 } })
      .extract(region)
      .resize(outWidth, outHeight, { kernel: 'nearest' })
      .png()
      .toBuffer(),
  ]);
  return { current, prior, cleaned, mask, width: outWidth, height: outHeight };
}
