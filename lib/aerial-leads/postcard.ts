/**
 * 4x6 postcard art (with 1/8" bleed: 6.25 x 4.25 in at 300 dpi = 1875 x 1275).
 *
 * Front: the real current aerial crop + a professional headline.
 * Back: the cleaned preview (badged), the price, the business phone and a QR
 * code. The right side of the back is left blank for the mail vendor's
 * address block and postage (Lob's 4x6 template keeps that zone clear).
 *
 * Output is SVG so the same art renders in the browser, in sharp (PNG for
 * Lob), or in a headless browser (PDF proof).
 */

import { formatPrice } from './pricing';

export const POSTCARD_WIDTH = 1875;
export const POSTCARD_HEIGHT = 1275;

export type PostcardBusiness = {
  name: string;
  phone: string;
  /** Where the QR code points (booking page, /q/token, website). */
  qrUrl: string;
  website?: string;
  tagline?: string;
};

export type PostcardInput = {
  business: PostcardBusiness;
  priceDollars: number;
  drivewaySqft: number;
  ratePerSqft: number;
  /** JPEG/PNG bytes for the real aerial (front). */
  currentImage: Buffer;
  /** JPEG/PNG bytes for the cleaned preview (back). */
  cleanedImage: Buffer;
  /** Label for the photo credit, e.g. "USDA NAIP 2025". */
  imageryLabel: string;
  /** "AI preview" when an image model made the cleaned version, "Digital preview" for the free simulation. */
  previewBadge: string;
  /** QR code as an SVG string (from the `qrcode` package). */
  qrSvg: string;
  headline?: string;
};

export const DEFAULT_HEADLINE = 'Your driveway could look like new';

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dataUri(bytes: Buffer, mime?: string): string {
  const type = mime ?? (bytes[0] === 0x89 ? 'image/png' : 'image/jpeg');
  return `data:${type};base64,${bytes.toString('base64')}`;
}

const FONT = "'Helvetica Neue', Helvetica, Arial, 'DejaVu Sans', sans-serif";

