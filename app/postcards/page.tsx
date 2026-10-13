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
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { FOUNDING_CTA, foundingCheckoutHref, getDemo10Payment } from '@/lib/payments';
import styles from './home.module.css';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

const title = 'YardProof Postcards | Front Porch Growth';
const description =
  'Mail before/after postcards built from your own job photos to the right homes near your finished jobs. $99/month plus $1.49 per 4x6 or $1.79 per 6x9 card, print and postage included.';

export const metadata: Metadata = {
  title: { absolute: title },
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
    title: 'Pick the homes',
    detail: 'Draw a radius around a job you just finished, or pick a ZIP. Filter by home age, lot size, owner-occupied, and recent sales.',
  },
  {
    icon: Palette,
    number: '02',
    title: 'Add your photos',
    detail: 'Upload a before and an after shot from the real job. You confirm you own them and the homeowner is fine with it.',
  },
  {
    icon: Mail,
    number: '03',
    title: 'Approve the postcard',
    detail: 'See the home count and the all-in total. Nothing prints until you say go.',
  },
  {
    icon: QrCode,
    number: '04',
    title: 'Turn scans into estimates',
    detail: 'Each QR page gives the homeowner a direct way to request an estimate.',
  },
];

const packageItems = [
  'Campaign builder with property-record filters',
  'Before/after postcards from your own job photos',
  'Print and postage included: $1.49 per 4x6, $1.79 per 6x9',
  'A unique QR code on every card',
  'QR scan tracking and estimate-request inbox',
  'Campaign review before launch',
];

export default function HomePage() {
  const demo10 = getDemo10Payment();

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link className={styles.brand} href="/postcards">
          <span>
            <Sparkles size={17} />
          </span>
          YardProof
        </Link>
        <div className={styles.navLinks}>
          <Link href="/">Front Porch Growth</Link>
          <a href="#how">How it works</a>
          <a href="#demo10">Demo Blast 10</a>
          <a href="#package">What you get</a>
          <Link href="/postcards/campaign-builder">Campaign builder</Link>
          <Link href="/visual-canvasser">See examples</Link>
        </div>
        <a className={styles.navCta} href={foundingCheckoutHref('/postcards#package')}>
          {FOUNDING_CTA}
        </a>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>NEIGHBOR POSTCARDS FOR HOME-SERVICE CREWS</span>
          <h1>Your best job is the ad. Mail it to the houses next door.</h1>
          <p className={styles.lede}>
            Finish a job, snap a before and an after, and send a postcard to the homes around it
            that fit your work: older houses, bigger lots, owners who live there, or people who
            just moved in. Each card has a QR code that leads to an estimate request.
          </p>
          <div className={styles.priceLine}>
            <strong>$99/month</strong> + $1.49 per 4×6 or $1.79 per 6×9 card, print and postage included
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={foundingCheckoutHref('/postcards#package')}>
              {FOUNDING_CTA} <ArrowRight size={18} />
            </a>
            <a className={styles.secondaryButton} href="#demo10">
              See the $49 Demo Blast 10
            </a>
          </div>
          <p className={styles.heroNote}>
            You approve the photos, the list of homes, and the total before anything mails.
          </p>
        </div>

        <div className={styles.postcard} aria-label="Labeled example postcard">
          <div className={styles.postcardImage}>
            <Image
              src="/postcard-yard.png"
              alt="Example postcard layout"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 46vw"
            />
            <span>SAMPLE LAYOUT · YOUR PHOTOS GO HERE</span>
          </div>
          <div className={styles.postcardCopy}>
            <small>EXAMPLE POSTCARD</small>
            <h2>We just finished a yard on your street.</h2>
            <p>Here&rsquo;s the before and after. Scan to ask for a free estimate.</p>
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
          <ShieldCheck /> You approve before mailing
        </span>
        <span>
          <Check /> No surprise pass-through costs
        </span>
        <span>
          <Check /> Built for landscaping and home services
        </span>
      </section>

      <section className={styles.demoOffer} id="demo10">
        <div>
          <span>LOW-RISK STARTER</span>
          <h2>See 10 homes before you scale.</h2>
          <p>
            Choose your trade and provide up to 10 addresses—or ask Cole to help choose the area.
            Each card shows your own before and after photos from a real job.
          </p>
        </div>
        <div>
          <strong>$49</strong>
          <ul>
            <li><Check /> Up to 10 before/after cards from your photos</li>
            <li><Check /> Approve or request changes on each card</li>
            <li><Check /> QR estimate-page structure</li>
            <li><Check /> Manual mailing only after your approval</li>
          </ul>
          <a className={styles.primaryButton} href={demo10.href}>
            {demo10.label} <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className={styles.section} id="how">
        <div className={styles.sectionHeading}>
          <span>HOW IT WORKS</span>
          <h2>From one finished job to the next ten estimates.</h2>
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
              <span>SAMPLE IMAGE · REAL CARDS USE YOUR JOB PHOTOS</span>
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
            <Link href="/postcards/campaign-builder">
              Try the campaign builder <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.packageSection} id="package">
        <div className={styles.packageCopy}>
          <span>FOUNDING CUSTOMER PACKAGE</span>
          <h2>Your first campaign, built with Cole.</h2>
          <p>
            We are onboarding a small number of north-Alabama landscapers and home-service
            businesses while the full workflow is being automated.
          </p>
          <div className={styles.honesty}>
            <b>Honest launch boundary</b>
            <p>
              <b>Live today:</b> unique QR pages, scan tracking, your estimate-request inbox, and
              uploads for your own before/after photos.
              <br />
              <b>Being switched on now:</b> live property-record lookups and automated print and
              mail. Until then the campaign builder shows sample homes, and Cole confirms every
              mailing with you by hand. We never print Google Street View or map images, and
              we never put AI-made pictures on your cards.
            </p>
          </div>
        </div>
        <div className={styles.offerCard}>
          <small>FOUNDING LAUNCH</small>
          <div className={styles.offerPrice}>
            <strong>$99</strong>
            <span>/month</span>
          </div>
          <p>$99/month, plus $1.49 per 4×6 or $1.79 per 6×9 card. Print and postage included.</p>
          <ul>
            {packageItems.map((item) => (
              <li key={item}>
                <Check size={16} /> {item}
              </li>
            ))}
          </ul>
          <a className={styles.primaryButton} href={foundingCheckoutHref('/postcards#package')}>
            {FOUNDING_CTA} <ArrowRight size={18} />
          </a>
          <small className={styles.disclosure}>
            You see the number of homes and the total before anything mails. No hidden postage
            or data fees.
          </small>
        </div>
      </section>

      <section className={styles.questions}>
        <div>
          <span>WANT TO TALK FIRST?</span>
          <h2>Ask Cole if this fits your service area.</h2>
          <p>No sales maze. Email the person who will help set up the campaign.</p>
        </div>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Question%20about%20the%20YardProof%20postcard%20campaign`}>
          <Mail size={18} /> Email Cole
        </a>
      </section>

      <section className={styles.avaSection}>
        <div>
          <small>OPTIONAL ADD-ON</small>
          <h2>Want someone answering the leads your campaign creates?</h2>
          <p>
            Ava is a separate AI receptionist add-on for businesses that want 24/7 call coverage. The postcard campaign remains the main service.
          </p>
        </div>
        <Link href="/ava">
          See Ava add-on <ArrowRight size={16} />
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/postcards">
          <span>
            <Sparkles size={17} />
          </span>
          YardProof
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
        <a className={styles.footerPay} href={foundingCheckoutHref('/postcards#package')}>
          {FOUNDING_CTA}
        </a>
      </footer>
    </main>
  );
}
