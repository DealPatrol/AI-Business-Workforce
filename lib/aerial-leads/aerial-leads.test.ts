import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bboxToMercatorExtent, makeGrid, rasterizeRings, type Rings } from '@/lib/aerial-leads/geo';
import { parseBusiness, parseScanRequest } from '@/lib/aerial-leads/input';
import { assertApproved, mailStatus, sendTestPostcard, toLobAddress } from '@/lib/aerial-leads/mail';
import { formatOwnerName, isEntityOwner, maskOwnerName, parseParcel } from '@/lib/aerial-leads/parcels';
import { cropExtentFor, validateBbox } from '@/lib/aerial-leads/pipeline';
import { BACK_ADDRESS_ZONE, postcardBackSvg, postcardFrontSvg, type PostcardInput } from '@/lib/aerial-leads/postcard';
import { estimatePrice, parsePriceConfig } from '@/lib/aerial-leads/pricing';
import { DEFAULT_THRESHOLDS, estimateShift, scoreParcel, shiftRgb, simulateCleaned } from '@/lib/aerial-leads/scoring';
import { CULLMAN_COUNTY_AL } from '@/lib/aerial-leads/sources';

const W = 60;
const H = 40;

function solid(rgb: [number, number, number], width = W, height = H): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) out.set(rgb, i * 3);
  return out;
}

function paint(img: Uint8Array, x0: number, y0: number, x1: number, y1: number, rgb: [number, number, number], width = W) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.set(rgb, (y * width + x) * 3);
}

function rectMask(x0: number, y0: number, x1: number, y1: number): Uint8Array {
  const m = new Uint8Array(W * H);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) m[y * W + x] = 1;
  return m;
}

const GRASS: [number, number, number] = [70, 130, 60];
const CLEAN: [number, number, number] = [215, 215, 210];
const DIRTY: [number, number, number] = [120, 118, 112];

describe('aerial leads geometry', () => {
  it('rasterizes a polygon and reports ground square feet per pixel', () => {
    const extent = bboxToMercatorExtent([-86.82, 34.16, -86.8195, 34.1604]);
    const grid = makeGrid(extent, 0.3);
    assert.ok(Math.abs(grid.sqftPerPixel - 0.3 * 0.3 * 10.7639) < 0.05);
    const [x0, y0, x1, y1] = extent;
    const rings: Rings = [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]];
    const mask = rasterizeRings(grid, [rings]);
    const filled = mask.reduce((n, v) => n + v, 0);
    assert.ok(filled > grid.width * grid.height * 0.95);
  });

  it('keeps postcard crops at the card aspect ratio', () => {
    const e = cropExtentFor([0, 0, 10, 40]);
    assert.ok(Math.abs((e[2] - e[0]) / (e[3] - e[1]) - 1875 / 1275) < 1e-6);
  });

  it('refuses scans larger than one neighborhood', () => {
    assert.throws(() => validateBbox([-86.9, 34.1, -86.8, 34.2]), /one neighborhood/);
    assert.deepEqual(validateBbox([-86.8199, 34.1613, -86.8129, 34.1669]), [-86.8199, 34.1613, -86.8129, 34.1669]);
  });
});

