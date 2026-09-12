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
import { FOUNDING_PAYMENT_LINK } from '@/lib/payments';
import styles from './home.module.css';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

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
    title: 'Build the concepts',
    detail: 'We prepare clearly labeled yard project ideas for you to review.',
  },
  {
    icon: Mail,
    number: '03',
    title: 'Approve the postcard',
    detail: 'You approve the concept, message, audience, and costs before anything mails.',
  },
  {
    icon: QrCode,
    number: '04',
    title: 'Turn scans into estimates',
    detail: 'Each QR page gives the homeowner a direct way to request an estimate.',
  },
];

const packageItems = [
  'Target campaign setup',
  'Up to 25 property concepts*',
  'Personalized postcard creative',
  'Unique QR project-page structure',
  'Lead and response tracking setup',
  'Campaign review before launch',
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link className={styles.brand} href="/">
          <span>
            <Sparkles size={17} />
          </span>
          Workforce <b>AI</b>
        </Link>
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#package">What you get</a>
          <Link href="/visual-canvasser">See examples</Link>
        </div>
        <a className={styles.navCta} href={FOUNDING_PAYMENT_LINK}>
          Pay $299
        </a>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>PROPERTY-BASED POSTCARD CAMPAIGNS FOR HOME SERVICES</span>
          <h1>Show homeowners the yard project you could build for them.</h1>
          <p className={styles.lede}>
            We help you choose the streets, prepare yard concepts, and mail a postcard with a QR
            page where the homeowner can request an estimate.
          </p>
          <div className={styles.priceLine}>
            <strong>$299 setup</strong>
            <span>then $99/month</span>
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href={FOUNDING_PAYMENT_LINK}>
              Pay $299 — Start My Campaign <ArrowRight size={18} />
            </a>
            <a className={styles.secondaryButton} href="#how">
              See how it works
            </a>
          </div>
          <p className={styles.heroNote}>
            The postcard campaign is our core service. You approve the concept, audience and costs before anything mails.
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
          <ShieldCheck /> You approve before mailing
        </span>
        <span>
          <Check /> No surprise pass-through costs
        </span>
        <span>
          <Check /> Built for landscaping and home services
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
          <span>FOUNDING CUSTOMER PACKAGE</span>
          <h2>Your first campaign, built with Cole.</h2>
          <p>
            We are onboarding a small number of north-Alabama landscapers and home-service
            businesses while the full workflow is being automated.
          </p>
          <div className={styles.honesty}>
            <b>Honest launch boundary</b>
            <p>
              First campaigns are managed and may be human-assisted. We will not claim live
              address-to-render or automatic mailing until those connections are tested.
            </p>
          </div>
        </div>
        <div className={styles.offerCard}>
          <small>FOUNDING LAUNCH</small>
          <div className={styles.offerPrice}>
            <strong>$299</strong>
            <span>setup</span>
          </div>
          <p>then $99/month for the initial managed campaign</p>
          <ul>
            {packageItems.map((item) => (
              <li key={item}>
                <Check size={16} /> {item}
              </li>
            ))}
          </ul>
          <a className={styles.primaryButton} href={FOUNDING_PAYMENT_LINK}>
            Pay $299 — Reserve My Campaign <ArrowRight size={18} />
          </a>
          <small className={styles.disclosure}>
            *Final mailed quantity and printing, postage, or property-data costs are confirmed
            before launch. No unapproved pass-through costs.
          </small>
        </div>
      </section>

      <section className={styles.questions}>
        <div>
          <span>WANT TO TALK FIRST?</span>
          <h2>Ask Cole if this fits your service area.</h2>
          <p>No sales maze. Email the person who will help set up the campaign.</p>
        </div>
        <a href={`mailto:${CONTACT_EMAIL}?subject=Question%20about%20the%20Workforce%20AI%20postcard%20campaign`}>
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
        <Link className={styles.brand} href="/">
          <span>
            <Sparkles size={17} />
          </span>
          Workforce <b>AI</b>
        </Link>
        <p>
          Cole · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <a className={styles.footerPay} href={FOUNDING_PAYMENT_LINK}>
          Pay $299
        </a>
      </footer>
    </main>
  );
}
