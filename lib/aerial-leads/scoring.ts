/**
 * Driveway / roof staining score from two co-registered aerial images.
 *
 * Pure pixel math, no network and no paid model. Both images must be RGB
 * (3 bytes per pixel) on the same grid. Brightness is normalized per image
 * against that image's own "clean concrete" reference (a high percentile of
 * hardscape brightness across the whole tile), so a sunnier or hazier flight
 * year does not read as staining.
 *
 * Known limits (why a human approves every card): tree shadows and canopy
 * that moved between flights, wet pavement, parked cars, and asphalt drives
 * (dark in both years, so they rarely pass the "darker than before" rule).
 */

export type Rgb = Uint8Array; // length = width * height * 3

export type ScoreThresholds = {
  /** Flag when at least this % of the driveway reads as stained. Default 30. */
  minStainedPct: number;
  /** ...and the driveway is at least this % darker than in the prior flight. Default 40. */
  minDarkerPct: number;
  /** Ignore surfaces smaller than this (sq ft). Default 150. */
  minDrivewaySqft: number;
  /** Ignore surfaces larger than this (commercial lots). Default 4000. */
  maxDrivewaySqft: number;
  /** A pixel is "stained" below this fraction of the clean-concrete reference. Default 0.72. */
  stainedBelow: number;
};

export const DEFAULT_THRESHOLDS: ScoreThresholds = {
  minStainedPct: 30,
  minDarkerPct: 40,
  minDrivewaySqft: 150,
  maxDrivewaySqft: 4000,
  stainedBelow: 0.72,
};

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isVegetation(r: number, g: number, b: number): boolean {
  return 2 * g - r - b >= 14;
}

/** Concrete, pavers, roofing, asphalt: low saturation, not green, not pool blue. */
export function isHardscape(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > 48) return false;
  if (isVegetation(r, g, b)) return false;
  if (b > r + 18 && b > g + 6) return false; // pools / water
  return luminance(r, g, b) >= 40;
}

function percentile(values: number[], p: number): number {
  if (!values.length) return NaN;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

/** Clean-concrete reference brightness for one image (P92 of hardscape luminance, sampled). */
export function cleanReference(rgb: Rgb, pixelCount: number, step = 3): number {
  const values: number[] = [];
  for (let i = 0; i < pixelCount; i += step) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    if (isHardscape(r, g, b)) values.push(luminance(r, g, b));
  }
  if (values.length < 50) return 200;
  return Math.max(120, percentile(values, 92));
}

/** Near-infrared reference: P92 of NIR over hardscape pixels (sunlit concrete/roofs). */
export function nirReference(rgb: Rgb, nir: Uint8Array, pixelCount: number, step = 3): number {
  const values: number[] = [];
  for (let i = 0; i < pixelCount; i += step) {
    if (isHardscape(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2])) values.push(nir[i]);
  }
  if (values.length < 50) return 180;
  return Math.max(60, percentile(values, 92));
}

/** Shadowed pavement reflects little NIR; sunlit (even dirty) concrete still does. */
export const NIR_SHADOW_BELOW = 0.5;

export type NirInput = { now: Uint8Array; prior: Uint8Array; refNow: number; refPrior: number };

/** Keep only the largest 4-connected component of a mask. */
export function largestComponent(mask: Uint8Array, width: number, height: number): Uint8Array {
  const label = new Int32Array(mask.length);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start]) continue;
    next += 1;
    let size = 0;
    stack.push(start);
    label[start] = next;
    while (stack.length) {
      const i = stack.pop() as number;
      size += 1;
      const x = i % width;
      const y = (i - x) / width;
      const neighbors = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && !label[n]) { label[n] = next; stack.push(n); }
      }
    }
    if (size > bestSize) { bestSize = size; best = next; }
  }
  const out = new Uint8Array(mask.length);
  if (!best) return out;
  for (let i = 0; i < mask.length; i++) if (label[i] === best) out[i] = 1;
  return out;
}