describe('aerial leads scoring', () => {
  const parcel = rectMask(0, 0, W, H);
  const noBuildings = new Uint8Array(W * H);
  const refs = { now: 215, prior: 215 };

  it('flags a driveway that was clean and is now stained', () => {
    const prior = solid(GRASS);
    paint(prior, 10, 10, 40, 25, CLEAN);
    const now = solid(GRASS);
    paint(now, 10, 10, 40, 25, DIRTY);
    const s = scoreParcel({ now, prior, width: W, height: H, parcelMask: parcel, buildingMask: noBuildings, refs, sqftPerPixel: 1 });
    // Speckle filtering trims the four corner pixels.
    assert.ok(s.driveway.sqft >= 30 * 15 - 4 && s.driveway.sqft <= 30 * 15);
    assert.equal(s.driveway.stainedPct, 100);
    assert.ok(s.driveway.darkerPct > 40);
    assert.equal(s.flagged, true);
  });

  it('does not flag a driveway that stayed clean', () => {
    const prior = solid(GRASS);
    paint(prior, 10, 10, 40, 25, CLEAN);
    const s = scoreParcel({ now: prior.slice(), prior, width: W, height: H, parcelMask: parcel, buildingMask: noBuildings, refs, sqftPerPixel: 1 });
    assert.equal(s.flagged, false);
    assert.equal(s.driveway.darkerPct, 0);
  });

  it('ignores tree shadow when near-infrared shows it is shade, not dirt', () => {
    const prior = solid(GRASS);
    paint(prior, 10, 10, 40, 25, CLEAN);
    const now = solid(GRASS);
    paint(now, 10, 10, 40, 25, DIRTY);
    const nirPrior = new Uint8Array(W * H).fill(200);
    const nirNow = new Uint8Array(W * H).fill(200);
    for (let y = 10; y < 25; y++) for (let x = 10; x < 40; x++) nirNow[y * W + x] = 40; // shade
    const s = scoreParcel({
      now, prior, width: W, height: H, parcelMask: parcel, buildingMask: noBuildings, refs, sqftPerPixel: 1,
      nir: { now: nirNow, prior: nirPrior, refNow: 200, refPrior: 200 },
    });
    assert.equal(s.flagged, false);
    assert.equal(s.driveway.pixels, 0);
  });

  it('skips building footprints and lawn', () => {
    const prior = solid(GRASS);
    paint(prior, 10, 10, 40, 25, CLEAN);
    const now = prior.slice();
    const building = rectMask(10, 10, 40, 25);
    const s = scoreParcel({ now, prior, width: W, height: H, parcelMask: parcel, buildingMask: building, refs, sqftPerPixel: 1 });
    assert.equal(s.driveway.pixels, 0);
  });

  it('honors configurable thresholds', () => {
    const prior = solid(GRASS);
    paint(prior, 10, 10, 40, 25, CLEAN);
    const now = solid(GRASS);
    paint(now, 10, 10, 40, 25, [150, 150, 146]);
    // Default rule is 30% stained / 15% darker; the reel's stricter 40% darker rule stays available per scan.
    assert.equal(DEFAULT_THRESHOLDS.minDarkerPct, 15);
    const strict = scoreParcel({ now, prior, width: W, height: H, parcelMask: parcel, buildingMask: noBuildings, refs, sqftPerPixel: 1, thresholds: { minDarkerPct: 40 } });
    assert.equal(strict.flagged, false);
    const loose = scoreParcel({ now, prior, width: W, height: H, parcelMask: parcel, buildingMask: noBuildings, refs, sqftPerPixel: 1 });
    assert.equal(loose.flagged, true);
  });

  it('recovers a known offset between flights', () => {
    const w = 120, h = 90;
    const a = solid(GRASS, w, h);
    paint(a, 30, 20, 60, 45, CLEAN, w);
    paint(a, 70, 50, 95, 80, [90, 90, 95], w);
    const b = shiftRgb(a, w, h, -4, 3);
    const shift = estimateShift(a, b, w, h, 10);
    assert.deepEqual([shift.dx, shift.dy], [4, -3]);
  });

  it('brightens only the masked driveway in the free preview', () => {
    const img = solid(DIRTY);
    const mask = rectMask(20, 10, 30, 20);
    const out = simulateCleaned(img, mask, W, H, 215);
    assert.ok(out[(15 * W + 25) * 3] > DIRTY[0] + 40);
    assert.equal(out[(2 * W + 2) * 3], DIRTY[0]);
  });
});

describe('aerial leads pricing and parcels', () => {
  it('prices sq ft x rate, rounded to $5, with an optional floor', () => {
    assert.equal(estimatePrice(550), 165);
    assert.equal(estimatePrice(406), 120);
    assert.equal(estimatePrice(100, { ratePerSqft: 0.3, minimumPrice: 99, roundTo: 5 }), 99);
    assert.deepEqual(parsePriceConfig({ ratePerSqft: '0.25' }).ratePerSqft, 0.25);
    assert.deepEqual(parsePriceConfig({ ratePerSqft: 'abc' }).ratePerSqft, 0.3);
  });

  it('reads Cullman parcel attributes into a mailing address', () => {
    const record = parseParcel(CULLMAN_COUNTY_AL, {
      PARCELID: '1702094003005000', PIN: 12265, Owner: 'DOE, JANE Q', MailAdd1: '1316 LORING ST NW', MailCity: 'CULLMAN',
      MailState: 'AL', MailZip1: '35055', MailZip2: '1234', SitusAddNumber: 1316, SitusAddName: 'LORING ST NW', ImpDescrip: 'Res/Com, ',
    });
    assert.equal(record.ownerName, 'Jane Q Doe');
    assert.equal(record.mailing?.line1, '1316 Loring St NW');
    assert.equal(record.mailing?.zip, '35055-1234');
    assert.equal(record.situsAddress, '1316 Loring St NW, Cullman, AL');
    assert.equal(record.ownerOccupied, true);
    assert.equal(maskOwnerName(record.ownerName), 'J. Doe');
    assert.equal(formatOwnerName('SMITH JOHN (LE) AND SMITH JR'), 'Smith John');
    assert.equal(isEntityOwner('ACME HOLDINGS LLC'), true);
  });
});

