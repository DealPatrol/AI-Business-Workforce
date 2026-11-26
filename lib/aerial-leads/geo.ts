/** Small Web Mercator + raster helpers. Pure functions, no I/O. */

const R = 6378137;

export type Point = [number, number];
/** [xmin, ymin, xmax, ymax] */
export type Extent = [number, number, number, number];
/** Polygon as rings of [x, y]; first ring is outer, others holes (even-odd fill). */
export type Rings = Point[][];

export function lonLatToMercator([lon, lat]: Point): Point {
  const x = (lon * Math.PI * R) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return [x, y];
}

export function mercatorToLonLat([x, y]: Point): Point {
  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return [lon, lat];
}

/** Convert a lon/lat bbox [west, south, east, north] to a Mercator extent. */
export function bboxToMercatorExtent(bbox: [number, number, number, number]): Extent {
  const [x0, y0] = lonLatToMercator([bbox[0], bbox[1]]);
  const [x1, y1] = lonLatToMercator([bbox[2], bbox[3]]);
  return [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
}

/** Ground meters per Mercator meter at a latitude. */
export function groundScale(latDeg: number): number {
  return Math.cos((latDeg * Math.PI) / 180);
}

export const SQFT_PER_SQM = 10.7639;

/** Ground width/height of an extent in meters. */
export function extentGroundSize(extent: Extent): { widthM: number; heightM: number } {
  const [, lat] = mercatorToLonLat([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
  const k = groundScale(lat);
  return { widthM: (extent[2] - extent[0]) * k, heightM: (extent[3] - extent[1]) * k };
}

export type Grid = {
  extent: Extent;
  width: number;
  height: number;
  /** Mercator meters per pixel. */
  res: number;
  /** Ground square feet per pixel. */
  sqftPerPixel: number;
};

/** Build a pixel grid over a Mercator extent at roughly `groundRes` ground meters per pixel. */
export function makeGrid(extent: Extent, groundRes: number, maxSide = 4000): Grid {
  const [, lat] = mercatorToLonLat([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);
  const k = groundScale(lat);
  let res = groundRes / k;
  let width = Math.round((extent[2] - extent[0]) / res);
  let height = Math.round((extent[3] - extent[1]) / res);
  const scale = Math.max(width, height) / maxSide;
  if (scale > 1) {
    res *= scale;
    width = Math.round(width / scale);
    height = Math.round(height / scale);
  }
  const groundPx = res * k;
  return { extent, width, height, res, sqftPerPixel: groundPx * groundPx * SQFT_PER_SQM };
}

export function toPixel(grid: Grid, [x, y]: Point): Point {
  return [(x - grid.extent[0]) / grid.res, (grid.extent[3] - y) / grid.res];
}

/** Rasterize polygons (Mercator rings) into a 0/1 mask, sampling pixel centers (even-odd rule). */
export function rasterizeRings(grid: Grid, polygons: Rings[], mask = new Uint8Array(grid.width * grid.height)): Uint8Array {
  for (const rings of polygons) {
    const pixelRings = rings.map((ring) => ring.map((p) => toPixel(grid, p)));
    let minY = Infinity;
    let maxY = -Infinity;
    for (const ring of pixelRings) for (const [, py] of ring) { minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(grid.height - 1, Math.ceil(maxY));
    for (let row = y0; row <= y1; row++) {
      const cy = row + 0.5;
      const xs: number[] = [];
      for (const ring of pixelRings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i];
          const [xj, yj] = ring[j];
          if ((yi > cy) !== (yj > cy)) xs.push(xi + ((cy - yi) * (xj - xi)) / (yj - yi));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c0 = Math.max(0, Math.ceil(xs[k] - 0.5));
        const c1 = Math.min(grid.width - 1, Math.floor(xs[k + 1] - 0.5));
        for (let col = c0; col <= c1; col++) mask[row * grid.width + col] = 1;
      }
    }
  }
  return mask;
}

/** Grow a mask by `radius` pixels (square structuring element). */
export function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return mask.slice();
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < width) out[yy * width + xx] = 1;
        }
      }
    }
  }
  return out;
}

/** Signed-area centroid of the outer ring (Mercator). */
export function ringCentroid(ring: Point[]): Point {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  if (Math.abs(a) < 1e-9) return ring[0];
  return [cx / (3 * a), cy / (3 * a)];
}

export function ringsExtent(rings: Rings): Extent {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of rings) for (const [x, y] of ring) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}

export function pointInExtent([x, y]: Point, e: Extent): boolean {
  return x >= e[0] && x <= e[2] && y >= e[1] && y <= e[3];
}
