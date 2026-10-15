import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COMPARISON_AS_OF, COMPARISON_FACTS, COMPARISON_SOURCES } from '@/lib/comparison/facts';

describe('comparison facts', () => {
  it('dates the check and gives every row a source URL', () => {
    assert.equal(COMPARISON_AS_OF, '2026-10-13');
    for (const fact of COMPARISON_FACTS) {
      assert.match(fact.sourceUrl, /^https:\/\//);
      assert.ok(fact.publishedPrice.length > 40);
      assert.equal(fact.publishedPrice.includes('#1'), false);
    }
  });

  it('publishes postcard and receptionist prices without Demo Blast 10', () => {
    const ours = COMPARISON_FACTS.find((fact) => fact.name === 'Front Porch Growth');
    assert.ok(ours);
    assert.match(ours.publishedPrice, /\$127/);
    assert.match(ours.publishedPrice, /\$3\.54/);
    assert.match(ours.publishedPrice, /\$4\.95/);
    assert.match(ours.publishedPrice, /\$77/);
    assert.match(ours.publishedPrice, /\$168/);
    assert.match(ours.publishedPrice, /\$324/);
    assert.equal(/demo blast/i.test(ours.publishedPrice), false);
    assert.equal(ours.publishedPrice.includes('$64'), false);
  });

  it('lists the competitor source pages', () => {
    const urls = COMPARISON_SOURCES.map((source) => source.url);
    assert.ok(urls.some((url) => url.includes('getjobber.com')));
    assert.ok(urls.some((url) => url.includes('smith.ai')));
    assert.ok(urls.some((url) => url.includes('tryreputationflow.com')));
  });
});
