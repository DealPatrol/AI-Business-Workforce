import type { Metadata } from 'next';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { faqNode, jsonLdGraph } from '@/lib/ava/structured-data';
import {
  CAN_SPAM_NOTE,
  LEAD_LIST_COLUMNS,
  LEAD_LIST_LINKS,
  LEAD_LIST_STATES,
  LEAD_LIST_SUPPORT_EMAIL,
  SAMPLE_ROWS,
} from '@/lib/lead-lists/offers';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import styles from './leads.module.css';

const seo = pageSeo('/leads');
const title = renderedTitle(seo);
const description = seo.description;

const FAQS = [
  {
    q: 'Where do the leads come from?',
    a: 'Public sources: business directories, search results, and each business’s own website. Every email in your list was published by the business itself on its own site. We only collect contact details a business publishes for itself.',
  },
  {
    q: 'Did these businesses opt in to hear from me?',
    a: 'No. These are publicly listed business contacts, not opt-in subscribers. That is normal for B2B prospecting, and it means you must follow CAN-SPAM when you email them: an honest subject line, your mailing address, and an easy way to opt out.',
  },
  {
    q: 'Which industries can I pick?',
    a: 'Almost any industry that has public websites: dentists, law offices, roofers, HVAC, plumbers, salons, auto repair, med spas, real estate, restaurants, gyms, accountants, and more. Type it in at checkout.',
  },
  {
    q: 'Can I get one state only?',
    a: `Yes. Write the state next to your industry at checkout (for example, “roofers, Georgia”). Lists cover ${LEAD_LIST_STATES.length} Southern states by default. If one state cannot reach your list size, we add neighboring states or refund you.`,
  },
  {
    q: 'What if there aren’t 1,000 in my industry?',
    a: 'Then we add closely related industries, or we refund you. You choose.',
  },
  {
    q: 'Are the leads exclusive to me?',
    a: 'No. They come from public sources, so other people can find the same businesses. What you pay for is the time it takes to find, collect, and clean them.',
  },
  {
    q: 'Do you include phone numbers?',
    a: 'No. Each row has the business name, website, public business email, city, and state.',
  },
  {
    q: 'How do I get my list?',
    a: `We build your list after you order and email it to you as a CSV file that opens in Excel or Google Sheets. Questions? Email ${LEAD_LIST_SUPPORT_EMAIL}.`,
  },
] as const;

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description,
  alternates: { canonical: '/leads' },
  openGraph: { images: ['/og-default.png'], title, description, url: '/leads', siteName: 'Front Porch Growth', type: 'website' },
};

function BuyButtons() {
  return (
    <div className={styles.ctaRow}>
      <a className={styles.cta} href={LEAD_LIST_LINKS.leads1000}>
        Get 1,000 leads for $20
      </a>
      <a className={styles.ctaSecondary} href={LEAD_LIST_LINKS.leads5000}>
        Or 5,000 for $59
      </a>
    </div>
  );
}

export default function LeadListsPage() {
  const structured = jsonLdGraph([
    {
      '@type': 'Product',
      name: '1,000 Business Leads Across the South',
      description,
      brand: { '@type': 'Brand', name: 'Front Porch Growth' },
      offers: [
        { '@type': 'Offer', price: '20.00', priceCurrency: 'USD', url: LEAD_LIST_LINKS.leads1000, availability: 'https://schema.org/InStock' },
        { '@type': 'Offer', name: '5,000 leads', price: '59.00', priceCurrency: 'USD', url: LEAD_LIST_LINKS.leads5000, availability: 'https://schema.org/InStock' },
      ],
    },
    faqNode([...FAQS]),
  ]);

  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          BUSINESS LEAD LISTS
        </span>
        <h1>1,000 businesses to pitch, in the industry you sell to. $20.</h1>
        <p className={styles.lede}>
          Stop hunting for prospects one Google search at a time. Tell us the industry, and we hand you a spreadsheet of 1,000
          businesses across the South, each with its website and the email it publishes on its own site.
        </p>
        <BuyButtons />
        <p className={styles.fine}>One-time payment. No subscription. If we can’t reach 1,000 in your industry, we add related industries or refund you.</p>
      </section>

      <section className={styles.block}>
        <h2>Built for people who sell to small businesses</h2>
        <ul className={styles.list}>
          <li>Marketing agencies and web designers looking for their next clients</li>
          <li>Freelancers: copywriters, bookkeepers, photographers, VAs</li>
          <li>Insurance, payroll, and merchant-services reps</li>
          <li>SaaS and AI-tool founders who need first customers</li>
        </ul>
        <p>If you already know what you sell and who buys it, the missing piece is a list of who to contact. That is what this is.</p>
      </section>

      <section className={styles.block}>
        <h2>What’s in every row</h2>
        <span className={styles.sampleTag}>SAMPLE FORMAT · FICTIONAL ROWS</span>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {LEAD_LIST_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((row) => (
                <tr key={row.business_name}>
                  <td>{row.business_name}</td>
                  <td>{row.website}</td>
                  <td>{row.email}</td>
                  <td>{row.city}</td>
                  <td>{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.fine}>These three rows are made up to show the layout. Your file has real businesses in the industry you choose.</p>
      </section>

      <section className={styles.block}>
        <h2>What your $20 gets you</h2>
        <ul className={styles.list}>
          <li><strong>1,000 businesses</strong> in the industry you pick, across {LEAD_LIST_STATES.length} Southern states</li>
          <li><strong>A public business email for each one,</strong> taken from the business’s own website, not guessed</li>
          <li><strong>Website, city, and state</strong> so you can research and personalize before you reach out</li>
          <li><strong>Duplicates removed,</strong> one row per business</li>
          <li><strong>A CSV file</strong> that opens in Excel, Google Sheets, or any email tool</li>
        </ul>
        <p>That’s 2 cents a lead. Finding 1,000 of these by hand would take days of searching and copying.</p>
        <p className={styles.fine}>States covered: {LEAD_LIST_STATES.join(', ')}.</p>
      </section>

      <section className={styles.block}>
        <h2>Pick your list</h2>
        <div className={styles.offers}>
          <div className={`${styles.offer} ${styles.offerFeatured}`}>
            <h3>1,000 leads</h3>
            <div className={styles.price}>$20 <small>one time</small></div>
            <p>One industry, across the South. The easiest way to try it.</p>
            <a className={styles.cta} href={LEAD_LIST_LINKS.leads1000}>Get 1,000 leads</a>
          </div>
          <div className={styles.offer}>
            <h3>5,000 leads</h3>
            <div className={styles.price}>$59 <small>one time</small></div>
            <p>Five times the list for about 1.2 cents a lead. For steady weekly outreach.</p>
            <a className={styles.ctaSecondary} href={LEAD_LIST_LINKS.leads5000}>Get 5,000 leads</a>
          </div>
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.guarantee}>
          <h2>Our promise</h2>
          <p>
            If we can’t reach the number of leads you paid for in your industry, we add closely related industries or give you
            your money back. You decide which.
          </p>
        </div>
      </section>

      <section className={`${styles.block} ${styles.faq}`}>
        <h2>Questions</h2>
        {FAQS.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <section className={styles.block}>
        <h2>Get your list</h2>
        <p>Pick an industry, pay once, and we build your list.</p>
        <BuyButtons />
        <p className={styles.compliance}>{CAN_SPAM_NOTE}</p>
      </section>
    </SuiteShell>
  );
}
