import assert from 'node:assert/strict';
import test from 'node:test';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { getBlogFaqs, rubyPlans, rubyPriceRange } from '@/lib/blog/faqs';
import { ER_GUIDE_POSTS } from '@/lib/blog/er-guides';

test('Ruby FAQ prices and per-minute math come from the competitor data', () => {
  const plans = rubyPlans();
  assert.deepEqual(plans, [
    { minutes: 50, price: 250 },
    { minutes: 100, price: 395 },
    { minutes: 200, price: 720 },
    { minutes: 500, price: 1725 },
  ]);
  const faqs = getBlogFaqs('ruby-receptionist-pricing');
  assert.equal(faqs.length, 4);
  assert.match(faqs[0].a, /\$250 a month for 50 minutes/);
  assert.match(faqs[1].a, /\$3\.95 on the 100-minute plan/);
  assert.match(faqs[1].a, /\$3\.45 on the 500-minute plan/);
  assert.equal(rubyPriceRange(), '$250 for 50 minutes to $1,725 for 500');
});

test('Ava prices in blog FAQs match AVA_PLANS and use only the public demo line', () => {
  for (const slug of ['ruby-receptionist-pricing', 'smith-ai-pricing']) {
    const text = getBlogFaqs(slug).map((f) => `${f.q} ${f.a}`).join(' ');
    assert.ok(text.includes(`${AVA_PLANS.starter.monthlyLabel} a month for ${AVA_PLANS.starter.minutesLabel}`), slug);
    assert.ok(text.includes('(256) 952-4935'), slug);
    assert.ok(!text.includes('663-7007'), slug);
    assert.ok(!/transfer|hand ?off|live person/i.test(text), slug);
  }
});

test('posts without FAQs return none, and pricing post metas fit', () => {
  assert.deepEqual(getBlogFaqs('missed-call-text-back-vs-ai-receptionist'), []);
  for (const slug of ['ruby-receptionist-pricing', 'smith-ai-pricing']) {
    const post = ER_GUIDE_POSTS.find((p) => p.slug === slug);
    assert.ok(post);
    assert.ok(post.metaTitle.length <= 60, post.metaTitle);
    assert.ok(post.description.length <= 160, post.description);
  }
});
