import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Mail,
  MapPin,
  Palette,
  QrCode,
  Sparkles,
} from 'lucide-react';
import {
  POSTCARD_CTA,
  POSTCARD_FULFILLMENT_COPY,
  POSTCARD_PRICE_SUMMARY,
  postcardPublicOffers,
} from '@/lib/postcards/pricing';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';
import styles from './home.module.css';
import { PostcardPackagePicker } from './package-picker';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

const seo = pageSeo('/postcards');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/postcards' },
  openGraph: {
    title,
    description,
    url: '/postcards',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const steps = [
  {
    icon: MapPin,
    number: '01',
    title: 'Pick the streets',
    detail: 'Tell Cole the neighborhoods and landscaping jobs you want more of.',
  },
  {
    icon: Palette,
    number: '02',
    title: 'AI designs the card',
    detail: 'AI designs a postcard for the home, with the project concept and a QR estimate page.',
  },
  {
    icon: Mail,
    number: '03',
    title: 'Printed and mailed',
    detail: 'The card is printed and mailed directly to the homeowners. Postage, printing, and mailing are included.',
  },
  {
    icon: QrCode,
    number: '04',
    title: 'Turn scans into estimates',
    detail: 'Each QR page gives the homeowner a direct way to request an estimate.',
  },
];

const postcardJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'YardMailer postcards',
  description: `${POSTCARD_FULFILLMENT_COPY} ${POSTCARD_PRICE_SUMMARY}`,
  brand: { '@type': 'Brand', name: 'YardMailer' },
  url: absoluteSiteUrl('/postcards'),
  offers: postcardPublicOffers(absoluteSiteUrl('/postcards')),
};

export default function HomePage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postcardJsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className={styles.nav}>
        <Link className={styles.brand} href="/postcards">
          <span>
            <Sparkles size={17} />
          </span>
          YardMailer
        </Link>
        <div className={styles.navLinks}>
          <Link href="/">Front Porch Growth</Link>
          <a href="#how">How it works</a>
          <a href="#packages">Packages</a>
          <Link href="/visual-canvasser">See examples</Link>
        </div>
        <a className={styles.navCta} href="#packages">
          {POSTCARD_CTA}
        </a>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>PROPERTY-BASED POSTCARD CAMPAIGNS FOR HOME SERVICES</span>
          <h1>Show homeowners the yard project you could build for them.</h1>
          <p className={styles.lede}>
            {POSTCARD_FULFILLMENT_COPY} Each card includes postage, printing, and mailing, plus a
            QR page where the homeowner can request an estimate.
          </p>
          <div className={styles.priceLine}>
            <strong>$127 setup</strong>
            <span>once per customer, then $3.54 or $4.95 per card</span>
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#packages">
              See packages <ArrowRight size={18} />
            </a>
          </div>
          <p className={styles.heroNote}>
            The $127 setup fee is included unless you are signed in and a paid setup is already on your account. There is no monthly postcard plan.
          </p>
        </div>

        <div className={styles.postcard} aria-label="Labeled example postcard">
          <div className={styles.postcardImage}>
            <Image
              src="/postcard-yard.png"
              alt="Clearly labeled landscaping concept example"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 46vw"
            />
            <span>DEMO YARD CONCEPT</span>
          </div>
          <div className={styles.postcardCopy}>
            <small>EXAMPLE POSTCARD</small>
            <h2>A fresh idea for your front yard.</h2>
            <p>See the project concept and request a no-pressure estimate.</p>
            <div className={styles.qrExample}>
              <QrCode size={58} />
              <span>
                <b>Scan to view</b>
                <small>QR opens the estimate page</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trustBar}>
        <span>
          <Sparkles /> AI designs the card
        </span>
        <span>
          <Mail /> Printed and mailed to homeowners
        </span>
        <span>
          <Check /> $127 setup, once per customer
        </span>
      </section>

      <section className={styles.section} id="how">
        <div className={styles.sectionHeading}>
          <span>HOW IT WORKS</span>
          <h2>From a few streets to estimate requests.</h2>
          <p>A focused first campaign, set up with you instead of another app to figure out.</p>
        </div>
        <div className={styles.steps}>
          {steps.map(({ icon: Icon, number, title, detail }) => (
            <article key={number}>
              <div>
                <Icon size={21} />
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.exampleSection}>
        <div className={styles.exampleGrid}>
          <div className={styles.exampleVisual}>
            <div className={styles.exampleImage}>
              <Image
                src="/postcard-yard.png"
                alt="Demo landscaping concept used to explain the campaign"
                fill
                sizes="(max-width: 800px) 100vw, 52vw"
              />
              <span>ILLUSTRATIVE CONCEPT — NOT A LIVE ADDRESS LOOKUP</span>
            </div>
          </div>
          <div className={styles.takeoff}>
            <span>DEMO TAKEOFF EXAMPLE</span>
            <h2>Sell a project, not just a pretty picture.</h2>
            <p>
              A campaign concept can be paired with an estimated scope so your outreach stays
              grounded in work you actually want to sell.
            </p>
            <div className={styles.takeoffLines}>
              <div>
                <span>Compact evergreen shrubs</span>
                <b>7</b>
              </div>
              <div>
                <span>Flowering hydrangeas</span>
                <b>4</b>
              </div>
              <div>
                <span>Fresh mulch and edging</span>
                <b>Demo scope</b>
              </div>
            </div>
            <Link href="/property-demo">
              Explore the labeled project demo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.packageSection} id="package">
        <div className={styles.packageCopy}>
          <span>POSTCARD PACKAGES</span>
          <h2>Pick a size and a quantity.</h2>
          <p>{POSTCARD_FULFILLMENT_COPY}</p>
        </div>
        <PostcardPackagePicker />
      </section>

      <section className={styles.questions}>
        <div>
          <span>WANT TO TALK FIRST?</span>
          <h2>Ask Cole if this fits your service area.</h2>
          <p>No sales maze. Email the person who will help set up the campaign.</p>
        </div>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Question%20about%20the%20YardMailer%20postcard%20campaign`}>
          <Mail size={18} /> Email Cole
        </a>
      </section>

      <section className={styles.avaSection}>
        <div>
          <small>OPTIONAL ADD-ON</small>
          <h2>Want someone answering the leads your campaign creates?</h2>
          <p>
            Executive Receptionist is a separate AI receptionist add-on for businesses that want 24/7 call coverage. The postcard campaign remains the main service.
          </p>
        </div>
        <Link href="/ava">
          See Executive Receptionist add-on <ArrowRight size={16} />
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/postcards">
          <span>
            <Sparkles size={17} />
          </span>
          YardMailer
        </Link>
        <p>
          Cole · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <nav className={styles.footerLinks} aria-label="Site">
          <Link href="/">Front Porch Growth</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <a className={styles.footerPay} href="#packages">
          {POSTCARD_CTA}
        </a>
      </footer>
    </main>
  );
}
