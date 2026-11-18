import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeWebsite, parseRobots, robotsBlocksRoot } from '@/lib/grader/audit';
import { jsonLdNodes, metaBy, titleOf, typesOf, visibleText } from '@/lib/grader/html';
import { aiPrompts, liveAiEnabled } from '@/lib/grader/ai-checks';
import { tradeTerms } from '@/lib/grader/trades';

describe('grader html helpers', () => {
  const html = `<html><head><title> Smith &amp; Sons HVAC | Cullman </title>
    <meta name="description" content="Heating and air in Cullman, AL.">
    <meta property="og:title" content="Smith HVAC">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"HVACBusiness","name":"Smith HVAC","telephone":"256-555-0101"},{"@type":"WebSite"}]}</script>
    <script type="application/ld+json">{not json}</script>
    </head><body><h1>AC repair</h1><script>var hidden = "secret";</script><p>Call us</p></body></html>`;

  it('reads title, meta, and Open Graph', () => {
    assert.equal(titleOf(html), 'Smith & Sons HVAC | Cullman');
    assert.equal(metaBy(html, 'name', 'description'), 'Heating and air in Cullman, AL.');
    assert.equal(metaBy(html, 'property', 'og:title'), 'Smith HVAC');
  });

  it('flattens JSON-LD graphs and skips bad blocks', () => {
    const types = jsonLdNodes(html).flatMap(typesOf);
    assert.deepEqual(types, ['HVACBusiness', 'WebSite']);
  });

  it('drops script text from visible text', () => {
    assert.equal(visibleText(html).includes('secret'), false);
    assert.ok(visibleText(html).includes('Call us'));
  });
});

describe('grader robots parsing', () => {
  const robots = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: PerplexityBot\nUser-agent: OAI-SearchBot\nDisallow: /\nSitemap: https://example.com/sitemap.xml`;
  const parsed = parseRobots(robots);

  it('finds sitemap lines', () => {
    assert.deepEqual(parsed.sitemaps, ['https://example.com/sitemap.xml']);
  });

  it('applies named groups before the wildcard group', () => {
    assert.equal(robotsBlocksRoot(parsed.groups, 'Googlebot'), false);
    assert.equal(robotsBlocksRoot(parsed.groups, 'GPTBot'), true);
    assert.equal(robotsBlocksRoot(parsed.groups, 'PerplexityBot'), true);
    assert.equal(robotsBlocksRoot(parsed.groups, 'OAI-SearchBot'), true);
  });
});

describe('grader input handling', () => {
  it('adds https:// to bare domains and rejects junk', () => {
    assert.equal(normalizeWebsite('example.com'), 'https://example.com/');
    assert.throws(() => normalizeWebsite('not a site'));
    assert.throws(() => normalizeWebsite(''));
  });

  it('maps trades to search terms', () => {
    assert.ok(tradeTerms('HVAC / heating & air').terms.includes('furnace'));
    assert.ok(tradeTerms('drain cleaning').terms.includes('drain'));
  });

  it('keeps live AI checks off unless explicitly switched on', () => {
    const before = process.env.GRADER_LIVE_AI;
    delete process.env.GRADER_LIVE_AI;
    assert.equal(liveAiEnabled(), false);
    if (before !== undefined) process.env.GRADER_LIVE_AI = before;
    assert.equal(aiPrompts('Plumbing', 'Cullman, AL').length, 3);
  });
});
