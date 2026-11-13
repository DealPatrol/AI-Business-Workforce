import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { urlsForHost } from '@/lib/seo/public-urls';
import { EXECUTIVE_RECEPTIONIST_INDEX, frontPorchGrowthSitemap, robotsForHost, sitemapForHost } from '@/lib/seo/sitemaps';
import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, getSiteUrl } from '@/lib/site-url';

const FRONT_PORCH = 'https://frontporchgrowth.com';

const FRONT_PORCH_PATHS = [
  '/',
  '/start',
  '/postcards',
  '/pricing',
  '/compare',
  '/reputation',
  '/lead-scout',
  '/agents',
  '/terms',
  '/ava',
  '/receptionist',
  '/receptionist/missed-calls',
  '/hvac',
  '/missed-call',
  '/google-profile',
  '/privacy',
  '/sms',
  '/sms-consent',
  '/receptionist-demo',
  '/postcards/landscaping',
  '/postcards/lawn-care',
  '/postcards/hardscaping',
  '/postcards/fencing',
  '/postcards/roofing',
  '/postcards/exterior-painting',
  '/postcards/pressure-washing',
  '/postcards/pool-installation',
  '/postcards/outdoor-lighting',
  '/postcards/tree-service',
  ...avaGuideSlugs().map((slug) => `/ava/${slug}`),
  '/agents/estimate',
  '/agents/review-reply',
  '/agents/job-ad',
  '/agents/follow-up',
  '/agents/service-page',
  '/agents/invoice-reminder',
  '/trades/plumbers',
  '/trades/hvac',
  '/trades/roofers',
  '/trades/lawn-care',
  '/trades/cleaners',
];

function urls(host: string | null) {
  return sitemapForHost(host, new Date('2026-11-08T00:00:00.000Z')).map((item) => item.url);
}

function pathOf(url: string) {
  const parsed = new URL(url);
  return parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
}

describe('host sitemaps', () => {
  it('keeps the Front Porch Growth sitemap on its own host', () => {
    const published = frontPorchGrowthSitemap(FRONT_PORCH, new Date('2026-11-08T00:00:00.000Z')).map((item) => item.url);
    assert.deepEqual(published.map(pathOf), FRONT_PORCH_PATHS);
    assert.equal(published.length, 60);
    assert.ok(published.every((url) => url.startsWith(`${FRONT_PORCH}/`)));

    const origin = getSiteUrl();
    const expected = frontPorchGrowthSitemap(origin, new Date('2026-11-08T00:00:00.000Z')).map((item) => item.url);
    assert.deepEqual(urls('frontporchgrowth.com'), expected);
    assert.deepEqual(urls(null), expected);
    assert.deepEqual(urls('ai-business-workforce.vercel.app'), expected);
    assert.equal(robotsForHost('frontporchgrowth.com').sitemap, absoluteUrl(origin, '/sitemap.xml'));
    assert.equal(robotsForHost(null).sitemap, absoluteUrl(origin, '/sitemap.xml'));
  });

  it('lists Executive Receptionist pages on that host, including www', () => {
    const locations = urls('executivereceptionist.com');
    const paths = locations.map(pathOf);
    assert.deepEqual(locations, urls('www.executivereceptionist.com'));
    assert.ok(locations.every((url) => url.startsWith(`${EXECUTIVE_RECEPTIONIST_ORIGIN}/`)));
    assert.deepEqual(paths.slice(0, EXECUTIVE_RECEPTIONIST_INDEX.length), EXECUTIVE_RECEPTIONIST_INDEX.map((page) => page.path));
    for (const path of ['/', '/pricing', '/receptionist-demo', '/privacy', '/terms', '/sms', '/sms-consent', '/ava', '/hvac', '/receptionist/missed-calls']) {
      assert.ok(paths.includes(path), path);
    }
    for (const slug of avaGuideSlugs()) assert.ok(paths.includes(`/ava/${slug}`));
    for (const path of ['/postcards', '/receptionist', '/agents', '/compare', '/trades/plumbers', '/missed-call']) {
      assert.equal(paths.includes(path), false, path);
    }
    assert.equal(robotsForHost('www.executivereceptionist.com').sitemap, `${EXECUTIVE_RECEPTIONIST_ORIGIN}/sitemap.xml`);
  });

  it('keeps the same robots rules and only changes the sitemap host', () => {
    const rules = robotsForHost('executivereceptionist.com').rules;
    const list = Array.isArray(rules) ? rules : [rules];
    const disallows = list.flatMap((rule) => {
      const value = rule.disallow;
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    });
    assert.ok(disallows.includes('/api/'));
    assert.deepEqual(robotsForHost('executivereceptionist.com').rules, robotsForHost('frontporchgrowth.com').rules);
  });

  it('points Executive Receptionist canonicals at that host and leaves other hosts alone', () => {
    assert.deepEqual(urlsForHost('executivereceptionist.com', '/pricing', '/pricing'), {
      canonical: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/pricing`,
      openGraphUrl: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/pricing`,
    });
    assert.deepEqual(urlsForHost('www.executivereceptionist.com', '/receptionist-demo', '/receptionist-demo'), {
      canonical: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/receptionist-demo`,
      openGraphUrl: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/receptionist-demo`,
    });
    assert.deepEqual(urlsForHost('frontporchgrowth.com', '/pricing', '/pricing'), {
      canonical: '/pricing',
      openGraphUrl: '/pricing',
    });
    assert.deepEqual(urlsForHost('frontporchgrowth.com', '/ava', `${FRONT_PORCH}/ava`, `${FRONT_PORCH}/ava`), {
      canonical: `${FRONT_PORCH}/ava`,
      openGraphUrl: `${FRONT_PORCH}/ava`,
    });
    assert.deepEqual(urlsForHost(null, '/privacy', '/privacy', `${FRONT_PORCH}/privacy`), {
      canonical: '/privacy',
      openGraphUrl: `${FRONT_PORCH}/privacy`,
    });
  });
});
