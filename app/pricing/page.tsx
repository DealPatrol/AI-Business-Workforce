import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { FOUNDING_CTA, foundingCheckoutHref } from '@/lib/payments';
import styles from '@/components/suite/suite.module.css';

const title = 'Pricing | Front Porch Growth';
const description =
  'YardProof postcard founding offer is $99/month. Ava receptionist plans are $79, $149, and $299 a month after a free 7-day trial. Invoicing is a waitlist.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/pricing' },
  openGraph: {
    title,
    description,
    url: '/pricing',
    siteName: 'Front Porch Growth',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const rows = [
  ['YardProof postcards', 'Founding offer', '$99/month'],
  ['Demo Blast 10', 'Up to 10 postcard concepts', '$49'],
  ['Ava Starter', '300 voice minutes, 7-day trial, $0 setup', '$79/month'],
  ['Ava Growth', '800 voice minutes, 7-day trial, $0 setup', '$149/month'],
  ['Ava Pro', '1,800 voice minutes, 7-day trial, $0 setup', '$299/month'],
  ['Lead Finder', 'Signed-in Maps search and approved drafts', 'No separate public price'],
  ['Invoicing', 'Coming soon', 'Waitlist'],
] as const;

export default function PricingPage() {
  return (
    <SuiteShell>
      <section className={styles.section}>
        <span className={styles.eyebrow}>PRICING</span>
        <h1>Published prices, one page.</h1>
        <p>
          The postcard founding offer is $99/month. Ava’s Starter, Growth, and Pro plans are $79, $149, and $299 a month. Those are different products.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>What it is</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([product, detail, price]) => (
              <tr key={product}>
                <td>{product}</td>
                <td>{detail}</td>
                <td>{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.priceRow}>
          <TrackedCheckoutLink className={styles.button} href={foundingCheckoutHref('/pricing')} plan="founding">
            {FOUNDING_CTA}
          </TrackedCheckoutLink>
          <TrackedCheckoutLink className={styles.button} href="/api/checkout?plan=starter" plan="starter">
            Start Ava trial
          </TrackedCheckoutLink>
          <Link className={styles.button} href="/#invoicing">
            Join the invoicing list
          </Link>
        </div>
      </section>
    </SuiteShell>
  );
}
