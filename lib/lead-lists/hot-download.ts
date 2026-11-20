import { readFileSync } from 'node:fs';

const HEADER = ['business_name', 'website', 'email', 'city', 'state'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_HEADER_RE = /phone|mobile|cell|tel\b/i;
const PHONE_VALUE_RE = /(?:\+?1[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/;

export const HOT_LEADS_DOWNLOAD_FILENAME = 'fpg-hot-leads-500.csv';
export const HOT_LEADS_ROW_COUNT = 500;

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/, '');

  while (i < source.length) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value !== '')) rows.push(row);
  }
  return rows;
}

export function validateHotLeadsCsv(text: string, expectedRows = HOT_LEADS_ROW_COUNT): string | null {
  const raw = text.replace(/^\uFEFF/, '').trim();
  if (!raw) return null;
  const rows = parseCsvRows(raw);
  if (rows.length < 2) return null;
  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  if (header.length !== HEADER.length || HEADER.some((column, index) => header[index] !== column)) return null;
  if (header.some((column) => PHONE_HEADER_RE.test(column))) return null;

  const body = rows.slice(1);
  if (body.length !== expectedRows) return null;

  const emails = new Set<string>();
  for (const row of body) {
    if (row.length !== HEADER.length) return null;
    const record = {
      business_name: row[0].trim(),
      website: row[1].trim(),
      email: row[2].trim(),
      city: row[3].trim(),
      state: row[4].trim(),
    };
    if (!record.business_name || !record.website || !record.email || !record.city || !record.state) return null;
    if (!EMAIL_RE.test(record.email)) return null;
    const emailKey = record.email.toLowerCase();
    if (emails.has(emailKey)) return null;
    emails.add(emailKey);
    const haystack = `${record.business_name} ${record.website} ${record.email} ${record.city} ${record.state}`;
    if (PHONE_VALUE_RE.test(haystack)) return null;
  }

  const lines = [HEADER.join(',')];
  for (const row of body) {
    lines.push(row.map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function fromBase64(value: string): string | null {
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Load the private 500-row list. Prefer the env var so the file never has to
 * live in the git repo or in /public. A filesystem path is only used when
 * HOT_LEADS_500_PATH is set (local fulfillment copies).
 */
export function loadHotLeadsCsv(expectedRows = HOT_LEADS_ROW_COUNT): string | null {
  const direct = process.env.HOT_LEADS_500_CSV?.trim();
  if (direct) {
    const csv = validateHotLeadsCsv(direct, expectedRows);
    if (csv) return csv;
  }

  const encoded = process.env.HOT_LEADS_500_CSV_B64?.trim();
  if (encoded) {
    const decoded = fromBase64(encoded);
    if (decoded) {
      const csv = validateHotLeadsCsv(decoded, expectedRows);
      if (csv) return csv;
    }
  }

  const filePath = process.env.HOT_LEADS_500_PATH?.trim();
  if (filePath) {
    try {
      const csv = validateHotLeadsCsv(readFileSync(filePath, 'utf8'), expectedRows);
      if (csv) return csv;
    } catch {
      return null;
    }
  }

  return null;
}

export function downloadPathForSession(sessionId: string): string {
  return `/api/leads/hot/download?session_id=${encodeURIComponent(sessionId)}`;
}
