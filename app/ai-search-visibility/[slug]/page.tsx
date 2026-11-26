import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/visibility/visibility.module.css';
import { GapReportForm } from '@/components/visibility/GapReportForm';
import { MoneyQuestionBuilder } from '@/components/visibility/MoneyQuestionBuilder';
import { frontPorchLocalBusiness } from '@/lib/ava/structured-data';
import { AEO_CHECKED_LABEL, FPG_AEO_PAGES, getFpgAeoPage } from '@/lib/fpg/aeo-pages';
import { AEO_PRICES_FOOTER, MONTHLY_OFFERS } from '@/lib/fpg/aeo-offer';
import { FPG_PUBLIC_PHONE } from '@/lib/fpg/site';
import { breadcrumbNode } from '@/lib/fpg/seo';
import { absoluteSiteUrl } from '@/lib/site-url';

const HUB = '/ai-search-visibility';
const CONTACT = 'hello@frontporchgrowth.com';
const reportHref = (label: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(`Competitor Gap Report request (${label})`)}&body=${encodeURIComponent(
    'Business name:\nWebsite:\nCity or towns you serve:\nTrade (HVAC, plumbing, electrical, roofing, other):\nBest phone or email to send the report to:\n',
  )}`;

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return FPG_AEO_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getFpgAeoPage(slug);
  if (!page) return {};
  const path = `${HUB}/${page.slug}`;
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      siteName: 'Front Porch Growth',
      type: 'article',
      images: [{ url: '/og-ai-visibility.png', width: 1200, height: 630, alt: page.h1 }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: ['/og-ai-visibility.png'] },
  };
}

function jsonLd(slug: string) {
  const page = getFpgAeoPage(slug)!;
  const path = `${HUB}/${page.slug}`;
  const url = absoluteSiteUrl(path);
  const places = page.areaServed.map((name) =>
    name === 'Alabama' ? { '@type': 'State', name } : name.endsWith('County') ? { '@type': 'AdministrativeArea', name } : { '@type': 'City', name },
  );
  const business = { ...frontPorchLocalBusiness(places.filter((place) => place['@type'] !== 'State')), '@id': `${absoluteSiteUrl('/')}#business` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        isPartOf: { '@type': 'WebSite', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
        about: { '@id': `${url}#service` },
      },
      business,
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: page.serviceName,
        serviceType: 'Answer engine optimization (AEO) for local service businesses',
        description: page.directAnswer,
        url,
        areaServed: places,
        provider: { '@id': `${absoluteSiteUrl('/')}#business` },
        offers: [
          { '@type': 'Offer', name: 'AI Visibility Gap Report', price: 0, priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Citation Sprint', price: 497, priceCurrency: 'USD' },
          ...MONTHLY_OFFERS.map(({ name, price }) => ({
            '@type': 'Offer',
            name,
            price,
            priceCurrency: 'USD',
            priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', unitText: 'MONTH' },
          })),
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: page.faqs.map((faq) => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })),
      },
      ...(page.howTo
        ? [
            {
              '@type': 'HowTo',
              '@id': `${url}#howto`,
              name: page.howTo.name,
              totalTime: page.howTo.totalTime,
              estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: 0 },
              step: page.howTo.steps.map((step, index) => ({
                '@type': 'HowToStep',
                position: index + 1,
                name: step.name,
                text: step.text,
                url: `${url}#step-${index + 1}`,
              })),
            },
          ]
        : []),
      breadcrumbNode([
        { name: 'Home', path: '/' },
        { name: 'AI search visibility', path: HUB },
        { name: page.navLabel, path },
      ]),
    ],
  };
}

