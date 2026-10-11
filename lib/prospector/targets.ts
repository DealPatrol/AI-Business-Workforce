import { randomUUID } from 'node:crypto';
import { sanitizeMapsQuery } from '@/lib/prospector/places';
import type { TargetProfile } from '@/lib/prospector/types';

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function parseTargetProfiles(raw: unknown): TargetProfile[] {
  const rows = Array.isArray(raw) ? raw : [];
  const targets: TargetProfile[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const label = clip(record.label, 80);
    const queries = (Array.isArray(record.queries) ? record.queries : [])
      .map((query) => (typeof query === 'string' ? sanitizeMapsQuery(query) : null))
      .filter((query): query is string => Boolean(query))
      .slice(0, 4);
    if (!label || queries.length === 0) continue;
    const fit = typeof record.fitScore === 'number' && Number.isFinite(record.fitScore) ? record.fitScore : 50;
    targets.push({
      id: clip(record.id, 80) || randomUUID(),
      label,
      reason: clip(record.reason, 400),
      fitScore: Math.max(0, Math.min(100, Math.round(fit))),
      queries,
      selected: record.selected !== false,
    });
    if (targets.length >= 6) break;
  }
  return targets;
}

export function campaignNameFromUrl(raw: string): string {
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, '');
    return host ? `${host} prospects` : 'Lead search';
  } catch {
    return 'Lead search';
  }
}
