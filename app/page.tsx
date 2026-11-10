import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { InvoicingWaitlistForm } from '@/components/suite/InvoicingWaitlistForm';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/home.module.css';
import { LIVE_DEMO_PHONE_DISPLAY, LIVE_DEMO_PHONE_HREF } from '@/lib/ava/demo-phone';
import { AVA_PLANS } from '@/lib/ava/pricing';
import { faqNode } from '@/lib/ava/structured-data';
import { POSTCARD_FULFILLMENT_COPY, POSTCARD_PRICE_SUMMARY, POSTCARD_SIZES, postcardPublicOffers } from '@/lib/postcards/pricing';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const seo = pageSeo('/');
const title = renderedTitle(seo);
const description = seo.description;

const starter = AVA_PLANS.starter;
const growth = AVA_PLANS.growth;
const pro = AVA_PLANS.pro;

const HOME_FAQS = [
  {
    q: 'What does this actually do for my service business?',
    a: 'Two things. Executive Receptionist answers the calls you cannot pick up, takes the caller’s name, number, and what the job is, then sends that lead to you so you can call back and book it. YardMailer puts designed postcards in front of homeowners so the phone rings in the first place. Neither one promises a number of jobs.',
  },
  {
    q: 'Is this only for lawn care?',
    a: 'No. It was built by a lawn care owner and is used on a lawn care line every week, but the same call flow works for plumbing, HVAC, roofing, cleaning, pressure washing, tree service, fencing, pest control, electrical, painting, and pool work. The questions it asks, the greeting, and where the lead goes are all written per business.',
  },
  {
    q: 'Is the receptionist a person?',
    a: 'No. Executive Receptionist is an AI phone receptionist, and the greeting says so. It answers with words you approve, asks the questions you approve, and sends you the lead. It does not pretend to be a human, and it does not quote a price you have not published.',
  },
  {
    q: 'Does it book the job for me?',
    a: 'It captures the lead and sends it to you; you confirm the time and book the work. It is not a scheduling system and it does not replace Jobber, Housecall Pro, or ServiceTitan. Several of those are compared on the compare page.',
  },
  {
    q: 'What does it cost?',
    a: 'Executive Receptionist is $77, $168, or $324 a month after a free 7-day trial, with a $0 setup fee. YardMailer is a $127 one-time setup, charged once per customer, plus $3.54 per 4×6 card or $4.95 per 6×9 card. Those are separate products with separate checkouts; there is no combined price.',
  },
  {
    q: 'Can I hear it before I pay?',
    a: `Yes. Call the public demo line at ${LIVE_DEMO_PHONE_DISPLAY} and it answers as a sample HVAC company, or talk to it in the browser on the demo page. Neither is your business line, and the demo company is made up.`,
  },
  {
    q: 'Does the invoicing form email me?',
    a: 'No. The form saves the email, and any name or business you add, on a private list. Joining does not start a subscription and does not send you email.',
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/' },
  openGraph: { images: ['/og-default.png'],
    title,
    description,
    url: '/',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
  twitter: { images: ['/og-default.png'],
    card: 'summary_large_image',
    title,
    description,
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${absoluteSiteUrl('/')}#org`,
      name: 'Front Porch Growth',
      url: absoluteSiteUrl('/'),
      logo: absoluteSiteUrl('/brand-logo.png'),
      description: 'Phone answering and postcard marketing for home-service businesses, built by a lawn care owner.',
      email: 'hello@frontporchgrowth.com',
      makesOffer: [
        ...postcardPublicOffers(absoluteSiteUrl('/postcards')),
        {
          '@type': 'Offer',
          name: 'Executive Receptionist, plans from $77/month after a 7-day trial',
          url: absoluteSiteUrl('/receptionist'),
        },
      ],
    },
    { '@type': 'WebSite', name: 'Front Porch Growth', url: absoluteSiteUrl('/'), publisher: { '@id': `${absoluteSiteUrl('/')}#org` } },
    faqNode([...HOME_FAQS]),
  ],
};

const BUSINESS_TYPES = [
  'Plumbers',
  'HVAC',
  'Roofers',
  'Cleaners',
  'Pressure washing',
  'Lawn care',
  'Landscaping',
  'Tree service',
  'Fencing',
  'Pest control',
  'Electricians',
  'Painters',
];

const FITS = [
  { label: 'Lawn care & landscaping', detail: 'Weekly routes and cleanups', href: '/trades/lawn-care' },
  { label: 'Plumbers', detail: 'Leaks and callbacks', href: '/trades/plumbers' },
  { label: 'HVAC', detail: 'No-heat, no-cool calls', href: '/trades/hvac' },
  { label: 'Roofers', detail: 'Storm and leak intake', href: '/trades/roofers' },
  { label: 'Cleaning companies', detail: 'Recurring and move-outs', href: '/trades/cleaners' },
  { label: 'Pressure washing', detail: 'Driveways and siding', href: '/postcards/pressure-washing' },
  { label: 'Pest control', detail: 'Same-day visits', href: '/ava/ai-answering-service-for-pest-control' },
  { label: 'Electricians', detail: 'Outages and panel work', href: '/ava/ai-answering-service-for-electricians' },
  { label: 'Tree service', detail: 'Limbs and storm cleanup', href: '/ava/ai-answering-service-for-tree-service' },
  { label: 'Fencing', detail: 'Privacy and repair quotes', href: '/ava/ai-answering-service-for-fencing' },
  { label: 'Pool companies', detail: 'Openings and service calls', href: '/ava/ai-answering-service-for-pool-companies' },
  { label: 'Garage doors', detail: 'Stuck doors and springs', href: '/ava/ai-answering-service-for-garage-door' },
];

const STEPS = [
  {
    number: '01',
    title: 'The phone rings while you work',
    detail: 'You are on a mower, under a sink, or up a ladder. Nobody at the shop can reach the phone.',
  },
  {
    number: '02',
    title: 'The AI receptionist answers',
    detail: 'It greets the caller, says it is an AI receptionist, and asks the questions you wrote for your trade.',
  },
  {
    number: '03',
    title: 'You get the call summary',
    detail: 'Name, number, address, and what they need, sent to you before the caller has moved on.',
  },
  {
    number: '04',
    title: 'You call back and book it',
    detail: 'You keep the pricing and the calendar. The lead is waiting instead of sitting in a voicemail box.',
  },
];

export default function SuiteHomePage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, '\\u003c') }} />

      <section className={styles.hero} id="start">
        <div>
          <span className={styles.eyebrow}>FOR SERVICE BUSINESSES THAT LIVE ON THE PHONE</span>
          <h1>More booked jobs. No more calls that go unanswered.</h1>
          <p className={styles.lede}>
            Front Porch Growth answers the calls you cannot pick up, writes down what the caller needs, and sends it to
            you so you can follow up fast. It also mails postcards that keep the phone ringing. Built by a lawn care
            owner who runs it on his own business.
          </p>
          <div className={styles.actions}>
            <TrackedCheckoutLink className={styles.primary} href="/api/checkout?plan=starter" plan="starter">
              Start the 7-day free trial
            </TrackedCheckoutLink>
            <a className={styles.secondary} href="#services">
              Explore our services
            </a>
          </div>
          <p className={styles.fine}>
            Executive Receptionist is an AI phone receptionist, disclosed to every caller. {starter.monthlyLabel},{' '}
            {growth.monthlyLabel}, or {pro.monthlyLabel} a month after the trial, $0 setup. YardMailer postcards are a
            separate product: {POSTCARD_PRICE_SUMMARY} <Link href="/pricing">All published prices</Link>.
          </p>
        </div>

        <aside className={styles.phone} aria-label="Example of the lead summary a business receives">
          <div className={styles.phoneHead}>
            <small>What you get</small>
            <b>New lead · summary</b>
          </div>
          <div className={styles.bubbles}>
            <div className={styles.bubble}>
              <span className={styles.bubbleLabel}>Caller said</span>
              “Hi, I need a price on mowing a half-acre in town, and maybe the beds cleaned up.”
            </div>
            <div className={`${styles.bubble} ${styles.bubbleMine}`}>
              <span className={styles.bubbleLabel}>Sent to you</span>
              Example caller · 7:42 PM · half-acre mowing + bed cleanup · wants a call back this week
            </div>
            <div className={styles.bubble}>
              <span className={styles.bubbleLabel}>You</span>
              Call back, confirm the price, put it on the route.
            </div>
          </div>
          <p className={styles.phoneFoot}>
            A made-up example of the lead summary, not a real customer or recorded call. What the receptionist asks is
            written for your trade.
          </p>
        </aside>
      </section>

      <section className={styles.strip} aria-label="Business types this is designed for">
        <span className={styles.stripLabel}>Designed for</span>
        {BUSINESS_TYPES.map((type) => (
          <span key={type} className={styles.chip}>
            {type}
          </span>
        ))}
      </section>

      <section className={styles.band} id="services">
        <span className={styles.kicker}>Front Porch Growth services</span>
        <h2 className={styles.h2}>Find more customers. Make every opportunity count.</h2>
        <p className={styles.body}>
          From a personalized postcard to the call that follows, explore ways to reach customers and keep your business moving.
          Choose a tool below or contact us to discuss your goals.
        </p>
        <ul className={styles.alsoGrid}>
          <li className={styles.also}>
            <h3>AI Receptionists</h3>
            <p>Answer calls and capture leads when you are busy. Executive Receptionist takes the details so you can follow up.</p>
            <Link href="/receptionist">Explore the receptionist</Link>
          </li>
          <li className={styles.also}>
            <h3>Current &amp; Future Postcards</h3>
            <p>Show homeowners their property today alongside an AI-generated concept of what it could become. Each card can link to an estimate request.</p>
            <Link href="/postcards">Explore postcards</Link>
          </li>
          <li className={styles.also}>
            <h3>Websites &amp; Landing Pages</h3>
            <p>Give customers a professional place to discover your business and request a quote.</p>
            <a href="mailto:hello@frontporchgrowth.com?subject=Website%20and%20landing%20page%20inquiry">Ask about websites</a>
          </li>
          <li className={styles.also}>
            <h3>Lead Generation</h3>
            <p>Find potential customers and build a starting point for outreach. Lead Scout searches public business listings by trade and city.</p>
            <Link href="/lead-scout">Explore Lead Scout</Link>
          </li>
          <li className={styles.also}>
            <h3>Follow-Ups</h3>
            <p>Keep opportunities moving with tools for drafting follow-up messages and a missed-call text-back option.</p>
            <Link href="/missed-call">Explore missed-call text-back</Link>
          </li>
          <li className={styles.also}>
            <h3>Social Media &amp; Content</h3>
            <p>Discuss content that helps people discover your business and understand what you offer.</p>
            <a href="mailto:hello@frontporchgrowth.com?subject=Social%20media%20and%20content%20inquiry">Ask about content</a>
          </li>
          <li className={styles.also}>
            <h3>Growth Strategy</h3>
            <p>Discuss a practical approach to reaching more customers and growing your business.</p>
            <a href="mailto:hello@frontporchgrowth.com?subject=Growth%20strategy%20inquiry">Discuss your goals</a>
          </li>
        </ul>
      </section>

      <section className={styles.band} id="founder">
        <div className={styles.split}>
          <div>
            <span className={styles.kicker}>Who built this</span>
            <h2 className={styles.h2}>A lawn care owner built it because he was missing his own calls.</h2>
            <p className={styles.body}>
              Cole Collins runs Collins Lawncare: mowing, Christmas light installation, and pressure washing. That is a
              job where the phone rings while both hands are busy and the caller does not wait around.
            </p>
            <p className={styles.body}>
              He built it for a line like his own, and his own line runs on it. The receptionist taking a lawn care call
              and the lead summary landing mid-job are the same setup sold on this page, not a demo assembled for a
              sales page.
            </p>
            <p className={styles.body}>
              The same setup is sold to other service businesses. The trade changes the questions and the greeting. It
              does not change the point, which is that the call gets answered and the job gets written down.
            </p>
          </div>
          <div className={styles.founderCard}>
            <span className={styles.founderRole}>Founder</span>
            <p className={styles.founderName}>Cole Collins</p>
            <p className={styles.founderBiz}>Collins Lawncare</p>
            <ul className={styles.serviceRow}>
              <li>Mowing</li>
              <li>Christmas light installation</li>
              <li>Pressure washing</li>
            </ul>
            <p className={styles.founderNote}>
              Collins Lawncare has a Google Business Profile you can look up yourself.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.band} id="bundle">
        <div className={styles.bundleHead}>
          <div>
            <span className={styles.kicker}>The two-piece setup</span>
            <h2 className={styles.h2}>Answer the call, then go get more of them.</h2>
          </div>
          <p>
            One piece catches the calls you already get. The other puts your business in front of homeowners who did not
            know you existed. You can start with the phone and add mail when the calendar has room.
          </p>
        </div>

        <div className={styles.offerGrid}>
          <article className={styles.offer}>
            <span className={styles.offerTag}>Piece one · the phone</span>
            <h3 className={styles.h3}>Executive Receptionist</h3>
            <p className={styles.offerPrice}>
              {starter.monthlyLabel} / {growth.monthlyLabel} / {pro.monthlyLabel} a month
            </p>
            <p className={styles.offerMeta}>
              Free 7-day trial, $0 setup. An AI phone receptionist that answers missed and after-hours calls, takes the
              job details, and sends you the lead. The greeting tells callers it is an AI receptionist.
            </p>
            <ul className={styles.offerFeatures}>
              <li>Answers 24/7, including nights and weekends</li>
              <li>Asks the questions you approve for your trade</li>
              <li>Sends you the name, number, and job</li>
              <li>{starter.minutes} to {pro.minutes.toLocaleString('en-US')} included voice minutes by plan</li>
            </ul>
            <div className={styles.offerActions}>
              <TrackedCheckoutLink className={styles.primary} href="/api/checkout?plan=starter" plan="starter">
                Start free 7-day trial
              </TrackedCheckoutLink>
              <Link className={styles.textLink} href="/receptionist">
                See the receptionist
              </Link>
            </div>
          </article>

          <article className={styles.offer}>
            <span className={styles.offerTag}>Piece two · the mail</span>
            <h3 className={styles.h3}>YardMailer postcards</h3>
            <p className={styles.offerPrice}>
              $127 setup, then {POSTCARD_SIZES['4x6'].unitLabel} or {POSTCARD_SIZES['6x9'].unitLabel} per card
            </p>
            <p className={styles.offerMeta}>
              {POSTCARD_FULFILLMENT_COPY} Each card carries a QR page where the homeowner can request an estimate, so a
              postcard can turn into a phone call that the receptionist answers.
            </p>
            <ul className={styles.offerFeatures}>
              <li>Pick the streets you actually want to work</li>
              <li>AI designs the card, you approve it before it mails</li>
              <li>Postage, printing, and mailing included</li>
              <li>4×6 or 6×9, packs of 100, 250, 500, or a custom count</li>
            </ul>
            <div className={styles.offerActions}>
              <Link className={styles.primary} href="/postcards#packages">
                See postcard packages
              </Link>
              <Link className={styles.textLink} href="/postcards">
                How postcards work
              </Link>
            </div>
          </article>
        </div>

        <p className={styles.bundleNote}>
          Two pieces, two published prices, two checkouts. Start with the phone and add the mail later, or the other way
          around. Buying one never signs you up for the other. The $127 postcard setup is charged once per customer and
          is left off a later order when a paid setup is already on the account.
        </p>
      </section>

      <section className={styles.band} id="mailer">
        <div className={styles.mailWrap}>
          <figure className={styles.cardArt}>
            <Image
              src="/postcard-yard.png"
              alt="Labeled example postcard showing a current yard beside a landscaped version"
              width={900}
              height={600}
              sizes="(max-width: 980px) 90vw, 46vw"
            />
            <figcaption>An example card concept. The left side is the yard as it is; the right side is the idea.</figcaption>
          </figure>
          <div>
            <span className={styles.kicker}>Why postcards belong with the phone</span>
            <h2 className={styles.h2}>A card starts the conversation. The receptionist makes sure it lands.</h2>
            <p className={styles.body}>
              A postcard asks a homeowner to look at their own yard and picture the work done. If the card works, they
              call or scan the QR. If nobody answers that call, the card was postage spent for nothing.
            </p>
            <p className={styles.body}>
              That is the whole argument for using both. Mail creates the call; the receptionist keeps the call from
              turning into a voicemail. You still approve the concept, the streets, and the cost before anything is
              printed.
            </p>
            <ul className={styles.list}>
              <li>You approve every card before it mails. Nothing goes out on its own.</li>
              <li>The QR page asks the homeowner for the estimate, so a scan is trackable.</li>
              <li>Every call the card produces gets answered, even when you are on a job.</li>
            </ul>
            <div className={styles.actions}>
              <Link className={styles.secondary} href="/postcards#packages">
                Pick a card package
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.band} id="how-it-works">
        <span className={styles.kicker}>How the phone piece works</span>
        <h2 className={styles.h2}>From a ringing phone to a booked job, in one thread.</h2>
        <p className={styles.body}>
          These are the four steps every customer gets, in whatever words fit the trade. The receptionist never invents
          a price and never promises a time you have not offered.
        </p>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.number} className={styles.step}>
              <span className={styles.stepNum}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.band} id="fit">
        <span className={styles.kicker}>Who it fits</span>
        <h2 className={styles.h2}>If your business runs on phone calls, this is built for you.</h2>
        <p className={styles.body}>
          Lawn care is the example on this page because it is the owner’s own trade. The same setup is used by other
          service businesses that cannot answer the phone with both hands full.
        </p>
        <ul className={styles.fitGrid}>
          {FITS.map((fit) => (
            <li key={fit.label}>
              <Link className={styles.fit} href={fit.href}>
                <span>{fit.label}</span>
                <small>{fit.detail}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="also">
        <span className={styles.kicker}>Also on the site</span>
        <h2 className={styles.h2}>The rest of the tools, if you need them.</h2>
        <ul className={styles.alsoGrid}>
          <li className={styles.also}>
            <h3>ReputationFlow</h3>
            <p>Ask for a review after a finished job and draft the reply. The public review links are the same no matter the rating.</p>
            <span className={styles.alsoMeta}>Free starter, or $20/month</span>
            <Link href="/reputation">How reviews work</Link>
          </li>
          <li className={styles.also}>
            <h3>Lead Scout</h3>
            <p>Search public Google listings by trade and city. It shows the results and does not email or text anyone.</p>
            <span className={styles.alsoMeta}>No separate price</span>
            <Link href="/lead-scout">Search a city</Link>
          </li>
          <li className={styles.also}>
            <h3>Writing agents</h3>
            <p>Draft an estimate, a review reply, a job ad, a follow-up text, a service-area page, or an invoice reminder. You copy the draft; nothing sends.</p>
            <span className={styles.alsoMeta}>Included on the site</span>
            <Link href="/agents">Open the agents</Link>
          </li>
          <li className={styles.also}>
            <h3>Lead Finder</h3>
            <p>A signed-in workspace for buyer lists and outreach drafts. Every send stays approved, capped, and off until you turn it on.</p>
            <span className={styles.alsoMeta}>Operator workspace</span>
            <Link href="/dashboard/prospector">Sign in to Lead Finder</Link>
          </li>
          <li className={styles.also}>
            <h3>Missed-Call Text-Back</h3>
            <p>A lighter option: when you miss a call, the caller gets a text from your business. It texts, it does not answer.</p>
            <span className={styles.alsoMeta}>$39/month</span>
            <Link href="/missed-call">See text-back</Link>
          </li>
          <li className={styles.also} id="invoicing">
            <h3>Invoicing</h3>
            <p>Estimates and invoices for the jobs these tools bring in. Join the list and we save it. This form does not send email.</p>
            <InvoicingWaitlistForm />
          </li>
        </ul>
      </section>

      <section className={styles.band} id="tour">
        <span className={styles.kicker}>A short look</span>
        <h2 className={styles.h2}>The pages, in about a minute.</h2>
        <p className={styles.body}>
          The video walks the site. It is not a customer testimonial, and there are no client results in it.
        </p>
        <div className={styles.tour}>
          <video controls playsInline preload="metadata" aria-label="Front Porch Growth product tour">
            <source src="/suite-tour.mp4" type="video/mp4" />
          </video>
          <p className={styles.tradeLinks}>
            Trade pages: <Link href="/trades/lawn-care">lawn care</Link>, <Link href="/trades/plumbers">plumbers</Link>,{' '}
            <Link href="/trades/hvac">HVAC</Link>, <Link href="/trades/roofers">roofers</Link>,{' '}
            <Link href="/trades/cleaners">cleaners</Link>. Guides:{' '}
            <Link href="/ava/ai-answering-service-for-landscapers">landscapers</Link>,{' '}
            <Link href="/ava/ai-answering-service-for-lawn-care">lawn care</Link>. After-hours:{' '}
            <Link href="/receptionist/missed-calls">missed calls</Link>.{' '}
            <a href={LIVE_DEMO_PHONE_HREF}>Demo line {LIVE_DEMO_PHONE_DISPLAY}</a>.
          </p>
        </div>
      </section>

      <section className={styles.wideFaq} id="faq">
        <span className={styles.kicker}>Before you pay</span>
        <h2>Straight answers.</h2>
        {HOME_FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.closing}>
        <span className={styles.kicker}>Start with the phone</span>
        <h2>The next call is the one that pays for this.</h2>
        <p>
          Run the receptionist for a week on your own line and see what it catches. Add postcards when you want more
          calls rather than just fewer missed ones. Prices are published; there is no quote to sit through.
        </p>
        <div className={styles.actions}>
          <TrackedCheckoutLink className={styles.primary} href="/api/checkout?plan=starter" plan="starter">
            Start the 7-day free trial
          </TrackedCheckoutLink>
          <Link className={styles.secondary} href="/pricing">
            See every price
          </Link>
        </div>
        <p className={styles.closingFine}>
          Executive Receptionist is an AI receptionist; callers are told. Questions go to{' '}
          <a href="mailto:colecollins763@gmail.com">colecollins763@gmail.com</a>.
        </p>
      </section>
    </SuiteShell>
  );
}