export type SurfaceStats = {
  pixels: number;
  sqft: number;
  /** Median brightness / clean reference, current flight. */
  normNow: number;
  normPrior: number;
  /** % of pixels below `stainedBelow` x reference, current flight. 0-100. */
  stainedPct: number;
  priorStainedPct: number;
  /** % darker than the prior flight (median normalized brightness). Negative = brighter now. */
  darkerPct: number;
};

export function surfaceStats(
  now: Rgb,
  prior: Rgb,
  mask: Uint8Array,
  refs: { now: number; prior: number },
  sqftPerPixel: number,
  stainedBelow = DEFAULT_THRESHOLDS.stainedBelow,
): SurfaceStats {
  const nowVals: number[] = [];
  const priorVals: number[] = [];
  let stainedNow = 0;
  let stainedPrior = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const ln = luminance(now[i * 3], now[i * 3 + 1], now[i * 3 + 2]) / refs.now;
    const lp = luminance(prior[i * 3], prior[i * 3 + 1], prior[i * 3 + 2]) / refs.prior;
    nowVals.push(ln);
    priorVals.push(lp);
    if (ln < stainedBelow) stainedNow += 1;
    if (lp < stainedBelow) stainedPrior += 1;
  }
  const pixels = nowVals.length;
  if (!pixels) {
    return { pixels: 0, sqft: 0, normNow: 0, normPrior: 0, stainedPct: 0, priorStainedPct: 0, darkerPct: 0 };
  }
  const normNow = percentile(nowVals, 50);
  const normPrior = percentile(priorVals, 50);
  return {
    pixels,
    sqft: Math.round(pixels * sqftPerPixel),
    normNow: round(normNow, 3),
    normPrior: round(normPrior, 3),
    stainedPct: round((stainedNow / pixels) * 100, 1),
    priorStainedPct: round((stainedPrior / pixels) * 100, 1),
    darkerPct: normPrior > 0 ? round(((normPrior - normNow) / normPrior) * 100, 1) : 0,
  };
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Driveway candidate inside one parcel: hardscape in either flight, not
 * vegetation in either flight, outside (dilated) building footprints,
 * largest connected piece.
 */
/** Below this fraction of the clean reference a pixel is treated as shadow, not stain. */
export const SHADOW_BELOW = 0.36;
/** A driveway pixel must have looked like concrete (at least this bright) in one of the flights. */
export const CONCRETE_ABOVE = 0.6;

export function drivewayMask(
  now: Rgb,
  prior: Rgb,
  parcelMask: Uint8Array,
  buildingMask: Uint8Array,
  width: number,
  height: number,
  refs: { now: number; prior: number } = { now: 255, prior: 255 },
  nir?: NirInput,
): Uint8Array {
  const candidate = new Uint8Array(parcelMask.length);
  for (let i = 0; i < parcelMask.length; i++) {
    if (!parcelMask[i] || buildingMask[i]) continue;
    const rn = now[i * 3], gn = now[i * 3 + 1], bn = now[i * 3 + 2];
    const rp = prior[i * 3], gp = prior[i * 3 + 1], bp = prior[i * 3 + 2];
    // Paved in both flights: never vegetation, low saturation in both.
    if (!isHardscape(rp, gp, bp) || !isHardscape(rn, gn, bn)) continue;
    const ln = luminance(rn, gn, bn) / refs.now;
    const lp = luminance(rp, gp, bp) / refs.prior;
    // Shadows move with the sun between flights; skip anything shadow-dark in either.
    if (ln < SHADOW_BELOW || lp < SHADOW_BELOW) continue;
    if (nir && (nir.now[i] / nir.refNow < NIR_SHADOW_BELOW || nir.prior[i] / nir.refPrior < NIR_SHADOW_BELOW)) continue;
    // Concrete-bright in at least one flight (excludes asphalt and dark roofing).
    if (Math.max(ln, lp) < CONCRETE_ABOVE) continue;
    candidate[i] = 1;
  }
  // Light opening: drop 1-px speckle so the largest piece is a real slab.
  return largestComponent(erodeThenDilate(candidate, width, height), width, height);
}

