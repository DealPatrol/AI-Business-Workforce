import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUSINESS_PAGES,
  BUSINESS_PAGE_SLUGS,
  DESK_CALENDAR_LINE,
  FORBIDDEN_BUSINESS_COPY,
  businessPageDetails,
  businessPageFaqs,
} from '@/lib/ava/business-pages';
import { pageSeo } from '@/lib/seo/pages';

function pageText(slug: (typeof BUSINESS_PAGE_SLUGS)[number]) {
  const page = BUSINESS_PAGES[slug];
  return [
    page.eyebrow,
    page.headline,
    page.hook,
    ...page.calls.flatMap((call) => [call.title, call.caller, call.ava]),
    ...businessPageDetails(page),
    ...businessPageFaqs(page).flatMap((faq) => [faq.q, faq.a]),
    pageSeo(page.path).title,
    pageSeo(page.path).description,
  ].join('\n');
}

describe('all-business Ava pages', () => {
  it('has a general page plus six industry pages, each with its own path', () => {
    assert.equal(BUSINESS_PAGE_SLUGS.length, 7);
    for (const slug of BUSINESS_PAGE_SLUGS) assert.equal(BUSINESS_PAGES[slug].path, `/${slug}`);
  });

  it('uses only the approved Desk calendar sentence', () => {
    assert.equal(
      DESK_CALENDAR_LINE('visits'),
      'Once your calendar is set up in the Desk, she books routine visits into your Desk calendar during the call.',
    );
    for (const slug of BUSINESS_PAGE_SLUGS) assert.doesNotMatch(pageText(slug), /calendar/i, slug);
  });

  it('never mentions texting, transfers, other languages, pilots, or compliance claims', () => {
    for (const slug of BUSINESS_PAGE_SLUGS) {
      const text = pageText(slug);
      for (const pattern of FORBIDDEN_BUSINESS_COPY) assert.doesNotMatch(text, pattern, `${slug}: ${pattern}`);
    }
  });

  it('credits every owner quote to a public thread', () => {
    for (const slug of BUSINESS_PAGE_SLUGS) {
      const page = BUSINESS_PAGES[slug];
      assert.ok(page.voices.length > 0, slug);
      for (const voice of page.voices) assert.match(voice.href, /^https:\/\/www\.reddit\.com\/r\//);
    }
  });

  it('answers questions on every page, with plan prices that match pricing', () => {
    for (const slug of BUSINESS_PAGE_SLUGS) {
      const faqs = businessPageFaqs(BUSINESS_PAGES[slug]);
      assert.ok(faqs.length >= 3, slug);
      const cost = faqs.find((faq) => faq.q === 'How much does Ava cost?');
      assert.ok(cost, slug);
      for (const label of ['Overflow $25', 'Starter $79', 'Growth $197', 'Pro $397', 'Elite $789']) assert.ok(cost.a.includes(label), `${slug}: ${label}`);
      assert.doesNotMatch(faqs.map((faq) => faq.a).join(' '), /663-?7007/);
    }
    assert.ok(BUSINESS_PAGES.law.faqs?.some((faq) => /after-hours answering service for law firms/i.test(faq.q)));
    assert.ok(BUSINESS_PAGES.dental.faqs?.some((faq) => /answering service for dentists/i.test(faq.q)));
  });
});
