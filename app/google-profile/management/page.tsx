import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ProfileCareForm } from '@/components/fpg/ProfileCareForm';
import styles from '@/components/er/editorial.module.css';
import { GBP_BUNDLES, GBP_CARE, GBP_SETUP, usd } from '@/lib/ava/gbp-packages';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl, executiveReceptionistUrl } from '@/lib/site-url';

const PATH = '/google-profile/management';
const seo = pageSeo(PATH);
const title = renderedTitle(seo);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  alternates: { canonical: PATH },
  openGraph: { images: ['/og-default.png'], title, description: seo.description, url: PATH, siteName: 'Front Porch Growth', type: 'website' },
};

const DIRECT_ANSWER = `Google Business Profile management keeps your listing current every week: posts, hours, services, photos and review replies. At Front Porch Growth it is ${GBP_CARE.care.monthlyLabel} (${GBP_CARE.care.label}) or ${GBP_CARE.carePlus.monthlyLabel} (${GBP_CARE.carePlus.label}), month to month, after the ${GBP_SETUP.priceLabel} setup. Done-for-you providers that publish a price charge about $89 to $300 a month for one location. Run by Cole Collins in Hanceville, Alabama, for trades statewide.`;

const WEEK = [
  { name: 'Post', text: 'One Google post a week (two on Care Plus): a recent job, a seasonal reminder, or an offer you approve. Written for your trade and your towns.' },
  { name: 'Check the details', text: 'Hours, holiday hours, phone, services and service area checked against what you told us. Public “suggested edits” that are wrong get put back.' },
  { name: 'Answer reviews', text: 'Every new review gets a reply drafted in your voice (Care) or posted for you (Care Plus). No review gating, no fake reviews.' },
  { name: 'Report', text: 'Once a month: a one-page report from your profile’s own performance numbers (calls, direction requests, website clicks) and next month’s plan.' },
];

const FAQS = [
  {
    q: 'How much does Google Business Profile management cost?',
    a: `For one location, providers that publish a price charge about $89 to $300 a month (GBizPro $89 or $179, BeeListed $149, L3ad Solutions $150 or $300, LocalPanda $199; read Nov 24, 2026). Front Porch Growth is ${GBP_CARE.care.monthlyLabel} or ${GBP_CARE.carePlus.monthlyLabel}. The profile itself is free from Google.`,
  },
  {
    q: 'Do I need the $99 setup first?',
    a: `Setup is ${GBP_SETUP.priceLabel} and is charged with your first month: categories, services, description, photos, hours and a review QR code. Already paid for setup? Email hello@frontporchgrowth.com before you start and we will start you without it. Bundles with the Executive Receptionist AI receptionist include the setup.`,
  },
  {
    q: 'Who owns the profile?',
    a: 'You do. You keep the owner role and add us as a manager. Cancel any month and remove us in two taps.',
  },
  {
    q: 'Will this get me into the map pack?',
    a: 'Nobody can honestly promise a ranking. Google says relevance, distance and prominence drive local results. A complete, active profile with real photos and answered reviews covers the parts you control.',
  },
  {
    q: 'Do you work with Alabama trades outside Cullman County?',
    a: 'Yes. Everything is done remotely for HVAC, plumbing, roofing, electrical, lawn and other home-service shops anywhere in Alabama and the U.S. There is no separate local rate.',
  },
  {
    q: 'Can you answer the calls the profile brings in?',
    a: `Yes, through the sister brand Executive Receptionist. Its AI receptionist, Ava, answers missed and after-hours calls. Bundles start at ${usd(GBP_BUNDLES[0]?.monthlyCents ?? 0)} a month with the profile setup included.`,
  },
];

const structured = jsonLdGraph([
  {
    '@type': 'Service',
    name: 'Google Business Profile management',
    serviceType: 'Google Business Profile management',
    url: absoluteSiteUrl(PATH),
    description: seo.description,
    provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
    areaServed: [{ '@type': 'State', name: 'Alabama' }, { '@type': 'Country', name: 'United States' }],
    offers: (['care', 'carePlus'] as const).map((key) => ({
      '@type': 'Offer',
      name: GBP_CARE[key].label,
      price: (GBP_CARE[key].monthlyCents / 100).toFixed(2),
      priceCurrency: 'USD',
      url: absoluteSiteUrl(PATH),
      priceSpecification: { '@type': 'UnitPriceSpecification', price: (GBP_CARE[key].monthlyCents / 100).toFixed(2), priceCurrency: 'USD', unitText: 'month' },
    })),
  },
  {
    '@type': 'HowTo',
    name: 'What weekly Google Business Profile management includes',
    step: WEEK.map((s) => ({ '@type': 'HowToStep', name: s.name, text: s.text })),
  },
  faqNode(FAQS),
]);

type PageProps = { searchParams: Promise<{ checkout?: string | string[] }> };

