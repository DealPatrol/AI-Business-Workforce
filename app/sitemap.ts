import type { MetadataRoute } from 'next';
import { AGENTS } from '@/lib/agents/catalog';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { POSTCARD_TRADES } from '@/lib/postcards/trade-pages';
import { TRADE_PAGES } from '@/lib/trades/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteSiteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteSiteUrl('/postcards'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteSiteUrl('/pricing'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteSiteUrl('/compare'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteSiteUrl('/reputation'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/lead-scout'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/agents'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteSiteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/ava'), lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: absoluteSiteUrl('/receptionist'), lastModified: now, changeFrequency: 'weekly', priority: 0.96 },
    { url: absoluteSiteUrl('/receptionist/missed-calls'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteSiteUrl('/hvac'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteSiteUrl('/missed-call'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/google-profile'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteSiteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteSiteUrl('/receptionist-demo'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...POSTCARD_TRADES.map((t) => ({
      url: absoluteSiteUrl(`/postcards/${t.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...avaGuideSlugs().map((slug) => ({
      url: absoluteSiteUrl(`/ava/${slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.88,
    })),
    ...AGENTS.map((agent) => ({
      url: absoluteSiteUrl(`/agents/${agent.id}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...TRADE_PAGES.map((page) => ({
      url: absoluteSiteUrl(`/trades/${page.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