export function postcardFrontSvg(input: PostcardInput): string {
  const { business } = input;
  const headline = esc(input.headline || DEFAULT_HEADLINE);
  const W = POSTCARD_WIDTH;
  const H = POSTCARD_HEIGHT;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1a12" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#0b1a12" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0b1a12" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" xlink:href="${dataUri(input.currentImage)}" href="${dataUri(input.currentImage)}"/>
  <rect x="0" y="${H * 0.5}" width="${W}" height="${H * 0.5}" fill="url(#shade)"/>
  <rect x="90" y="96" rx="10" width="520" height="66" fill="#ffffff" fill-opacity="0.92"/>
  <text x="118" y="140" font-family="${FONT}" font-size="30" font-weight="700" fill="#1f3b2b" letter-spacing="2">YOUR HOME, FROM ABOVE</text>
  <text x="90" y="${H - 250}" font-family="${FONT}" font-size="92" font-weight="800" fill="#ffffff">${headline}</text>
  <text x="92" y="${H - 170}" font-family="${FONT}" font-size="46" fill="#e8f2ec">Professional pressure washing by ${esc(business.name)}</text>
  <text x="92" y="${H - 104}" font-family="${FONT}" font-size="46" font-weight="700" fill="#ffd166">See your cleaned preview and price on the back</text>
  <text x="${W - 90}" y="${H - 50}" text-anchor="end" font-family="${FONT}" font-size="24" fill="#cfe0d6">Aerial photo: ${esc(input.imageryLabel)} (public imagery)</text>
</svg>`;
}

/** Lob 4x6 back: ink-free address + postage zone, in px at 300 dpi with bleed. */
export const BACK_ADDRESS_ZONE = { x: 800, y: 480, width: 1000, height: 720 };

export function postcardBackSvg(input: PostcardInput): string {
  const { business } = input;
  const W = POSTCARD_WIDTH;
  const H = POSTCARD_HEIGHT;
  const x0 = 75;
  const panelW = 705; // everything left of the address zone
  const imgY = 190;
  const imgW = panelW;
  const imgH = Math.round(imgW / 1.47);
  const qrSize = 190;
  const qrX = x0 + panelW - qrSize;
  const qrY = imgY + imgH + 40;
  const qr = `data:image/svg+xml;base64,${Buffer.from(input.qrSvg).toString('base64')}`;
  const price = esc(formatPrice(input.priceDollars));
  const sqft = Math.round(input.drivewaySqft).toLocaleString('en-US');
  const badgeW = input.previewBadge.length * 15 + 44;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${x0 + panelW + 40}" height="${H}" fill="#f4f8f5"/>
  <text x="${x0}" y="112" font-family="${FONT}" font-size="44" font-weight="800" fill="#1f3b2b">Here&#8217;s your driveway, cleaned</text>
  <text x="${x0}" y="156" font-family="${FONT}" font-size="25" fill="#4b6355">A preview made from the same aerial photo on the front.</text>
  <clipPath id="imgclip"><rect x="${x0}" y="${imgY}" width="${imgW}" height="${imgH}" rx="16"/></clipPath>
  <image x="${x0}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#imgclip)" xlink:href="${dataUri(input.cleanedImage)}" href="${dataUri(input.cleanedImage)}"/>
  <rect x="${x0 + 18}" y="${imgY + 18}" rx="20" width="${badgeW}" height="50" fill="#1f3b2b" fill-opacity="0.9"/>
  <text x="${x0 + 18 + badgeW / 2}" y="${imgY + 52}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="700" fill="#ffffff">${esc(input.previewBadge)}</text>
  <text x="${x0}" y="${imgY + imgH + 78}" font-family="${FONT}" font-size="32" fill="#1f3b2b">Driveway wash</text>
  <text x="${x0}" y="${imgY + imgH + 176}" font-family="${FONT}" font-size="104" font-weight="800" fill="#1f3b2b">${price}</text>
  <text x="${x0}" y="${imgY + imgH + 218}" font-family="${FONT}" font-size="21" fill="#4b6355">About ${sqft} sq ft at $${input.ratePerSqft.toFixed(2)}/sq ft.</text>
  <text x="${x0}" y="${imgY + imgH + 246}" font-family="${FONT}" font-size="21" fill="#4b6355">Final price confirmed before we start.</text>
  <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" xlink:href="${qr}" href="${qr}"/>
  <text x="${qrX + qrSize / 2}" y="${qrY + qrSize + 34}" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="700" fill="#1f3b2b">Scan to book</text>
  <text x="${x0}" y="${H - 150}" font-family="${FONT}" font-size="28" fill="#1f3b2b">Call or text</text>
  <text x="${x0}" y="${H - 96}" font-family="${FONT}" font-size="54" font-weight="800" fill="#1f3b2b">${esc(business.phone)}</text>
  <text x="${x0}" y="${H - 56}" font-family="${FONT}" font-size="24" fill="#4b6355">${esc(business.name)}${business.website ? ` &#183; ${esc(business.website)}` : ''}</text>
  <text x="${BACK_ADDRESS_ZONE.x + 40}" y="130" font-family="${FONT}" font-size="40" font-weight="800" fill="#1f3b2b">${esc(business.name)}</text>
  <text x="${BACK_ADDRESS_ZONE.x + 40}" y="178" font-family="${FONT}" font-size="26" fill="#4b6355">${esc(business.tagline || 'Driveways, sidewalks, patios and roofs')}</text>
</svg>`;
}

export async function qrSvgFor(url: string): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1f3b2b', light: '#ffffff' } });
}

/** Render both sides to PNG with sharp (librsvg). */
export async function renderPostcardPngs(input: PostcardInput): Promise<{ front: Buffer; back: Buffer }> {
  const sharp = (await import('sharp')).default;
  const [front, back] = await Promise.all([
    sharp(Buffer.from(postcardFrontSvg(input)), { density: 72 }).png().toBuffer(),
    sharp(Buffer.from(postcardBackSvg(input)), { density: 72 }).png().toBuffer(),
  ]);
  return { front, back };
}
