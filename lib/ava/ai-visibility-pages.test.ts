import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AVA_GUIDES, avaGuideSlugs, getAvaGuide } from '@/lib/ava/trade-pages';
import { executiveReceptionistSitemap, frontPorchGrowthSitemap, sitemapForHost } from '@/lib/seo/sitemaps';

const QUESTION_SLUGS = [
  'best-ai-receptionist-for-hvac-companies',
  'ai-answering-service-for-plumbers',
  'ai-receptionist-vs-answering-service',
  'ai-receptionist-for-hvac-and-plumbing-in-alabama',
] as const;

const PRICING_HINT = /\$1|\b79\b|Starter/;

function guideText(slug: (typeof QUESTION_SLUGS)[number]) {
  const guide = getAvaGuide(slug);
  assert.ok(guide, slug);
  return [
    guide.h1,
    guide.directAnswer ?? '',
    guide.lede,
    guide.pain,
    guide.roiBody,
    ...guide.faqs.flatMap((faq) => [faq.q, faq.a]),
    ...(guide.costRows ?? []).flatMap((row) => [row.option, row.cost, row.notes]),
    guide.costNote ?? '',
    ...(guide.cityNotes ?? []).flatMap((city) => [city.city, city.body]),
  ].join('\n');
}

describe('AI visibility question pages', () => {
  it('includes the four question-style pages, each with a direct answer, pricing, and FAQs', () => {
    assert.equal(AVA_GUIDES.length, 41);
    assert.equal(avaGuideSlugs().length, 41);
    for (const slug of QUESTION_SLUGS) {
      const guide = getAvaGuide(slug);
      assert.ok(guide, slug);
      assert.ok(guide.directAnswer && guide.directAnswer.length > 80, `${slug} missing direct answer`);
      assert.match(guide.directAnswer, PRICING_HINT, `${slug} direct answer missing price`);
      assert.match(guide.directAnswer, /email/i, `${slug} should say the lead is emailed`);
      assert.ok(guide.faqs.length >= 3, `${slug} needs an FAQ`);
      assert.ok(
        guide.faqs.some((faq) => PRICING_HINT.test(`${faq.q} ${faq.a}`)),
        `${slug} FAQ should mention published pricing`,
      );
    }
  });

  it('does not claim the product texts the lead by default', () => {
    const forbidden = /texts you a lead|then texts you|texts the lead/i;
    for (const guide of AVA_GUIDES) {
      const text = [guide.directAnswer ?? '', guide.lede, guide.pain, guide.roiBody, ...guide.qualification, ...guide.faqs.map((faq) => `${faq.q} ${faq.a}`)].join('\n');
      assert.doesNotMatch(text, forbidden, guide.slug);
    }
  });

  it('covers the Alabama cities without inventing customer counts or reviews', () => {
    const guide = getAvaGuide('ai-receptionist-for-hvac-and-plumbing-in-alabama');
    assert.ok(guide);
    const text = guideText('ai-receptionist-for-hvac-and-plumbing-in-alabama');
    for (const city of ['Gadsden', 'Birmingham', 'Huntsville', 'Cullman', 'Decatur', 'Tuscaloosa', 'Montgomery', 'Florence']) {
      assert.match(text, new RegExp(city));
    }
    assert.match(text, /Hanceville/);
    assert.doesNotMatch(text, /\b\d+\s+(customers|reviews|shops|clients)\b/i);
    assert.equal(guide.cityNotes?.length, 8);
  });

  it('keeps the cost comparison factual and unsourced competitor prices out', () => {
    const guide = getAvaGuide('ai-receptionist-vs-answering-service');
    assert.ok(guide?.costRows && guide.costRows.length >= 5);
    const text = guideText('ai-receptionist-vs-answering-service');
    assert.match(text, /Bureau of Labor Statistics|BLS/);
    assert.match(text, /\$79/);
    assert.doesNotMatch(text, /cheaper than all|lowest price in the industry/i);
  });

  it('lists the new pages in the Executive Receptionist sitemap, their one home', () => {
    const paths = executiveReceptionistSitemap('https://executivereceptionist.com', new Date('2026-11-19T12:00:00-06:00')).map((entry) =>
      new URL(entry.url).pathname,
    );
    for (const slug of QUESTION_SLUGS) {
      assert.ok(paths.includes(`/ava/${slug}`), slug);
    }
    const hosted = sitemapForHost('executivereceptionist.com').map((entry) => new URL(entry.url).pathname);
    for (const slug of QUESTION_SLUGS) {
      assert.ok(hosted.includes(`/ava/${slug}`), `host sitemap missing ${slug}`);
    }
    const frontPorch = frontPorchGrowthSitemap('https://frontporchgrowth.com', new Date('2026-11-19T12:00:00-06:00')).map((entry) =>
      new URL(entry.url).pathname,
    );
    for (const slug of QUESTION_SLUGS) assert.equal(frontPorch.includes(`/ava/${slug}`), false, slug);
  });
});
