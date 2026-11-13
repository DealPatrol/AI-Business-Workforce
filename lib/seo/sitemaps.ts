import type { MetadataRoute } from 'next';
import { AGENTS } from '@/lib/agents/catalog';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { POSTCARD_TRADES } from '@/lib/postcards/trade-pages';
import { absoluteUrl, isExecutiveReceptionistHost, publicIndexOrigin } from '@/lib/site-url';
import { TRADE_PAGES } from '@/lib/trades/pages';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

type IndexEntry = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

/**
 * Public indexable pages of the Executive Receptionist host.
 * `/` is the receptionist landing (middleware rewrites it). `/receptionist` is the same
 * document and already canonicalizes to `/`, so it is not listed again.
 * Front Porch Growth suite pages (postcards, agents, trades, and the rest) stay on that host.
 */
export const EXECUTIVE_RECEPTIONIST_INDEX: IndexEntry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/start', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/receptionist-demo', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/ava', changeFrequency: 'weekly', priority: 0.95 },
  { path: '/hvac', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/receptionist/missed-calls', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/sms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/sms-consent', changeFrequency: 'yearly', priority: 0.3 },
];

function entry(origin: string, path: string, now: Date, changeFrequency: ChangeFrequency, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(origin, path),
    lastModified: now,
    changeFrequency,
    priority,
  };
}

export function frontPorchGrowthSitemap(origin: string, now: Date): MetadataRoute.Sitemap {
  return [
    entry(origin, '/', now, 'weekly', 1),
    entry(origin, '/start', now, 'weekly', 0.97),
    entry(origin, '/postcards', now, 'weekly', 0.9),
    entry(origin, '/pricing', now, 'monthly', 0.8),
    entry(origin, '/compare', now, 'monthly', 0.8),
    entry(origin, '/reputation', now, 'weekly', 0.8),
    entry(origin, '/lead-scout', now, 'weekly', 0.7),
    entry(origin, '/agents', now, 'weekly', 0.7),
    entry(origin, '/terms', now, 'yearly', 0.3),
    entry(origin, '/ava', now, 'weekly', 0.95),
    entry(origin, '/receptionist', now, 'weekly', 0.96),
    entry(origin, '/receptionist/missed-calls', now, 'weekly', 0.9),
    entry(origin, '/hvac', now, 'weekly', 0.9),
    entry(origin, '/missed-call', now, 'weekly', 0.8),
    entry(origin, '/google-profile', now, 'weekly', 0.8),
    entry(origin, '/privacy', now, 'yearly', 0.3),
    entry(origin, '/sms', now, 'yearly', 0.3),
    entry(origin, '/sms-consent', now, 'yearly', 0.3),
    entry(origin, '/receptionist-demo', now, 'weekly', 0.8),
    ...POSTCARD_TRADES.map((trade) => entry(origin, `/postcards/${trade.slug}`, now, 'monthly', 0.8)),
    ...avaGuideSlugs().map((slug) => entry(origin, `/ava/${slug}`, now, 'weekly', 0.88)),
    ...AGENTS.map((agent) => entry(origin, `/agents/${agent.id}`, now, 'monthly', 0.6)),
    ...TRADE_PAGES.map((page) => entry(origin, `/trades/${page.slug}`, now, 'monthly', 0.7)),
  ];
}

export function executiveReceptionistSitemap(origin: string, now: Date): MetadataRoute.Sitemap {
  return [
    ...EXECUTIVE_RECEPTIONIST_INDEX.map((page) => entry(origin, page.path, now, page.changeFrequency, page.priority)),
    ...avaGuideSlugs().map((slug) => entry(origin, `/ava/${slug}`, now, 'weekly', 0.88)),
  ];
}

export function sitemapForHost(hostHeader: string | null | undefined, now = new Date()): MetadataRoute.Sitemap {
  const origin = publicIndexOrigin(hostHeader);
  if (isExecutiveReceptionistHost(hostHeader)) return executiveReceptionistSitemap(origin, now);
  return frontPorchGrowthSitemap(origin, now);
}

const ROBOT_ALLOW = ['/', '/prospector/unsubscribe'];
const ROBOT_DISALLOW = ['/api/', '/onboarding/', '/dashboard/', '/login', '/sales', '/demo', '/audit'];

/**
 * Search and AI answer-engine crawlers, named so it is explicit that they may read public pages.
 * A named group replaces the * group for that crawler, so it repeats the same allow and disallow lists.
 */
export const NAMED_CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Applebot',
  'Applebot-Extended',
  'DuckAssistBot',
  'Amazonbot',
  'meta-externalagent',
  'MistralAI-User',
  'cohere-ai',
  'YouBot',
  'CCBot',
];

const ROBOT_RULES: NonNullable<MetadataRoute.Robots['rules']> = [
  { userAgent: '*', allow: ROBOT_ALLOW, disallow: ROBOT_DISALLOW },
  { userAgent: NAMED_CRAWLERS, allow: ROBOT_ALLOW, disallow: ROBOT_DISALLOW },
];

export function robotsForHost(hostHeader: string | null | undefined): MetadataRoute.Robots {
  return {
    rules: ROBOT_RULES,
    sitemap: absoluteUrl(publicIndexOrigin(hostHeader), '/sitemap.xml'),
  };
}
