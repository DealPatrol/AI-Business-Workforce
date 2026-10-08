import { milesToMeters } from '@/lib/prospector/constants';
import { ValidationError } from '@/lib/prospector/errors';
import { cleanHeaderText, isSingleEmail } from '@/lib/prospector/gates';
import { assertPublicUrl } from '@/lib/prospector/safe-fetch';
import { campaignNameFromUrl, parseTargetProfiles } from '@/lib/prospector/targets';
import { isLeadStatus, type LeadStatus, type ProspectorSettings } from '@/lib/prospector/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Request body must be an object.');
  }
  return value as Record<string, unknown>;
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseRadiusMiles(value: unknown): number | null {
  if (value == null || value === '') return null;
  const miles = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(miles) || miles < 1 || miles > 30) {
    throw new ValidationError('Radius must be between 1 and 30 miles.');
  }
  return milesToMeters(miles);
}

export function parseCampaignInput(body: unknown) {
  const record = requireRecord(body);
  const sourceUrl = assertPublicUrl(clip(record.sourceUrl, 500)).toString();
  const name = clip(record.name, 120) || campaignNameFromUrl(sourceUrl);
  return {
    name,
    sourceUrl,
    notes: clip(record.notes, 4000),
    location: clip(record.location, 120),
    radiusMeters: parseRadiusMiles(record.radiusMiles),
    offerSummary: clip(record.offerSummary, 4000),
  };
}

export function parseCampaignPatch(body: unknown) {
  const record = requireRecord(body);
  const id = clip(record.id, 80);
  if (!isUuid(id)) throw new ValidationError('Choose a saved list first.');
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('name' in record) patch.name = clip(record.name, 120) || 'Lead search';
  if ('notes' in record) patch.notes = clip(record.notes, 4000);
  if ('location' in record) patch.location = clip(record.location, 120);
  if ('offerSummary' in record) patch.offer_summary = clip(record.offerSummary, 4000);
  if ('radiusMiles' in record) patch.radius_meters = parseRadiusMiles(record.radiusMiles);
  if ('targets' in record) {
    const targets = parseTargetProfiles(record.targets);
    if (targets.length === 0) {
      throw new ValidationError('Keep at least one business type with a Google Maps search query.');
    }
    patch.targets = targets;
  }
  return { id, patch };
}

export function parseSettingsInput(body: unknown): ProspectorSettings {
  const record = requireRecord(body);
  const senderName = cleanHeaderText(clip(record.senderName, 80));
  const senderEmail = clip(record.senderEmail, 120);
  const mailingAddress = clip(record.mailingAddress, 400);
  const bookingUrl = clip(record.bookingUrl, 400);
  const defaultLocation = clip(record.defaultLocation, 120);
  const dailyCap = Number(record.dailyCap);
  const sendSpacingSeconds = Number(record.sendSpacingSeconds);
  if (senderEmail && !isSingleEmail(senderEmail)) {
    throw new ValidationError('Sender email must be a single address.');
  }
  if (bookingUrl) {
    let url: URL;
    try {
      url = new URL(bookingUrl);
    } catch {
      throw new ValidationError('Booking link must be a full URL.');
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new ValidationError('Booking link must start with http:// or https://.');
    }
  }
  if (mailingAddress && mailingAddress.length < 10) {
    throw new ValidationError('Use a full physical mailing address, or leave it blank until you are ready to send.');
  }
  if (!Number.isInteger(dailyCap) || dailyCap < 1 || dailyCap > 200) {
    throw new ValidationError('Daily cap must be a whole number from 1 to 200.');
  }
  if (!Number.isInteger(sendSpacingSeconds) || sendSpacingSeconds < 30 || sendSpacingSeconds > 3600) {
    throw new ValidationError('Spacing must be a whole number of seconds from 30 to 3600.');
  }
  return {
    senderName,
    senderEmail,
    mailingAddress,
    bookingUrl,
    dailyCap,
    defaultLocation,
    sendSpacingSeconds,
  };
}

export function parseLeadStatus(body: unknown): { id: string; status: LeadStatus } {
  const record = requireRecord(body);
  const id = clip(record.id, 80);
  const status = clip(record.status, 40);
  if (!isUuid(id) || !isLeadStatus(status)) {
    throw new ValidationError('Choose a lead and a valid status.');
  }
  return { id, status };
}

export function parseDraftWrite(body: unknown): {
  id: string;
  action: 'save' | 'approve';
  subject: string;
  body: string;
} {
  const record = requireRecord(body);
  const id = clip(record.id, 80);
  if (!isUuid(id)) throw new ValidationError('Choose a draft first.');
  const action = record.action === 'approve' ? 'approve' : 'save';
  const subject = cleanHeaderText(clip(record.subject, 180));
  const emailBody = typeof record.body === 'string' ? record.body.replace(/\r\n/g, '\n').trim().slice(0, 4000) : '';
  if (!subject || !emailBody) throw new ValidationError('Subject and body are required.');
  return { id, action, subject, body: emailBody };
}
