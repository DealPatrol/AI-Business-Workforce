import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { EditorialShell } from '@/components/er/EditorialShell';
import styles from '@/components/er/editorial.module.css';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { GBP_BUNDLES, GBP_CARE, GBP_SETUP, bundleMonthlySavingsLabel, usd } from '@/lib/ava/gbp-packages';
import { AVA_OFFER, AVA_PLAN_INCLUDES, AVA_PLAN_KEYS, AVA_PLANS } from '@/lib/ava/pricing';
import { avaOfferNodes, avaOrganization, faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { executiveReceptionistUrl } from '@/lib/site-url';

const PATH = '/receptionist/packages';
const seo = pageSeo(PATH);
const title = renderedTitle(seo);
const url = executiveReceptionistUrl(PATH);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  alternates: { canonical: url },
  openGraph: { images: ['/og-default.png'], title, description: seo.description, url, siteName: 'Executive Receptionist', type: 'website' },
  twitter: { card: 'summary_large_image', title, description: seo.description, images: ['/og-default.png'] },
};

const DIRECT_ANSWER = `Executive Receptionist publishes every price. Ava, the AI receptionist, is ${AVA_PLAN_KEYS.map((k) => `${AVA_PLANS[k].label} ${AVA_PLANS[k].monthlyLabel}`).join(', ')} a month (Starter's first month is $1). Google Business Profile care is ${GBP_CARE.care.monthlyLabel} or ${GBP_CARE.carePlus.monthlyLabel}, and the three Ava + Google profile bundles run ${GBP_BUNDLES.map((b) => `${usd(b.monthlyCents)}`).join(', ')} a month with the ${usd(GBP_SETUP.priceCents)} profile setup included. Month to month, cancel anytime. Run by Cole Collins in Hanceville, Alabama.`;

const FAQS = [
  {
    q: 'How much does an AI receptionist cost for a small trade business?',
    a: `${AVA_OFFER.summary} There is no setup fee for Ava and no contract.`,
  },
  {
    q: 'What is Google Business Profile management, and what does it cost here?',
    a: `It is keeping your Google profile current every week: posts, hours, services, photos and review replies. ${GBP_CARE.care.label} is ${GBP_CARE.care.monthlyLabel} (4 posts a month and drafted review replies). ${GBP_CARE.carePlus.label} is ${GBP_CARE.carePlus.monthlyLabel} (8 posts a month and every review answered for you). The one-time setup alone is ${GBP_SETUP.priceLabel}.`,
  },
  {
    q: 'Why bundle an AI receptionist with Google profile care?',
    a: 'Most calls to a trade shop start on the Google profile: the caller sees the listing and taps call. Profile care keeps that listing complete and active, and Ava answers when the call comes in while you are on a job or after hours. One fixes being found, the other fixes the missed call.',
  },
  {
    q: 'Do you guarantee a map ranking or a number of calls?',
    a: 'No. Nobody can honestly promise a Google ranking or call volume. We keep the profile complete and accurate, which is what Google says it looks at, and Ava answers the calls that do come in.',
  },
  {
    q: 'Do you serve Alabama trades in person?',
    a: 'Executive Receptionist is run by Cole Collins from Hanceville, in Cullman County. Setup is done by phone and email for shops anywhere in Alabama and the rest of the U.S. There is no separate Alabama rate.',
  },
  {
    q: 'Can I hear Ava before I buy?',
    a: `Yes. Call ${AVA_DEMO_LINE.display}; she answers as ${AVA_DEMO_LINE.answersAs}. Or book a 15-minute demo with Cole.`,
  },
];

function bundleOffers() {
  return GBP_BUNDLES.map((b) => ({
    '@type': 'Offer',
    name: `${b.label}: Ava ${AVA_PLANS[b.plan].label} + ${GBP_CARE[b.care].label}`,
    price: (b.monthlyCents / 100).toFixed(2),
    priceCurrency: 'USD',
    url: `${url}#bundles`,
    description: `${AVA_PLANS[b.plan].minutesLabel} of AI receptionist answering plus ${GBP_CARE[b.care].label}. Google profile setup included.`,
    priceSpecification: { '@type': 'UnitPriceSpecification', price: (b.monthlyCents / 100).toFixed(2), priceCurrency: 'USD', unitText: 'month' },
  }));
}