export default async function AiSearchVisibilityGuidePage({ params }: Props) {
  const { slug } = await params;
  const page = getFpgAeoPage(slug);
  if (!page) notFound();
  const related = page.related.map((s) => getFpgAeoPage(s)!).filter(Boolean);
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(page.slug)).replace(/</g, '\\u003c') }} />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div>
            <span className={styles.eyebrow}>{page.eyebrow}</span>
            <h1 id="hero-title">{page.h1}</h1>
            <p className={styles.lede}>{page.directAnswer}</p>
            <div className={styles.actions}>
              <a className={styles.primary} href={reportHref(page.navLabel)}>
                Request my free Gap Report
              </a>
              <Link className={styles.secondary} href="/ai-visibility">
                Or grade my site free
              </Link>
            </div>
            <p className={styles.fine}>
              <Link href={HUB}>AI search visibility</Link> by Front Porch Growth, Hanceville, Alabama. Observations dated {AEO_CHECKED_LABEL}.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="checks-title">
          <span className={styles.eyebrow}>{page.checksEyebrow ?? 'WHAT WE SAW'}</span>
          <h2 id="checks-title">{page.checksTitle}</h2>
          <ul className={styles.wont}>
            {page.checks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="questions-title">
          <span className={styles.eyebrow}>QUESTIONS</span>
          <h2 id="questions-title">{page.questionsTitle}</h2>
          <ul className={styles.wont}>
            {page.questions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {page.howTo ? (
          <section className={styles.section} aria-labelledby="howto-title">
            <span className={styles.eyebrow}>STEP BY STEP</span>
            <h2 id="howto-title">{page.howTo.name}</h2>
            <ol className={styles.wont}>
              {page.howTo.steps.map((step, index) => (
                <li key={step.name} id={`step-${index + 1}`}>
                  <b>
                    {index + 1}. {step.name}.
                  </b>{' '}
                  {step.text}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {page.questionBuilder ? (
          <section className={styles.section} aria-labelledby="builder-title">
            <span className={styles.eyebrow}>FREE TOOL</span>
            <h2 id="builder-title">Build your money questions</h2>
            <p className={styles.sectionLede}>Pick your trade and towns. Copy the questions, then paste each one into a fresh chat in ChatGPT, Perplexity and Google.</p>
            <MoneyQuestionBuilder />
          </section>
        ) : null}

        <section className={styles.section} aria-labelledby="work-title">
          <span className={styles.eyebrow}>WHAT WE DO</span>
          <h2 id="work-title">The work, in plain terms</h2>
          <div className={styles.cards}>
            {page.sections.map((item) => (
              <article key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <p className={styles.sectionLede}>
            {AEO_PRICES_FOOTER} <Link href={`${HUB}#pricing`}>See every plan</Link>.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="faq-title">
          <span className={styles.eyebrow}>QUESTIONS</span>
          <h2 id="faq-title">Straight answers</h2>
          <div className={styles.faq}>
            {page.faqs.map((faq) => (
              <details key={faq.q}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sources-title">
          <span className={styles.eyebrow}>SOURCES</span>
          <h2 id="sources-title">Sources and related pages</h2>
          <ul className={styles.wont}>
            {page.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noopener" target="_blank">
                  {source.label}
                </a>
              </li>
            ))}
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`${HUB}/${item.slug}`}>{item.h1}</Link>
              </li>
            ))}
            <li>
              <Link href={HUB}>AI search visibility plans and guarantee</Link>
            </li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="gap-form-title" id="gap-report">
          <span className={styles.eyebrow}>FREE GAP REPORT</span>
          <h2 id="gap-form-title">Want us to run the check for you?</h2>
          <p className={styles.sectionLede}>
            We ask 8 questions your customers ask, show who AI names instead of you, compare your profile, reviews and listings with theirs, and list the 5 fixes that matter most. Free.
          </p>
          <GapReportForm source={page.navLabel} />
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">See who AI names in your town, and what it would take to add you.</h2>
          <p>Send your business name, website and town. Cole Collins, Front Porch Growth, Hanceville, Alabama. {FPG_PUBLIC_PHONE}.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href={reportHref(page.navLabel)}>
              Request my free Gap Report
            </a>
            <Link className={styles.secondary} href={HUB}>
              See plans
            </Link>
          </div>
        </section>
      </main>
    </SuiteShell>
  );
}