describe('aerial leads input', () => {
  it('requires a business name, phone and https QR link', () => {
    assert.throws(() => parseBusiness({ name: 'A', phone: '256', qrUrl: 'https://x.com' }), /phone/);
    assert.throws(() => parseBusiness({ name: 'A', phone: '(256) 555-0142', qrUrl: 'http://x.com' }), /https/);
    const b = parseBusiness({ name: 'Cullman Pressure Pros', phone: '(256) 555-0142', qrUrl: 'https://example.com/book' });
    assert.equal(b.qrUrl, 'https://example.com/book');
  });

  it('only scans supported pilot areas', () => {
    assert.throws(() => parseScanRequest({ areaId: 'nowhere', bbox: [0, 0, 0.001, 0.001] }), /supported area/);
  });
});

describe('aerial leads mail guard (test mode only)', () => {
  it('refuses live Lob keys and unapproved cards', async () => {
    const keys = ['LOB_TEST_API_KEY', 'LOB_API_KEY', 'AERIAL_LEADS_RETURN_ADDRESS'] as const;
    const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
    try {
      delete process.env.LOB_TEST_API_KEY;
      delete process.env.LOB_API_KEY;
      assert.equal(mailStatus().enabled, false);
      process.env.LOB_TEST_API_KEY = 'live_abc123';
      process.env.AERIAL_LEADS_RETURN_ADDRESS = JSON.stringify({ name: 'Biz', address_line1: '1 Main St', address_city: 'Cullman', address_state: 'AL', address_zip: '35055' });
      const status = mailStatus();
      assert.equal(status.enabled, false);
      assert.match(status.enabled ? '' : status.reason, /test key/);
      assert.throws(() => assertApproved({ status: 'flagged', approvedAt: null, approvedBy: null }), /Approve/);
      process.env.LOB_TEST_API_KEY = 'test_abc123';
      await assert.rejects(
        sendTestPostcard({
          to: toLobAddress({ name: 'Jane Doe', line1: '1 Elm', line2: null, city: 'Cullman', state: 'AL', zip: '35055' }),
          front: Buffer.from(''), back: Buffer.from(''), description: 't',
          approval: { status: 'flagged', approvedAt: null, approvedBy: null },
        }),
        /Approve/,
      );
    } finally {
      // Restore keys one by one: replacing process.env itself breaks TZ handling for later tests.
      for (const k of keys) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  });
});

describe('aerial leads postcard art', () => {
  const input: PostcardInput = {
    business: { name: 'Cullman Pressure Pros', phone: '(256) 555-0142', qrUrl: 'https://example.com' },
    priceDollars: 165,
    drivewaySqft: 550,
    ratePerSqft: 0.3,
    currentImage: Buffer.from([0xff, 0xd8, 0xff]),
    cleanedImage: Buffer.from([0xff, 0xd8, 0xff]),
    imageryLabel: 'USDA NAIP 2025',
    previewBadge: 'AI preview',
    qrSvg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  };

  it('uses a professional headline on the front and credits the imagery', () => {
    const svg = postcardFrontSvg(input);
    assert.match(svg, /Your driveway could look like new/);
    assert.match(svg, /USDA NAIP 2025/);
    assert.doesNotMatch(svg, /nasty/i);
  });

  it('puts the badge, price and phone on the back and keeps the address zone clear', () => {
    const svg = postcardBackSvg(input);
    assert.match(svg, /AI preview/);
    assert.match(svg, /\$165/);
    assert.match(svg, /\(256\) 555-0142/);
    for (const m of svg.matchAll(/<(?:text|image|rect)[^>]*\sx="([\d.]+)"[^>]*\sy="([\d.]+)"/g)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      const inZone = x >= BACK_ADDRESS_ZONE.x && y >= BACK_ADDRESS_ZONE.y;
      assert.equal(inZone, false, `element at ${x},${y} is inside the address zone`);
    }
  });
});
