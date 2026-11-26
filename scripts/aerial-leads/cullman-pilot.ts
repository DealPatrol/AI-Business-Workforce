/**
 * Cullman County pilot run (operator tool; free data only; mails nothing).
 *
 *   node --experimental-strip-types --experimental-loader ./scripts/ava-security-test-loader.mjs \
 *     scripts/aerial-leads/cullman-pilot.ts --bbox='[-86.8199,34.1613,-86.8129,34.1669]' --out=/tmp/aerial-pilot
 *
 * Writes, under --out:
 *   leads.json                 every scored parcel (includes owner names + mailing addresses: keep private)
 *   <slug>/current.jpg|prior.jpg|cleaned.jpg|front.png|back.png   per flagged (and --near-miss) lead
 * With --fixture, also writes the masked dashboard sample into the repo
 * (lib/aerial-leads/fixtures/cullman-pilot.json + public/aerial-leads/cullman-pilot/).
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { aiCleanedPreview } from '@/lib/aerial-leads/ai-preview';
import { maskOwnerName } from '@/lib/aerial-leads/parcels';
import { renderLeadImages, scanArea, type AerialLead } from '@/lib/aerial-leads/pipeline';
import { qrSvgFor, renderPostcardPngs, type PostcardBusiness } from '@/lib/aerial-leads/postcard';
import { DEFAULT_PRICE_CONFIG } from '@/lib/aerial-leads/pricing';
import { CULLMAN_COUNTY_AL } from '@/lib/aerial-leads/sources';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : process.argv.includes(`--${name}`) ? '1' : undefined;
}

const bboxes: Array<[number, number, number, number]> = JSON.parse(arg('bboxes') ?? `[${arg('bbox') ?? '[-86.8199,34.1613,-86.8129,34.1669]'}]`);
const out = arg('out') ?? '/tmp/aerial-pilot';
const nearMiss = Number(arg('near-miss') ?? '2');
const writeFixture = Boolean(arg('fixture'));
const business: PostcardBusiness = JSON.parse(
  arg('business') ??
    JSON.stringify({
      name: 'Cullman Pressure Pros',
      phone: '(256) 555-0142',
      qrUrl: 'https://frontporchgrowth.com/postcards',
      website: 'frontporchgrowth.com',
      tagline: 'Sample client card for the Cullman pilot',
    }),
);
const price = DEFAULT_PRICE_CONFIG;
// Default rule is the reel's (30% stained AND 40% darker). Pass --min-darker=15 etc. to tune for a pilot.
const thresholds = {
  ...(arg('min-stained') ? { minStainedPct: Number(arg('min-stained')) } : {}),
  ...(arg('min-darker') ? { minDarkerPct: Number(arg('min-darker')) } : {}),
};

const slug = (lead: AerialLead) => lead.situsAddress.split(',')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const all: AerialLead[] = [];
let usedThresholds: unknown = null;
const scans = [];
for (const bbox of bboxes) {
  const result = await scanArea({ area: CULLMAN_COUNTY_AL, bbox, price, thresholds });
  usedThresholds = result.thresholds;
  scans.push({ bbox, scannedParcels: result.scannedParcels, mailableParcels: result.mailableParcels, flagged: result.flaggedCount, priorShiftPx: result.priorShiftPx });
  console.log(`bbox ${JSON.stringify(bbox)}: ${result.mailableParcels} mailable homes, ${result.flaggedCount} flagged`);
  all.push(...result.leads);
}
await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'leads.json'), JSON.stringify({ scans, leads: all }, null, 2));

const flagged = all.filter((l) => l.flagged);
const misses = all
  .filter((l) => !l.flagged && l.driveway.sqft >= 150 && l.driveway.sqft <= 4000 && l.driveway.stainedPct >= 20)
  .sort((a, b) => b.driveway.darkerPct + b.driveway.stainedPct - (a.driveway.darkerPct + a.driveway.stainedPct))
  .slice(0, nearMiss);
const toRender = [...flagged.map((l) => ({ lead: l, kind: 'flagged' as const })), ...misses.map((l) => ({ lead: l, kind: 'near-miss' as const }))];

const fixtureLeads = [];
const publicDir = path.join(process.cwd(), 'public/aerial-leads/cullman-pilot');
if (writeFixture) await mkdir(publicDir, { recursive: true });

for (const { lead, kind } of toRender) {
  const s = slug(lead);
  const dir = path.join(out, kind, s);
  await mkdir(dir, { recursive: true });
  const images = await renderLeadImages(CULLMAN_COUNTY_AL, lead);
  const cleaned = await aiCleanedPreview(images.current, images.mask, images.cleaned);
  const pngs = await renderPostcardPngs({
    business,
    priceDollars: lead.priceDollars,
    drivewaySqft: lead.driveway.sqft,
    ratePerSqft: price.ratePerSqft,
    currentImage: images.current,
    cleanedImage: cleaned.image,
    imageryLabel: lead.imagery.current,
    previewBadge: cleaned.badge,
    qrSvg: await qrSvgFor(business.qrUrl),
  });
  await Promise.all([
    writeFile(path.join(dir, 'current.jpg'), images.current),
    writeFile(path.join(dir, 'prior.jpg'), images.prior),
    writeFile(path.join(dir, 'cleaned.jpg'), cleaned.image),
    writeFile(path.join(dir, 'mask.png'), images.mask),
    writeFile(path.join(dir, 'front.png'), pngs.front),
    writeFile(path.join(dir, 'back.png'), pngs.back),
  ]);
  console.log(`${kind}: ${lead.situsAddress} -> ${dir}`);

  if (writeFixture) {
    const small = (b: Buffer, w: number) => sharp(b).resize(w).jpeg({ quality: 78 }).toBuffer();
    const files = { current: `${s}-current.jpg`, prior: `${s}-prior.jpg`, cleaned: `${s}-cleaned.jpg`, front: `${s}-front.jpg`, back: `${s}-back.jpg` };
    await Promise.all([
      writeFile(path.join(publicDir, files.current), await small(images.current, 600)),
      writeFile(path.join(publicDir, files.prior), await small(images.prior, 600)),
      writeFile(path.join(publicDir, files.cleaned), await small(cleaned.image, 600)),
      writeFile(path.join(publicDir, files.front), await small(pngs.front, 900)),
      writeFile(path.join(publicDir, files.back), await small(pngs.back, 900)),
    ]);
    fixtureLeads.push({
      kind,
      // Owner names are masked and no mailing address is committed; the live scan reads them from the county at run time.
      ownerName: maskOwnerName(lead.ownerName),
      street: lead.situsAddress.split(',')[0].replace(/^\d+\s+/, '').trim(),
      city: 'Cullman, AL',
      parcelId: lead.parcelId,
      driveway: lead.driveway,
      stainScore: lead.stainScore,
      reasons: lead.reasons,
      priceDollars: lead.priceDollars,
      imagery: lead.imagery,
      previewBadge: cleaned.badge,
      images: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, `/aerial-leads/cullman-pilot/${v}`])),
    });
  }
}

if (writeFixture) {
  const fixture = {
    generatedAt: new Date().toISOString(),
    area: CULLMAN_COUNTY_AL.name,
    business,
    price,
    thresholds: usedThresholds,
    scans,
    totals: { mailable: scans.reduce((n, s) => n + s.mailableParcels, 0), flagged: flagged.length },
    leads: fixtureLeads,
  };
  await writeFile(path.join(process.cwd(), 'lib/aerial-leads/fixtures/cullman-pilot.json'), JSON.stringify(fixture, null, 2) + '\n');
}
console.log(`done: ${flagged.length} flagged, ${misses.length} near-miss rendered`);