const structured = jsonLdGraph([
  {
    '@type': 'OfferCatalog',
    name: 'Executive Receptionist: AI receptionist and Google Business Profile packages',
    url,
    itemListElement: [...avaOfferNodes(`${url}#ava`), ...bundleOffers()],
  },
  {
    '@type': 'Service',
    name: 'AI receptionist and Google Business Profile management for trades',
    serviceType: 'AI answering service',
    url,
    provider: avaOrganization(),
    areaServed: [{ '@type': 'State', name: 'Alabama' }, { '@type': 'Country', name: 'United States' }],
  },
  faqNode(FAQS),
]);

export default function PackagesPage() {
  return (
    <EditorialShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <main>
        <section className={styles.hero}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Packages · Priced in public</p>
            <h1>
              Get <em>found</em> on Google. Get <em>answered</em> when they call.
            </h1>
            <p className={styles.answer}>{DIRECT_ANSWER}</p>
            <div className={styles.ctaRow}>
              <Link className={styles.btnInk} href="/receptionist/book-a-demo">
                Book a 15-minute demo
              </Link>
              <TrackedCheckoutLink className={styles.btnBrass} href="/api/checkout?plan=starter" plan="starter">
                Start Ava for $1
              </TrackedCheckoutLink>
              <a className={styles.btnGhost} href={AVA_DEMO_LINE.href}>
                Call the demo line {AVA_DEMO_LINE.display}
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section} id="bundles">
          <div className={styles.wrap}>
            <p className={styles.kicker}>Bundles · Ava + Google profile</p>
            <h2>One bill for the listing and the phone.</h2>
            <p>
              Each bundle includes the {GBP_SETUP.priceLabel} Google profile setup at no charge, then a flat monthly price that is
              less than buying the two separately. Bundles start after a short setup call, so the button books that call.
            </p>
            <div className={styles.grid}>
              {GBP_BUNDLES.map((b) => {
                const plan = AVA_PLANS[b.plan];
                const care = GBP_CARE[b.care];
                return (
                  <article key={b.key} className={`${styles.card} ${b.badge === 'Most shops start here' ? styles.cardFeatured : ''}`}>
                    {b.badge ? <span className={styles.badge}>{b.badge}</span> : null}
                    <h3>{b.label}</h3>
                    <p className={styles.price}>
                      {usd(b.monthlyCents)}
                      <small>/month</small>
                    </p>
                    <p className={styles.note}>
                      <span className={styles.strike}>{usd(b.separateCents)}</span> separately · save {bundleMonthlySavingsLabel(b)}/mo + {usd(GBP_SETUP.priceCents)} setup
                    </p>
                    <p className={styles.note}>{b.bestFor}</p>
                    <ul className={styles.list}>
                      <li>
                        Ava {plan.label}: {plan.minutesLabel} a month
                      </li>
                      <li>{care.label}</li>
                      {care.features.slice(care.features[0]?.startsWith('Everything') ? 1 : 0, 4).map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                      <li>Google profile setup included</li>
                    </ul>
                    <Link className={styles.btnInk} href={`/receptionist/book-a-demo?package=${encodeURIComponent(b.label)}`}>
                      Book a demo for {b.label}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.section} id="ava">
          <div className={styles.wrap}>
            <p className={styles.kicker}>Ava alone · AI receptionist</p>
            <h2>Five plans, sold by the minute you need.</h2>
            <p>{AVA_OFFER.overageNote}</p>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Minutes</th>
                    <th>Price</th>
                    <th>Per minute</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {AVA_PLAN_KEYS.map((key) => {
                    const plan = AVA_PLANS[key];
                    return (
                      <tr key={key}>
                        <td>
                          <strong>{plan.label}</strong>
                          {plan.badge ? <div className={styles.note}>{plan.badge}</div> : null}
                        </td>
                        <td>{plan.minutesLabel}</td>
                        <td>
                          {plan.monthlyLabel}/mo{plan.firstMonthLabel ? ` (first month ${plan.firstMonthLabel})` : ''}
                          {plan.overageLabel ? <div className={styles.note}>{plan.overageLabel}</div> : null}
                        </td>
                        <td>{plan.perMinuteLabel}</td>
                        <td>
                          <TrackedCheckoutLink className={styles.btnGhost} href={`/api/checkout?plan=${key}`} plan={key}>
                            Start {plan.label}
                          </TrackedCheckoutLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className={styles.list} style={{ marginTop: 18 }}>
              {AVA_PLAN_INCLUDES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section} id="google-profile">
          <div className={styles.wrap}>
            <p className={styles.kicker}>Google profile alone · GBP care</p>
            <h2>Keep the listing alive every week.</h2>
            <p>
              Already have a receptionist? Profile care works on its own. You keep the owner role on the profile; we are added as a
              manager. No keyword-stuffed business names and no review gating.
            </p>
            <div className={styles.grid}>
              <article className={styles.card}>
                <h3>{GBP_SETUP.label}</h3>
                <p className={styles.price}>
                  $99<small> one time</small>
                </p>
                <p className={styles.note}>Categories, services, description, photos, hours, and a review link with QR code.</p>
                <a className={styles.btnGhost} href={GBP_SETUP.href}>
                  See setup details
                </a>
              </article>
              {(['care', 'carePlus'] as const).map((key) => {
                const care = GBP_CARE[key];
                return (
                  <article key={key} className={styles.card}>
                    <h3>{care.label}</h3>
                    <p className={styles.price}>
                      {care.monthlyLabel.replace('/mo', '')}
                      <small>/month</small>
                    </p>
                    <ul className={styles.list}>
                      {care.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <Link className={styles.btnInk} href={`/receptionist/book-a-demo?package=${encodeURIComponent(care.label)}`}>
                      Start {care.label}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.section} id="compare">
          <div className={styles.wrap}>
            <p className={styles.kicker}>How it compares</p>
            <h2>What Google profile management costs elsewhere.</h2>
            <p>
              Published prices for done-for-you management of one location, read on each provider’s own pricing page on November
              24, 2026. Prices change; check the page before you buy.
            </p>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Published monthly price</th>
                    <th>AI receptionist included?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <a href="https://gbizpro.com/pricing" rel="nofollow noopener">GBizPro</a>
                    </td>
                    <td>$89 Essentials, $179 Managed</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://beelisted.com/services/" rel="nofollow noopener">BeeListed</a>
                    </td>
                    <td>$149 monthly management</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://l3adsolutions.com/services/google-business-profile" rel="nofollow noopener">L3ad Solutions</a>
                    </td>
                    <td>$150 Starter, $300 Growth</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td>
                      <a href="https://localpanda.ai/google-business-profile-management/" rel="nofollow noopener">LocalPanda</a>
                    </td>
                    <td>$199 for one location</td>
                    <td>No</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Executive Receptionist</strong>
                    </td>
                    <td>
                      {GBP_CARE.care.monthlyLabel} or {GBP_CARE.carePlus.monthlyLabel}; bundles from {usd(GBP_BUNDLES[0]?.monthlyCents ?? 0)}
                    </td>
                    <td>Yes, in every bundle</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={styles.note} style={{ marginTop: 12 }}>
              Comparing AI receptionists instead? See <Link href="/compare">Ava vs other answering services</Link>.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.faq}`}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Questions</p>
            <h2>Straight answers.</h2>
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
            <div className={styles.ctaRow}>
              <Link className={styles.btnInk} href="/receptionist/book-a-demo">
                Find my package in 30 seconds
              </Link>
            </div>
          </div>
        </section>
      </main>
    </EditorialShell>
  );
}
