import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { absoluteSiteUrl } from '@/lib/site-url';

const CHECKOUT_URL = 'https://buy.stripe.com/14A3cx1Rc2W9dWx4200Ba02';
const seo = pageSeo('/google-profile');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  { q: 'What do you need from me?', a: 'Manager access to your Google Business Profile (or help claiming it), 5 to 15 job photos, your service area, and the services you want to be found for.' },
  { q: 'How long does it take?', a: 'Most profiles are done within 3 business days of getting access and photos. Google sometimes holds edits for review, which can add a few days.' },
  { q: 'Do you guarantee a ranking?', a: 'No. Nobody can honestly promise a map ranking. A complete, accurate profile with the right categories and photos is the foundation Google looks at.' },
  { q: 'Is this a subscription?', a: 'The setup is not. It is $99 one time. If you want the profile kept current afterward, monthly Profile Care is optional: $99 or $179 a month, month to month.' },
  { q: 'Does a Google profile help with ChatGPT and other AI assistants?', a: 'It helps most with Google: map results and Google’s AI answers read your profile. ChatGPT and other assistants lean more on directories and review sites, so a profile is one piece. The free AI visibility grader checks both.' },
  { q: 'Will you put keywords in my business name?', a: 'No. Google’s guidelines say the name must match your real-world business name, and stuffed names can get a profile suspended.' },
] as const;

const MISTAKES = [
  'The wrong primary category, so Google shows you for the wrong searches.',
  'Services missing, so the profile never mentions the jobs you want most.',
  'Old hours or a dead phone number.',
  'No real job photos, only a logo or nothing at all.',
  'A street address showing for a business that only drives to customers.',
  'Two listings for the same business, splitting the reviews.',
  'Keywords stuffed into the business name, which breaks Google’s rules.',
] as const;

const structured = jsonLdGraph([
  {
    '@type': 'Service',
    name: 'Google Business Profile setup and optimization',
    serviceType: 'Google Business Profile optimization',
    description: seo.description,
    url: absoluteSiteUrl('/google-profile'),
    areaServed: { '@type': 'Country', name: 'United States' },
    provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/') },
    offers: {
      '@type': 'Offer',
      price: '99.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: absoluteSiteUrl('/google-profile'),
      description: 'One-time flat fee. Not a subscription.',
    },
  },
  faqNode([...FAQS]),
]);

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/google-profile' },
  openGraph: { images: ['/og-default.png'], title, description, url: '/google-profile', siteName: 'Front Porch Growth', type: 'website' },
};

export default function GoogleProfilePage() {
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <section className={styles.section}>
        <span className={styles.eyebrow}>GOOGLE BUSINESS PROFILE</span>
        <h1>Your Google profile is your new front door. Let us fix it up for $99.</h1>
        <p>
          When someone searches &ldquo;lawn care near me&rdquo; or &ldquo;AC repair,&rdquo; your Google Business Profile is what they see first. Wrong categories, missing services, and no photos send them to the next listing. We set it up right, once, for a flat fee.
        </p>
        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>What we do</h2>
            <p>Primary and secondary categories picked for your trade.</p>
            <p>Services list with short descriptions.</p>
            <p>Business description written for your town and service area.</p>
            <p>Photos uploaded: logo, cover, team, trucks, and real jobs.</p>
            <p>Hours, service area, website, and phone checked.</p>
            <p>A short Google review link and QR code you can text to customers.</p>
          </article>
          <article className={styles.card}>
            <h2>Profile setup and optimization</h2>
            <p>One time. Done for you within about 3 business days of access.</p>
            <p className={styles.price}>$99 one-time</p>
            <a className={styles.button} href={CHECKOUT_URL}>
              Get my profile fixed
            </a>
          </article>
        </div>
        <h2>Keep it current after setup</h2>
        <p>
          A profile goes stale fast: holiday hours, new services, unanswered reviews. Optional monthly{' '}
          <Link href="/google-profile/management">Google profile care</Link> is $99 a month (4 posts, details kept current, drafted
          review replies) or $179 a month (8 posts, every review answered, photo uploads). Pair it with an AI receptionist in an{' '}
          <a href="https://executivereceptionist.com/receptionist/packages">Executive Receptionist bundle</a> from $159 a month.
        </p>
        <h2>Common Google profile mistakes we fix</h2>
        <ul>
          {MISTAKES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2>Google, maps, and AI answers</h2>
        <p>
          Your profile feeds Google’s map results and Google’s AI answers. ChatGPT and other assistants lean more on directories
          and review sites, so the profile is the first piece, not the only one. The{' '}
          <Link href="/ai-visibility">free SEO and AI visibility grader</Link> shows where your business shows up and where it does not.
        </p>
        <p>
          Want more reviews after setup? See <Link href="/reputation">review requests</Link>.
        </p>
        <h2>Questions</h2>
        <section className={styles.faq}>
          {FAQS.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </section>
      </section>
    </SuiteShell>
  );
}
