import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { SampleCalls } from '@/components/ava-home/SampleCalls';
import { HeroDemoPicker } from '@/components/suite/HeroDemoPicker';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { AVA_OFFER } from '@/lib/ava/pricing';
import { StorePricing } from '@/components/ava/StorePricing';
import { AVA_STORE_OFFER } from '@/lib/ava/store-pricing';
import { avaStoreOfferNode, faqNode } from '@/lib/ava/structured-data';
import { EXECUTIVE_INDUSTRIES } from '@/lib/executive-receptionist';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import styles from './start.module.css';

const seo = pageSeo('/start');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/start' },
  openGraph: { title, description, url: '/start', siteName: 'Ava by Front Porch Growth', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

const HOME_SERVICES = [
  ['HVAC', 'No-cool and no-heat calls'],
  ['Plumbing', 'Leaks, clogs, water heaters'],
  ['Roofing', 'Storm damage and leaks'],
  ['Electrical', 'Outages and panel work'],
  ['Lawn care', 'Mowing and cleanup quotes'],
  ['Landscaping', 'Install and design estimates'],
  ['Pest control', 'Same-day visit requests'],
  ['House cleaning', 'Recurring and move-out cleans'],
  ['Pool service', 'Openings, repairs, weekly care'],
  ['Garage door', 'Stuck doors and broken springs'],
  ['Appliance repair', 'Washer, fridge, oven calls'],
  ['Pressure washing', 'Driveways, siding, decks'],
  ['Tree service', 'Limbs down and removals'],
  ['Fencing', 'New fence and repair quotes'],
  ['Painting', 'Interior and exterior estimates'],
  ['Handyman', 'Small jobs and punch lists'],
  ['Locksmith', 'Lockouts and rekeys'],
  ['Solar', 'Consult requests and service'],
  ['Gutters', 'Cleaning and guards'],
  ['Water damage', 'Emergency mitigation calls'],
  ['Septic', 'Pumping and backups'],
  ['Moving', 'Date and size quotes'],
  ['Junk removal', 'Pickup requests'],
  ['Auto repair', 'No-starts and drop-offs'],
] as const;

const ECOM_HANDLES = [
  'Where is my order? Order status and delivery windows',
  'Shipping costs, speeds, and the states you ship to',
  'Missing tracking emails',
  'How to start a return or exchange, and refund timing',
  'Sizing and fit questions from your size chart',
  'Store hours and how to reach a person',
];

const ECOM_ESCALATES = [
  'Damaged or wrong item received',
  'Marked delivered but never arrived',
  'Double charges and charges they do not recognize',
  'Cancel requests on orders that may have shipped',
  'Wholesale and bulk orders',
  'Anyone who asks for a manager',
];

const COMPARE = [
  ['How the bill is counted', 'Per minute, per call, or per caller', 'Per booked job, with a $297 monthly cap'],
  ['Spam and wrong numbers', 'Count toward the bill on most per-call and per-minute plans', 'Never billed. Only booked jobs are'],
  ['Hear it before you pay', 'Often a sales demo first', 'Six sample calls, a call-in line, and a browser demo on this page'],
  ['Guarantee', 'Rare', 'No real caller lead in 14 days, you pay nothing'],
  ['Setup', 'Do it yourself', `Done with you in person in ${AVA_OFFER.setupCity}`],
] as const;

/** Published plans, read from each company's own pricing page on the date below. */
const VENDOR_PLANS_CHECKED = 'November 10, 2026';
const VENDOR_PLANS = [
  { name: 'Smith.ai AI Receptionist', bills: 'Each answered call (spam counts by default; up to 10% can be removed)', entry: 'Free for 25 calls/mo, then $3 per call. Pro $150/mo for 75 calls', href: 'https://smith.ai/pricing/ai-receptionist' },
  { name: 'Upfirst', bills: 'Each call (spam, silent, and very short calls are free)', entry: '$24.95/mo for 30 calls', href: 'https://upfirst.ai/pricing' },
  { name: 'Goodcall', bills: 'Each unique caller per month', entry: '$79/mo for 100 callers', href: 'https://www.goodcall.com/pricing' },
  { name: 'Rosie', bills: 'Minutes, rounded up on every call', entry: '$49/mo for 250 minutes', href: 'https://heyrosie.com/pricing' },
  { name: 'Dialzara', bills: 'Minutes', entry: '$29/mo for 60 minutes', href: 'https://dialzara.com/pricing' },
  { name: 'My AI Front Desk', bills: 'Minutes', entry: '$99/mo with 200 minutes, then per minute', href: 'https://www.myaifrontdesk.com/tutorials/how-does-billing-pricing-work-for-my-ai-front-desk' },
  { name: 'Ruby (live receptionists)', bills: 'Receptionist minutes, in 30-second increments', entry: '$250/mo for 50 minutes', href: 'https://www.ruby.com/plans-and-pricing/' },
] as const;

const FAQS = [
  {
    q: 'What does Ava cost?',
    a: `Home-service shops: ${AVA_OFFER.summary} ${AVA_OFFER.guarantee} Online stores: ${AVA_STORE_OFFER.summary}`,
  },
  {
    q: 'What does the online store plan cost?',
    a: `${AVA_STORE_OFFER.priceLine}. ${AVA_STORE_OFFER.summary} ${AVA_STORE_OFFER.callDefinition}`,
  },
  {
    q: 'What counts as a booked job?',
    a: 'Work you put on your calendar that started from a caller Ava already handled. You mark it booked on your desk. Spam, wrong numbers, and callers who never book cost nothing.',
  },
  {
    q: 'Can I hear her first?',
    a: `Yes. Play the sample calls above, call the demo line at ${AVA_DEMO_LINE.display} (she answers as ${AVA_DEMO_LINE.answersAs}), or talk to her in your browser. No card needed for any of them.`,
  },
  {
    q: 'Does she work for online stores?',
    a: 'Yes. She answers order-status, shipping, return, and sizing calls from the policies you give her, and passes the calls that need a person to your team with the caller’s name, number, order number, and the reason. She cannot see your order system unless it is connected during setup, so until then she takes a message for anything order-specific. Stores pay $119 a month plus $1 for each call she handles, after a free 14-day trial.',
  },
  {
    q: 'Is Ava a person?',
    a: 'No. Ava is an AI receptionist, and her greeting says so. She answers inbound calls only and never makes cold calls or sends cold texts.',
  },
  {
    q: 'Do I need an account to buy?',
    a: 'No. Start the pilot from checkout. You can sign in to your desk after setup to see her leads.',
  },
  {
    q: 'Does she work for dentists, law firms, and other offices?',
    a: 'Yes, with the questions you approve. She is not a HIPAA product and does not give legal, medical, or financial advice.',
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'Ava AI receptionist',
      description: 'AI phone receptionist for home-service businesses and online stores.',
      brand: { '@type': 'Brand', name: 'Front Porch Growth' },
      offers: [
        {
          '@type': 'Offer',
          name: 'Home services: free 14-day pilot, then $25 per booked job (max $297/month)',
          price: '25.00',
          priceCurrency: 'USD',
          description: AVA_OFFER.summary,
        },
        avaStoreOfferNode('/start#ecommerce'),
      ],
    },
    faqNode([...FAQS]),
  ],
};

