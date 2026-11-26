/** Validate dashboard input for a scan. Pure. */

import { validateBbox } from './pipeline';
import type { PostcardBusiness } from './postcard';
import { parsePriceConfig, type PriceConfig } from './pricing';
import { DEFAULT_THRESHOLDS, type ScoreThresholds } from './scoring';
import { getAerialArea, type AerialArea } from './sources';

export type ScanRequest = {
  area: AerialArea;
  bbox: [number, number, number, number];
  business: PostcardBusiness;
  price: PriceConfig;
  thresholds: ScoreThresholds;
};

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function parseBusiness(input: unknown): PostcardBusiness {
  const v = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = text(v.name, 60);
  const phone = text(v.phone, 30);
  const qrUrl = text(v.qrUrl, 300);
  const website = text(v.website, 80);
  const tagline = text(v.tagline, 70);
  if (!name) throw new Error('Business name is required.');
  if (!/^[+()\d\s.-]{7,30}$/.test(phone)) throw new Error('Enter the business phone number for the card.');
  let url: URL;
  try {
    url = new URL(qrUrl);
  } catch {
    throw new Error('QR link must be a full https:// URL.');
  }
  if (url.protocol !== 'https:') throw new Error('QR link must use https://.');
  return { name, phone, qrUrl: url.toString(), ...(website ? { website } : {}), ...(tagline ? { tagline } : {}) };
}

export function parseThresholds(input: unknown): ScoreThresholds {
  const v = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const pct = (x: unknown, fallback: number) => {
    const n = typeof x === 'string' ? Number(x) : typeof x === 'number' ? x : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback;
  };
  return {
    ...DEFAULT_THRESHOLDS,
    minStainedPct: pct(v.minStainedPct, DEFAULT_THRESHOLDS.minStainedPct),
    minDarkerPct: pct(v.minDarkerPct, DEFAULT_THRESHOLDS.minDarkerPct),
  };
}

export function parseScanRequest(body: Record<string, unknown>): ScanRequest {
  const area = getAerialArea(typeof body.areaId === 'string' ? body.areaId : null);
  if (!area) throw new Error('Pick a supported area (pilot: Cullman County, AL).');
  return {
    area,
    bbox: validateBbox(body.bbox),
    business: parseBusiness(body.business),
    price: parsePriceConfig((body.price ?? {}) as Record<string, unknown>),
    thresholds: parseThresholds(body.thresholds),
  };
}
