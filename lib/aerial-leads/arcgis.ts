/**
 * Minimal ArcGIS REST client for the free public services in sources.ts.
 * Server only. Only hosts listed in sources.ts can be fetched.
 */

import { allowedSourceHosts, type ImagerySource } from './sources';
import type { Extent, Grid, Rings } from './geo';

const TIMEOUT_MS = 45_000;

function assertAllowed(url: string) {
  const host = new URL(url).host;
  if (!allowedSourceHosts().has(host)) throw new Error(`Refusing to fetch from ${host}: not an allowed public data source.`);
}

async function fetchOnce(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: 'error' });
    if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status}`);
    // Read the body inside the timeout so a dropped connection is retried too.
    const body = await response.arrayBuffer();
    return new Response(body, { status: response.status, headers: response.headers });
  } finally {
    clearTimeout(timer);
  }
}

/** Public GIS servers drop connections now and then: retry twice with backoff. */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  assertAllowed(url);
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetchOnce(url, init);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Public data source request failed.');
}

export function exportImageUrl(source: ImagerySource, extent: Extent, width: number, height: number, format: 'jpg' | 'png' = 'jpg'): string {
  const params = new URLSearchParams({
    bbox: extent.map((v) => v.toFixed(2)).join(','),
    bboxSR: '3857',
    imageSR: '3857',
    size: `${width},${height}`,
    format,
    interpolation: 'RSP_BilinearInterpolation',
    f: 'image',
  });
  if (source.bandIds) params.set('bandIds', source.bandIds);
  return `${source.imageServer}/exportImage?${params.toString()}`;
}

/** Fetch an exportImage as encoded bytes (JPEG/PNG). */
export async function fetchImageBytes(source: ImagerySource, extent: Extent, width: number, height: number): Promise<Buffer> {
  const response = await fetchWithTimeout(exportImageUrl(source, extent, width, height));
  const type = response.headers.get('content-type') || '';
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!type.startsWith('image/')) throw new Error(`Imagery service returned ${type || 'no content type'}: ${bytes.subarray(0, 200).toString('utf8')}`);
  return bytes;
}

/** Fetch imagery decoded to raw RGB on exactly the grid's size. */
export async function fetchGridRgb(source: ImagerySource, grid: Grid): Promise<{ rgb: Uint8Array; encoded: Buffer }> {
  const sharp = (await import('sharp')).default;
  const encoded = await fetchImageBytes(source, grid.extent, grid.width, grid.height);
  const { data } = await sharp(encoded)
    .removeAlpha()
    .resize(grid.width, grid.height, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { rgb: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), encoded };
}

/** Fetch one band (e.g. NAIP near-infrared = band 3) as a single-channel buffer on the grid. */
export async function fetchGridBand(source: ImagerySource, grid: Grid, band: number): Promise<Uint8Array> {
  const sharp = (await import('sharp')).default;
  const encoded = await fetchImageBytes({ ...source, bandIds: String(band) }, grid.extent, grid.width, grid.height);
  const data = await sharp(encoded).resize(grid.width, grid.height, { fit: 'fill' }).greyscale().raw().toBuffer();
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export type Feature = { attributes: Record<string, unknown>; rings: Rings };

/** Query polygons intersecting a Mercator extent. Pages through results. */
export async function queryPolygons(
  layerUrl: string,
  extent: Extent,
  options: { where?: string; outFields?: string[]; maxFeatures?: number } = {},
): Promise<Feature[]> {
  const out: Feature[] = [];
  const pageSize = 1000;
  const max = options.maxFeatures ?? 3000;
  for (let offset = 0; offset < max; offset += pageSize) {
    const params = new URLSearchParams({
      where: options.where || '1=1',
      geometry: extent.join(','),
      geometryType: 'esriGeometryEnvelope',
      inSR: '3857',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: (options.outFields ?? ['*']).join(','),
      returnGeometry: 'true',
      outSR: '3857',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: 'json',
    });
    const response = await fetchWithTimeout(`${layerUrl}/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const json = (await response.json()) as {
      error?: { message?: string };
      features?: Array<{ attributes: Record<string, unknown>; geometry?: { rings?: Rings } }>;
      exceededTransferLimit?: boolean;
    };
    if (json.error) throw new Error(`Parcel service error: ${json.error.message ?? 'unknown'}`);
    for (const f of json.features ?? []) {
      if (f.geometry?.rings?.length) out.push({ attributes: f.attributes, rings: f.geometry.rings });
    }
    if (!json.exceededTransferLimit || (json.features ?? []).length < pageSize) break;
  }
  return out;
}