function PilotButton({ className, children }: { className: string; children: string }) {
  return (
    <TrackedCheckoutLink className={className} href="/api/checkout?plan=pilot" plan="pilot">
      {children}
    </TrackedCheckoutLink>
  );
}

export default function StartPage() {
  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className={styles.top}>
        <Link className={styles.brand} href="/">
          <span aria-hidden="true">A</span> Ava <small>AI receptionist</small>
        </Link>
        <a className={styles.topCall} href={AVA_DEMO_LINE.href}>
          Call Ava {AVA_DEMO_LINE.display}
        </a>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>For home-service shops and online stores</p>
        <h1>Every call answered. Every real lead sent to you.</h1>
        <p className={styles.lede}>
          Ava is an AI receptionist. She picks up when you can’t, handles the routine questions, and passes you the
          callers who need a person, with their name, number, and what they need.
        </p>
        <div className={styles.heroActions}>
          <PilotButton className={styles.cta}>Start the free 14-day pilot</PilotButton>
          <a className={styles.callCta} href={AVA_DEMO_LINE.href}>
            Call Ava now: {AVA_DEMO_LINE.display}
          </a>
        </div>
        <ul className={styles.trust} aria-label="The offer">
          <li>Free 14-day pilot</li>
          <li>$0 until your first booked job</li>
          <li>{AVA_OFFER.perBookedJobLabel} per booked job, max {AVA_OFFER.monthlyCapLabel}/mo</li>
          <li>No real lead in the pilot? You pay nothing</li>
        </ul>
        <p className={styles.fine}>
          Online store? <a href="#ecommerce">{AVA_STORE_OFFER.priceLine}</a>, with its own free 14-day trial.
        </p>
        <div className={styles.picker}>
          <HeroDemoPicker label="Hear Ava for your business" />
        </div>
        <p className={styles.fine}>
          The call-in line answers as {AVA_DEMO_LINE.answersAs}. Browser demos ask for your microphone. Every demo
          business is fictional.
        </p>
      </section>

      <section className={styles.section} id="compare">
        <p className={styles.kicker}>Why Ava</p>
        <h2>Priced on results, not minutes.</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col"><span className={styles.srOnly}>Question</span></th>
                <th scope="col">Typical AI answering service</th>
                <th scope="col">Ava</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, typical, ava]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{typical}</td>
                  <td><b>{ava}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          “Typical” describes the per-minute, per-call, and per-caller plans that most AI receptionist companies publish.
        </p>

        <h3 className={styles.subhead}>What the others publish</h3>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.compareVendors}`}>
            <caption className={styles.srOnly}>Published starting plans of other AI receptionist services</caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">What you pay for</th>
                <th scope="col">Published starting plan</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.usRow}>
                <th scope="row">Ava (home services)</th>
                <td>Booked jobs only</td>
                <td>{`Free ${AVA_OFFER.pilotDays}-day pilot, then $0 until your first booked job, ${AVA_OFFER.perBookedJobLabel} per booked job, capped at ${AVA_OFFER.monthlyCapLabel}/month`}</td>
              </tr>
              <tr className={styles.usRow}>
                <th scope="row">Ava (online stores)</th>
                <td>A monthly fee plus calls Ava handles; calls she flags as spam or a wrong number are free</td>
                <td>{AVA_STORE_OFFER.priceLine}</td>
              </tr>
              {VENDOR_PLANS.map((vendor) => (
                <tr key={vendor.name}>
                  <th scope="row">
                    <a href={vendor.href} target="_blank" rel="noopener noreferrer nofollow">{vendor.name}</a>
                  </th>
                  <td>{vendor.bills}</td>
                  <td>{vendor.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          Read from each company’s own pricing page on {VENDOR_PLANS_CHECKED}. Prices change, so check the linked page.
          Several of these services book appointments on your calendar during the call; Ava takes the details and you
          book the job. Names are trademarks of their owners; no endorsement implied.
        </p>
      </section>

      <section className={styles.section} id="home-services">
        <p className={styles.kicker}>Home services</p>
        <h2>Built for the trades that answer the phone with full hands.</h2>
        <ul className={styles.trades}>
          {HOME_SERVICES.map(([name, line]) => (
            <li key={name}>
              <b>{name}</b>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.section} ${styles.ecom}`} id="ecommerce">
        <p className={styles.kicker}>E-commerce</p>
        <h2>Stop answering “where’s my order?” all day.</h2>
        <p className={styles.lede}>
          Most store calls are the same few questions. Ava answers them from your policies, around the clock, and only
          sends you the calls that need a person.
        </p>
        <div className={styles.ecomGrid}>
          <div>
            <h3>Ava handles</h3>
            <ul className={styles.checks}>
              {ECOM_HANDLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Ava passes to your team</h3>
            <ul className={styles.arrows}>
              {ECOM_ESCALATES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.note}>
              Each one arrives with the caller’s name, number, order number, and a short reason. She never takes card
              numbers.
            </p>
          </div>
        </div>
        <div className={styles.ecomActions}>
          <a className={styles.callCta} href="#sample-ecommerce">
            Hear a store call
          </a>
          <a className={styles.callCta} href="https://elevenlabs.io/app/talk-to?agent_id=agent_7301m727915ke55syb59xd04s1m4" target="_blank" rel="noopener noreferrer">
            Talk to the store demo
          </a>
        </div>
        <div className={styles.storePrice}>
          <StorePricing />
          <p className={styles.note}>
            Questions about a store setup? Call Cole at{' '}
            <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a>.
          </p>
        </div>
      </section>

      <section className={styles.section} id="samples">
        <p className={styles.kicker}>Listen</p>
        <h2>Six sample calls. Press play.</h2>
        <SampleCalls order={['ecommerce', 'hvac', 'plumbing', 'roofing', 'electrical', 'auto-repair']} />
      </section>

      <section className={styles.section} id="also">
        <p className={styles.kicker}>Also works for</p>
        <h2>Offices that live on the phone, too.</h2>
        <ul className={styles.also}>
          {EXECUTIVE_INDUSTRIES.map((industry) => (
            <li key={industry.slug}>
              <b>{industry.name}</b>
              <span>{industry.line}</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>Ava is not a HIPAA product and does not give legal, medical, or financial advice.</p>
      </section>

      <section className={`${styles.section} ${styles.offer}`} id="pricing">
        <p className={styles.kicker}>The offer</p>
        <h2>Try her free for 14 days.</h2>
        <p className={styles.note}>Home-service pricing. Online stores have their own plan: <a href="#ecommerce">{AVA_STORE_OFFER.priceLine}</a>.</p>
        <ol className={styles.offerSteps}>
          <li><b>Days 1–14:</b> free pilot. Your card is on file, nothing is charged.</li>
          <li><b>After the pilot:</b> $0 until your first booked job.</li>
          <li><b>Then:</b> {AVA_OFFER.perBookedJobLabel} per booked job, never more than {AVA_OFFER.monthlyCapLabel} a month.</li>
        </ol>
        <p className={styles.guarantee}>{AVA_OFFER.guarantee}</p>
        <PilotButton className={styles.cta}>Start the free 14-day pilot</PilotButton>
        <p className={styles.note}>No account needed to buy. Setup is done with you in person in {AVA_OFFER.setupCity}.</p>
      </section>

      <section className={styles.section} id="faq">
        <p className={styles.kicker}>Questions</p>
        <h2>Straight answers.</h2>
        <div className={styles.faq}>
          {FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          Questions for a person? Call Cole at <a href={AVA_OFFER.contactPhoneHref}>{AVA_OFFER.contactPhoneDisplay}</a> or email{' '}
          <a href={`mailto:${AVA_OFFER.contactEmail}`}>{AVA_OFFER.contactEmail}</a>.
        </p>
        <p>{AVA_OFFER.footerLine}</p>
        <nav aria-label="Legal">
          <Link href="/">Front Porch Growth</Link>
          <Link href="/login?next=/desk">Customer sign in</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>

      <div className={styles.stickyBar}>
        <a href={AVA_DEMO_LINE.href}>Call Ava</a>
        <PilotButton className={styles.stickyCta}>Start free pilot</PilotButton>
      </div>
    </main>
  );
}
