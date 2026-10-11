import type { ProspectorLead } from '@/lib/prospector/types';

const COLUMNS = [
  'name',
  'category',
  'address',
  'phone',
  'website',
  'rating',
  'review_count',
  'emails',
  'contact_name',
  'channel',
  'status',
  'maps_url',
  'place_id',
] as const;

function cell(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function leadsToCsv(leads: ProspectorLead[]): string {
  const lines = leads.map((lead) =>
    [
      lead.name,
      lead.category,
      lead.address,
      lead.phone,
      lead.website,
      lead.rating,
      lead.reviewCount,
      lead.emails.join('; '),
      lead.contactName,
      lead.channel,
      lead.status,
      lead.mapsUrl,
      lead.placeId,
    ]
      .map(cell)
      .join(','),
  );
  return [COLUMNS.join(','), ...lines].join('\n');
}