function erodeThenDilate(mask: Uint8Array, width: number, height: number): Uint8Array {
  const eroded = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    if (mask[i] && mask[i - 1] && mask[i + 1] && mask[i - width] && mask[i + width]) eroded[i] = 1;
  }
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    if (eroded[i] || eroded[i - 1] || eroded[i + 1] || eroded[i - width] || eroded[i + width]) out[i] = mask[i];
  }
  return out;
}

export type ParcelScore = {
  driveway: SurfaceStats;
  roof: SurfaceStats | null;
  /** 0-100 headline score shown in the dashboard (driveway % stained). */
  stainScore: number;
  flagged: boolean;
  reasons: string[];
};

export function scoreParcel(input: {
  now: Rgb;
  prior: Rgb;
  width: number;
  height: number;
  parcelMask: Uint8Array;
  buildingMask: Uint8Array;
  /** Building pixels inside this parcel (undilated) for the roof score. */
  roofMask?: Uint8Array;
  refs: { now: number; prior: number };
  sqftPerPixel: number;
  thresholds?: Partial<ScoreThresholds>;
  /** Optional NIR bands; when present, shadowed pixels are excluded from the driveway. */
  nir?: NirInput;
}): ParcelScore & { mask: Uint8Array } {
  const t = { ...DEFAULT_THRESHOLDS, ...(input.thresholds ?? {}) };
  const mask = drivewayMask(input.now, input.prior, input.parcelMask, input.buildingMask, input.width, input.height, input.refs, input.nir);
  const driveway = surfaceStats(input.now, input.prior, mask, input.refs, input.sqftPerPixel, t.stainedBelow);
  const roof = input.roofMask
    ? surfaceStats(input.now, input.prior, input.roofMask, input.refs, input.sqftPerPixel, t.stainedBelow)
    : null;
  const reasons: string[] = [];
  if (driveway.sqft < t.minDrivewaySqft) reasons.push(`driveway under ${t.minDrivewaySqft} sq ft`);
  if (driveway.sqft > t.maxDrivewaySqft) reasons.push(`paved area over ${t.maxDrivewaySqft} sq ft (likely commercial)`);
  if (driveway.stainedPct < t.minStainedPct) reasons.push(`${driveway.stainedPct}% stained (< ${t.minStainedPct}%)`);
  if (driveway.darkerPct < t.minDarkerPct) reasons.push(`${driveway.darkerPct}% darker than ${'prior'} (< ${t.minDarkerPct}%)`);
  return { driveway, roof, stainScore: Math.round(driveway.stainedPct), flagged: reasons.length === 0, reasons, mask };
}

/**
 * Free "cleaned" preview: lift masked pixels to clean-concrete brightness and
 * pull them toward neutral gray, keeping texture. Used when no image model
 * key is configured. Returns a new RGB buffer.
 */
export function simulateCleaned(rgb: Rgb, mask: Uint8Array, width: number, height: number, reference: number): Rgb {
  const out = rgb.slice();
  // Feather: weight 1 inside, 0.5 on a 1-px border.
  const weight = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i++) if (mask[i]) weight[i] = 1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (mask[i]) continue;
    if ((x > 0 && mask[i - 1]) || (x < width - 1 && mask[i + 1]) || (y > 0 && mask[i - width]) || (y < height - 1 && mask[i + width])) weight[i] = 0.5;
  }
  const target = reference * 0.94;
  for (let i = 0; i < mask.length; i++) {
    const w = weight[i];
    if (!w) continue;
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    const l = Math.max(1, luminance(r, g, b));
    // Keep 35% of local texture so it still looks like the same concrete.
    const lift = (target + (l - target) * 0.35) / l;
    const gray = l * lift;
    for (let c = 0; c < 3; c++) {
      const v = [r, g, b][c] * lift;
      const neutral = v * 0.4 + gray * 0.6;
      const mixed = rgb[i * 3 + c] * (1 - w) + neutral * w;
      out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(mixed)));
    }
  }
  return out;
}

/**
 * Flights from different years are often a few meters apart. Find the integer
 * (dx, dy) that best aligns `moving` onto `fixed` by minimizing the mean
 * absolute luminance difference (coarse-to-fine search). Returns pixel shift
 * to apply to `moving`.
 */
