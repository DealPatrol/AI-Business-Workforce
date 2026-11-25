/** Turn county parcel attributes into a mailable owner record. */

import type { AerialArea } from './sources';

export type MailingAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
};

export type ParcelRecord = {
  parcelId: string;
  pin: string;
  ownerName: string;
  mailing: MailingAddress | null;
  situsAddress: string;
  improvement: string;
  /** True when the owner's mailing address matches the property (likely owner-occupied). */
  ownerOccupied: boolean;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v));
  return String(v).trim();
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Nw|Ne|Sw|Se|Po|Llc|Ii|Iii|Jr|Sr)\b/g, (m) => m.toUpperCase());
}

/** "CALVERT, KIMBERLY INGRAM" -> "Kimberly Ingram Calvert"; leaves entities ("ABC LLC") alone apart from case. */
export function formatOwnerName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (/\b(LLC|INC|TRUST|CHURCH|BANK|CORP|COMPANY|ESTATE|CITY OF|COUNTY|BOARD|ASSOC)\b/i.test(cleaned)) return titleCase(cleaned);
  const first = cleaned.split(/\s+(?:AND|&)\s+|\s*\(/i)[0];
  const [last, rest] = first.split(',').map((s) => s.trim());
  if (rest) return titleCase(`${rest} ${last}`);
  return titleCase(first);
}

/** Entity owners (LLCs, churches, banks...) are skipped for homeowner mail. */
export function isEntityOwner(raw: string): boolean {
  return /\b(LLC|INC|CORP|CHURCH|BANK|COMPANY|CITY OF|COUNTY|BOARD|ASSOC|L\.L\.C|PROPERTIES|HOLDINGS|PARTNERS)\b/i.test(raw);
}

export function parseParcel(area: AerialArea, attributes: Record<string, unknown>): ParcelRecord {
  const f = area.parcels.fields;
  const ownerRaw = str(attributes[f.owner]);
  const line1 = str(attributes[f.mailLine1]);
  const line2 = [f.mailLine2, f.mailLine3].map((k) => (k ? str(attributes[k]) : '')).filter(Boolean).join(' ') || null;
  const city = str(attributes[f.mailCity]);
  const state = str(attributes[f.mailState]);
  const zip5 = str(attributes[f.mailZip]);
  const zip4 = f.mailZip4 ? str(attributes[f.mailZip4]) : '';
  const situsNumber = str(attributes[f.situsNumber]);
  const situsName = str(attributes[f.situsName]);
  const situs = [situsNumber && situsNumber !== '0' ? situsNumber : '', situsName].filter(Boolean).join(' ');
  const mailing: MailingAddress | null = line1 && city && state && zip5
    ? { name: formatOwnerName(ownerRaw), line1: titleCase(line1), line2: line2 ? titleCase(line2) : null, city: titleCase(city), state: state.toUpperCase(), zip: zip4 ? `${zip5}-${zip4}` : zip5 }
    : null;
  return {
    parcelId: str(attributes[f.parcelId]),
    pin: str(attributes[f.pin]),
    ownerName: formatOwnerName(ownerRaw),
    mailing,
    situsAddress: situs ? `${titleCase(situs)}, ${area.defaultSitusCity}, ${area.state}` : '',
    improvement: f.improvement ? str(attributes[f.improvement]) : '',
    ownerOccupied: Boolean(situs && line1 && line1.toUpperCase().replace(/\s+/g, ' ') === situs.toUpperCase().replace(/\s+/g, ' ')),
  };
}

/** Residential, has an owner and a complete mailing address, not an entity. */
export function isMailableHomeowner(record: ParcelRecord, ownerRaw: string): boolean {
  if (!record.mailing || !record.ownerName) return false;
  if (isEntityOwner(ownerRaw)) return false;
  if (record.improvement && !/res/i.test(record.improvement)) return false;
  return Boolean(record.situsAddress);
}

/** "Kimberly Ingram Calvert" -> "K. Calvert" for screens and committed samples. */
export function maskOwnerName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ? `${parts[0][0]}.` : '';
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}
