import type { Metadata } from 'next';
import Link from 'next/link';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { SuiteShell } from '@/components/suite/SuiteShell';
import {
  POSTCARD_PRICE_SUMMARY,
  POSTCARD_SETUP_LABEL,
  POSTCARD_SIZES,
  postcardPackageRows,
} from '@/lib/postcards/pricing';
import styles from '@/components/suite/suite.module.css';

const title = 'Pricing | Front Porch Growth';
const description =
  'YardMailer postcards are a $127 one-time setup plus $3.54 or $4.95 per card. Executive Receptionist plans are $77, $168, and $324 a month after a free 7-day trial. Invoicing is a waitlist.';

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
  ['YardMailer setup', 'Charged once per customer', POSTCARD_SETUP_LABEL],
  ['YardMailer 4×6', 'Per card. Postage, printing, and mailing included.', POSTCARD_SIZES['4x6'].unitLabel],
  ['YardMailer 6×9', 'Per card. Postage, printing, and mailing included.', POSTCARD_SIZES['6x9'].unitLabel],
  ...postcardPackageRows().map((row) => [
    `${row.quantity} cards`,
    'Package total, including the one-time setup fee',
    `4×6 ${row.fourBySixLabel} · 6×9 ${row.sixByNineLabel}`,
  ]),
  ['Custom quantity', 'Minimum 100 cards, computed on the postcards page', 'Setup plus per card'],
  ['Demo Blast 10', 'Up to 10 postcard concepts', '$64'],
  ['Executive Receptionist Starter', '300 voice minutes, 7-day trial, $0 setup', '$77/month'],
  ['Executive Receptionist Growth', '800 voice minutes, 7-day trial, $0 setup', '$168/month'],
  ['Executive Receptionist Pro', '1,800 voice minutes, 7-day trial, $0 setup', '$324/month'],
  ['Lead Finder', 'Signed-in Maps search and approved drafts', 'No separate public price'],
  ['Lead Scout', 'Public listing search. Does not contact anyone.', 'No separate public price'],
  ['Writing agents', 'Drafts on the page. Nothing is sent.', 'No separate public price'],
  ['ReputationFlow', 'Separate site. Free starter, or Professional', '$20/month on their pricing page'],
  ['Invoicing', 'Coming soon', 'Waitlist'],
];

export default function PricingPage() {
  return (
    <SuiteShell>
      <section className={styles.section}>
        <span className={styles.eyebrow}>PRICING</span>
        <h1>Published prices, one page.</h1>
        <p>
          {POSTCARD_PRICE_SUMMARY} There is no monthly postcard plan. Executive Receptionist’s Starter, Growth, and Pro plans are $77, $168, and $324 a month. Those are different products. ReputationFlow’s $20 price is on tryreputationflow.com, not a new charge here.
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
          <Link className={styles.button} href="/postcards#packages">
            See postcard packages
          </Link>
          <TrackedCheckoutLink className={styles.button} href="/api/checkout?plan=starter" plan="starter">
            Start Executive Receptionist trial
          </TrackedCheckoutLink>
          <Link className={styles.button} href="/#invoicing">
            Join the invoicing list
          </Link>
        </div>
      </section>
    </SuiteShell>
  );
}