export type PixelWindow = { c0: number; r0: number; c1: number; r1: number };

export function estimateShift(
  fixed: Rgb,
  moving: Rgb,
  width: number,
  height: number,
  maxShift = 30,
  window: PixelWindow = { c0: 0, r0: 0, c1: width - 1, r1: height - 1 },
): { dx: number; dy: number; error: number } {
  const c0 = Math.max(maxShift, window.c0);
  const r0 = Math.max(maxShift, window.r0);
  const c1 = Math.min(width - 1 - maxShift, window.c1);
  const r1 = Math.min(height - 1 - maxShift, window.r1);
  if (c1 - c0 < 8 || r1 - r0 < 8) return { dx: 0, dy: 0, error: Infinity };
  // Sample on a sparse lattice so cost is independent of window size.
  const step = Math.max(1, Math.floor(Math.sqrt(((c1 - c0) * (r1 - r0)) / 6000)));
  const lumAt = (rgb: Rgb, i: number) => luminance(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
  // Per-image mean/spread over the window so flight-to-flight brightness does not bias the match.
  const stats = (rgb: Rgb, dx: number, dy: number) => {
    let sum = 0, sq = 0, n = 0;
    for (let y = r0; y <= r1; y += step) for (let x = c0; x <= c1; x += step) {
      const v = lumAt(rgb, (y - dy) * width + (x - dx)); sum += v; sq += v * v; n += 1;
    }
    const mean = sum / n;
    return { mean, sd: Math.sqrt(Math.max(1e-6, sq / n - mean * mean)) };
  };
  const fs = stats(fixed, 0, 0);
  const ms = stats(moving, 0, 0);
  const cost = (dx: number, dy: number) => {
    let sum = 0, n = 0;
    for (let y = r0; y <= r1; y += step) for (let x = c0; x <= c1; x += step) {
      const a = (lumAt(fixed, y * width + x) - fs.mean) / fs.sd;
      const b = (lumAt(moving, (y - dy) * width + (x - dx)) - ms.mean) / ms.sd;
      sum += Math.abs(a - b); n += 1;
    }
    return sum / n;
  };
  const coarse = Math.max(1, Math.round(maxShift / 15));
  let best = { dx: 0, dy: 0, error: cost(0, 0) };
  for (let dy = -maxShift; dy <= maxShift; dy += coarse) for (let dx = -maxShift; dx <= maxShift; dx += coarse) {
    const e = cost(dx, dy);
    if (e < best.error) best = { dx, dy, error: e };
  }
  const seed = best;
  for (let dy = seed.dy - coarse; dy <= seed.dy + coarse; dy++) for (let dx = seed.dx - coarse; dx <= seed.dx + coarse; dx++) {
    if (Math.abs(dx) > maxShift || Math.abs(dy) > maxShift) continue;
    const e = cost(dx, dy);
    if (e < best.error) best = { dx, dy, error: e };
  }
  return best;
}

/** Translate an RGB image by (dx, dy) (optionally only inside a window); uncovered pixels copy the nearest edge. */
export function shiftRgb(rgb: Rgb, width: number, height: number, dx: number, dy: number, window?: PixelWindow): Rgb {
  if (!dx && !dy) return rgb;
  const out = window ? rgb.slice() : new Uint8Array(rgb.length);
  const y0 = window ? Math.max(0, window.r0) : 0;
  const y1 = window ? Math.min(height - 1, window.r1) : height - 1;
  const x0 = window ? Math.max(0, window.c0) : 0;
  const x1 = window ? Math.min(width - 1, window.c1) : width - 1;
  for (let y = y0; y <= y1; y++) {
    const sy = Math.min(height - 1, Math.max(0, y - dy));
    for (let x = x0; x <= x1; x++) {
      const sx = Math.min(width - 1, Math.max(0, x - dx));
      const si = (sy * width + sx) * 3;
      const di = (y * width + x) * 3;
      out[di] = rgb[si]; out[di + 1] = rgb[si + 1]; out[di + 2] = rgb[si + 2];
    }
  }
  return out;
}
