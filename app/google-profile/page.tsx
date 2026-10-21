import type { Metadata } from 'next';
import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import styles from '@/components/suite/suite.module.css';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const CHECKOUT_URL = 'https://buy.stripe.com/8x2fZh9Dw9CLe9n5zKebu03';
const seo = pageSeo('/google-profile');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  { q: 'What do you need from me?', a: 'Manager access to your Google Business Profile (or help claiming it), 5 to 15 job photos, your service area, and the services you want to be found for.' },
  { q: 'How long does it take?', a: 'Most profiles are done within 3 business days of getting access and photos. Google sometimes holds edits for review, which can add a few days.' },
  { q: 'Do you guarantee a ranking?', a: 'No. Nobody can honestly promise a map ranking. A complete, accurate profile with the right categories and photos is the foundation Google looks at.' },
  { q: 'Is this a subscription?', a: 'No. It is $99 one time.' },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/google-profile' },
  openGraph: { title, description, url: '/google-profile', siteName: 'Front Porch Growth', type: 'website' },
};

export default function GoogleProfilePage() {
  return (
    <SuiteShell>
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
        <p>
          Want more reviews after setup? See <Link href="/reputation">review requests</Link>.
        </p>
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
