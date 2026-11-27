import Link from 'next/link';
import { BusinessFactsGenerator } from '@/components/fpg/BusinessFactsGenerator';
import { JsonLd } from '@/components/fpg/Blocks';
import { FpgToolPage } from '@/components/fpg/ToolPage';
import styles from '@/components/fpg/fpg.module.css';
import { GapReportForm } from '@/components/visibility/GapReportForm';
import { BUSINESS_FACTS_FAQS, BUSINESS_FACTS_PATH as PATH, BUSINESS_FACTS_SOURCES } from '@/lib/fpg/business-facts';
import { CITATION_SPRINT_PAYMENT_URL } from '@/lib/fpg/aeo-offer';
import { fpgMetadata } from '@/lib/fpg/seo';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

export const metadata = fpgMetadata(PATH);

const STEPS = [
  { name: 'Match your Google Business Profile', text: 'Type your business name, phone and towns exactly as they appear on your Google profile, so every copy says the same thing.' },
  { name: 'Publish the paragraph', text: 'Put the “business in brief” paragraph in visible text on your home or About page.' },
  { name: 'Paste the JSON-LD', text: 'Add the LocalBusiness JSON-LD to that same page, then check it with the Schema Markup Validator.' },
  { name: 'Use the same facts everywhere', text: 'Update Facebook, BBB, Apple Maps, Bing Places, Nextdoor and your state license record so the name, phone and service area match.' },
  { name: 'Optional: add llms.txt', text: 'Upload the starter llms.txt to the root of your site after replacing the placeholder links.' },
];

export default function Page() {
  const url = absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, PATH);
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: 'How to give AI search one clear set of facts about your business',
    totalTime: 'PT30M',
    step: STEPS.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, name: step.name, text: step.text })),
  };
  return (
    <FpgToolPage
      path={PATH}
      name="AI business facts generator"
      h1="Give AI search one clear set of facts about your business."
      lede="Short answer: AI answers lean on facts they can read and cross-check: your name, phone, towns and services in plain text, matching structured data, and an up-to-date Google profile. Type yours once and copy a business-in-brief paragraph, LocalBusiness JSON-LD and a starter llms.txt."
      how={[
        ...STEPS.map((step, i) => `${i + 1}. ${step.name}: ${step.text}`),
        'Google’s own guide says there is no special markup or AI text file needed for AI Overviews, and that structured data should match the visible text. That is why the paragraph comes first.',
      ]}
      faqs={BUSINESS_FACTS_FAQS}
      next={{ href: '/ai-search-visibility', label: 'See AI Search Visibility plans' }}
    >
      <JsonLd data={howTo} />
      <BusinessFactsGenerator />
      <section className={styles.section} id="gap-report">
        <span className={styles.kicker}>Want us to check?</span>
        <h2 className={styles.h2}>Free Gap Report: who AI names instead of you</h2>
        <p className={styles.body}>
          We ask 8 questions your customers ask, show who AI names, compare your profile, reviews and listings with theirs, and list the 5 fixes that matter most. Free and yours to keep. Want it done
          now? The <a href={CITATION_SPRINT_PAYMENT_URL}>$497 Citation Sprint</a> (10 business days) adds schema to your homepage and one service page, writes one answer-first page for your biggest gap, and gives you a Google profile and listings fix list.
        </p>
        <GapReportForm source="AI business facts generator" />
        <p className={styles.fine}>
          Sources:{' '}
          {BUSINESS_FACTS_SOURCES.map((s, i) => (
            <span key={s.url}>
              {i ? ' · ' : ''}
              <a href={s.url} rel="noreferrer">
                {s.label}
              </a>
            </span>
          ))}
          . Related: <Link href="/ai-search-visibility/check-if-ai-recommends-you">check if AI recommends you</Link>.
        </p>
      </section>
    </FpgToolPage>
  );
}
