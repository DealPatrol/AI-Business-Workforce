import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { urlsForHost } from '@/lib/seo/public-urls';
import { hvacMergeTarget, receptionistHomePath } from '@/lib/seo/receptionist-home';
import { EXECUTIVE_RECEPTIONIST_INDEX, frontPorchGrowthSitemap, indexedAvaGuideSlugs, robotsForHost, sitemapForHost } from '@/lib/seo/sitemaps';
import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, getSiteUrl } from '@/lib/site-url';

const FRONT_PORCH = 'https://frontporchgrowth.com';

const FRONT_PORCH_PATHS = [
  '/',
  '/postcards',
  '/pricing',
  '/compare',
  '/reputation',
  '/lead-scout',
  '/leads',
  '/leads/hot',
  '/agents',
  '/terms',
  '/missed-call',
  '/google-profile',
  '/google-profile/management',
  '/ai-visibility',
  '/ai-search-visibility',
  '/ai-search-visibility/hvac',
  '/ai-search-visibility/plumbing',
  '/ai-search-visibility/roofing',
  '/ai-search-visibility/gadsden-al',
  '/ai-search-visibility/cost',
  '/ai-search-visibility/aeo-vs-seo',
  '/ai-search-visibility/check-if-ai-recommends-you',
  '/ai-search-visibility/cullman-al',
  '/ai-search-visibility/electrical',
  '/ai-search-visibility/dental',
  '/ai-search-visibility/med-spa',
  '/ai-search-visibility/law-firms',
  '/ai-search-visibility/b2b',
  '/privacy',
  '/about',
  '/sms',
  '/sms-consent',
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
  '/trades',
  '/free-tools',
  '/free-tools/postcard-cost-calculator',
  '/free-tools/postcard-roi-calculator',
  '/compare/front-porch-growth-vs-local-seo-bot',
  '/compare/front-porch-growth-vs-brightlocal',
  '/compare/yardmailer-vs-postcardmania',
  '/compare/yardmailer-vs-eddm',
  '/compare/front-porch-growth-vs-aeo-engine',
  '/compare/front-porch-growth-vs-otterly',
  '/compare/front-porch-growth-vs-nicejob',
  '/blog',
  '/blog/is-my-business-in-chatgpt',
  '/blog/ai-search-checklist-home-services',
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
    assert.equal(published.length, FRONT_PORCH_PATHS.length);
    for (const path of ['/receptionist', '/ava', '/hvac', '/gadsden', '/start', '/receptionist-demo', '/receptionist/missed-calls']) {
      assert.equal(published.map(pathOf).includes(path), false, path);
    }
    for (const path of ['/leads/thanks', '/leads/more', '/leads/hot/thanks']) {
      assert.equal(published.map(pathOf).includes(path), false, path);
    }
    assert.equal(published.some((url) => url.includes('/ava/')), false);
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
    for (const path of ['/', '/pricing', '/receptionist-demo', '/privacy', '/terms', '/ava', '/hvac', '/gadsden', '/receptionist/missed-calls']) {
      assert.ok(paths.includes(path), path);
    }
    for (const slug of indexedAvaGuideSlugs()) assert.ok(paths.includes(`/ava/${slug}`));
    assert.equal(paths.includes('/ava/ai-answering-service-for-hvac'), false);
    for (const path of ['/sms', '/sms-consent']) assert.equal(paths.includes(path), false, path);
    for (const path of ['/blog', '/about', '/blog/after-hours-hvac-calls', '/blog/hvac-answering-service-vs-ai-receptionist', '/blog/after-hours-plumbing-calls']) {
      assert.ok(paths.includes(path), path);
    }
    assert.equal(paths.includes('/blog/is-my-business-in-chatgpt'), false);
    // /compare on executivereceptionist.com is the Ava comparison hub (a different page from FPG's /compare).
    for (const path of ['/compare', '/compare/ava-vs-smith-ai', '/industries', '/tools', '/tools/call-forwarding-codes', '/templates']) {
      assert.ok(paths.includes(path), path);
    }
    for (const path of ['/postcards', '/receptionist', '/agents', '/trades/plumbers', '/missed-call']) {
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
      canonical: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/ava`,
      openGraphUrl: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/ava`,
    });
    assert.deepEqual(urlsForHost(null, '/hvac', '/hvac'), {
      canonical: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/hvac`,
      openGraphUrl: `${EXECUTIVE_RECEPTIONIST_ORIGIN}/hvac`,
    });
    assert.deepEqual(urlsForHost(null, '/privacy', '/privacy', `${FRONT_PORCH}/privacy`), {
      canonical: '/privacy',
      openGraphUrl: `${FRONT_PORCH}/privacy`,
    });
  });
});

describe('receptionist home redirects', () => {
  it('maps receptionist paths to executivereceptionist.com and leaves Front Porch Growth paths alone', () => {
    assert.equal(receptionistHomePath('/ava'), '/ava');
    assert.equal(receptionistHomePath('/ava/ai-answering-service-for-plumbers'), '/ava/ai-answering-service-for-plumbers');
    assert.equal(receptionistHomePath('/ava/ai-answering-service-for-hvac'), '/hvac');
    assert.equal(receptionistHomePath('/receptionist/hvac'), '/hvac');
    assert.equal(receptionistHomePath('/receptionist'), '/');
    assert.equal(receptionistHomePath('/receptionist/missed-calls'), '/receptionist/missed-calls');
    assert.equal(receptionistHomePath('/hvac/'), '/hvac');
    assert.equal(receptionistHomePath('/gadsden'), '/gadsden');
    for (const path of ['/start', '/receptionist-demo', '/business', '/dental', '/law', '/salon', '/auto-repair', '/med-spa', '/real-estate']) {
      assert.equal(receptionistHomePath(path), path);
    }
    for (const path of ['/', '/pricing', '/privacy', '/terms', '/sms', '/sms-consent', '/postcards', '/postcards/roofing', '/agents/estimate', '/google-profile', '/trades/hvac', '/onboarding/ava', '/buy/starter', '/api/checkout', '/missed-call', '/avatar']) {
      assert.equal(receptionistHomePath(path), null, path);
    }
    assert.equal(hvacMergeTarget('/hvac'), null);
  });
});