export default async function GoogleProfileManagementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <div className={styles.page} style={{ minHeight: 0 }}>
        <section className={styles.hero}>
          <div className={styles.wrap}>
            {checkout === 'success' ? (
              <p className={styles.answer} role="status">
                Payment received. Thank you. Cole will email you within one business day to get manager access to your Google
                profile and start setup.
              </p>
            ) : checkout === 'unavailable' ? (
              <p className={styles.answer} role="status">
                Online checkout is not available right now. Send the form below or email hello@frontporchgrowth.com.
              </p>
            ) : null}
            <p className={styles.kicker}>Google Business Profile · Monthly care</p>
            <h1>
              Your Google listing, <em>kept alive</em> every week.
            </h1>
            <p className={styles.answer}>{DIRECT_ANSWER}</p>
            <div className={styles.ctaRow}>
              <a className={styles.btnInk} href="#start">
                Start profile care
              </a>
              <Link className={styles.btnGhost} href="/google-profile">
                One-time setup, $99
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Plans</p>
            <h2>Two tiers. Month to month.</h2>
            <div className={styles.grid}>
              {(['care', 'carePlus'] as const).map((key) => {
                const care = GBP_CARE[key];
                return (
                  <article key={key} className={`${styles.card} ${key === 'carePlus' ? styles.cardFeatured : ''}`}>
                    {key === 'carePlus' ? <span className={styles.badge}>Reviews handled</span> : null}
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
                    <TrackedCheckoutLink className={styles.btnInk} href={`/api/checkout?offer=gbp&plan=${key.toLowerCase()}`} plan={key}>
                      Start {care.label}
                    </TrackedCheckoutLink>
                    <p className={styles.note}>Today: {usd(care.monthlyCents + GBP_SETUP.priceCents)} ($99 setup + first month).</p>
                  </article>
                );
              })}
              <article className={styles.card}>
                <span className={styles.badge}>With an AI receptionist</span>
                <h3>Bundles with Ava</h3>
                <p className={styles.price}>
                  {usd(GBP_BUNDLES[0]?.monthlyCents ?? 0)}
                  <small>/month and up</small>
                </p>
                <ul className={styles.list}>
                  {GBP_BUNDLES.map((b) => (
                    <li key={b.key}>
                      {b.label}: {usd(b.monthlyCents)}/mo (Ava {AVA_PLANS[b.plan].label} + {GBP_CARE[b.care].label})
                    </li>
                  ))}
                  <li>$99 profile setup included</li>
                </ul>
                <a className={styles.btnGhost} href={executiveReceptionistUrl('/receptionist/packages')}>
                  See bundles on Executive Receptionist
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Every week</p>
            <h2>What the work actually is.</h2>
            <ol className={styles.steps}>
              {WEEK.map((s) => (
                <li key={s.name}>
                  <span>
                    <strong>{s.name}.</strong> {s.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.wrap}>
            <p className={styles.kicker}>Compared</p>
            <h2>Published prices for one location.</h2>
            <p>Done-for-you Google Business Profile management, read on each provider’s own pricing page on November 24, 2026.</p>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Monthly</th>
                    <th>Setup</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><a href="https://gbizpro.com/pricing" rel="nofollow noopener">GBizPro</a></td>
                    <td>$89 Essentials · $179 Managed</td>
                    <td>$349 one time, or free in month one</td>
                  </tr>
                  <tr>
                    <td><a href="https://beelisted.com/services/" rel="nofollow noopener">BeeListed</a></td>
                    <td>$149</td>
                    <td>$349 one time</td>
                  </tr>
                  <tr>
                    <td><a href="https://l3adsolutions.com/services/google-business-profile" rel="nofollow noopener">L3ad Solutions</a></td>
                    <td>$150 Starter · $300 Growth</td>
                    <td>$250 one time</td>
                  </tr>
                  <tr>
                    <td><a href="https://localpanda.ai/google-business-profile-management/" rel="nofollow noopener">LocalPanda</a></td>
                    <td>$199</td>
                    <td>See their page</td>
                  </tr>
                  <tr>
                    <td><strong>Front Porch Growth</strong></td>
                    <td>
                      {GBP_CARE.care.monthlyLabel.replace('/mo', '')} {GBP_CARE.care.label} · {GBP_CARE.carePlus.monthlyLabel.replace('/mo', '')} {GBP_CARE.carePlus.label}
                    </td>
                    <td>{GBP_SETUP.priceLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={styles.note} style={{ marginTop: 10 }}>Prices change; check each page before you buy.</p>
          </div>
        </section>

        <section className={styles.section} id="start">
          <div className={styles.wrap}>
            <p className={styles.kicker}>Start</p>
            <h2>Questions first? Send your profile.</h2>
            <p>Ready now? Use a Start button above to check out with a card. Want Cole to look first? Send this and he replies by email.</p>
            <ProfileCareForm source="google-profile/management" />
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
          </div>
        </section>
      </div>
    </SuiteShell>
  );
}
