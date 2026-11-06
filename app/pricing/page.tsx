import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { OfferPricingLayout } from '@/components/ava/OfferPricingLayout';
import {
  POSTCARD_PRICE_SUMMARY,
  POSTCARD_SETUP_LABEL,
  POSTCARD_SIZES,
  postcardPackageRows,
} from '@/lib/postcards/pricing';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';
import { isExecutiveReceptionistHost } from '@/lib/site-url';
import styles from '@/components/ava/offer-pricing.module.css';

const seo = pageSeo('/pricing');
const title = renderedTitle(seo);
const description = seo.description;

export const metadata: Metadata = {
  title: metadataTitle(seo),
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
  ['YardMailer setup', 'Charged once. Later orders leave it off when you are signed in and a paid setup is already on your account.', POSTCARD_SETUP_LABEL],
  ['YardMailer 4×6', 'Per card. Postage, printing, and mailing included.', POSTCARD_SIZES['4x6'].unitLabel],
  ['YardMailer 6×9', 'Per card. Postage, printing, and mailing included.', POSTCARD_SIZES['6x9'].unitLabel],
  ...postcardPackageRows().map((row) => [
    `${row.quantity} cards`,
    'Package total, including the one-time setup fee',
    `4×6 ${row.fourBySixLabel} · 6×9 ${row.sixByNineLabel}`,
  ]),
  ['Custom quantity', 'Minimum 100 cards, computed on the postcards page', 'Setup plus per card'],
  ['Executive Receptionist', 'Free 14-day pilot, then $0 until the first booked job, then $25 per booked job', 'Capped at $297/month'],
  ['Lead Finder', 'Signed-in Maps search and approved drafts', 'No separate public price'],
  ['Lead Scout', 'Public listing search. Does not contact anyone.', 'No separate public price'],
  ['Writing agents', 'Drafts on the page. Nothing is sent.', 'No separate public price'],
  ['ReputationFlow', 'Separate site. Free starter, or Professional', '$20/month on their pricing page'],
  ['Invoicing', 'Coming soon', 'Waitlist'],
];

function OtherProducts() {
  return (
    <section className={styles.other} id="other-products">
      <p className={styles.kicker}>Other Front Porch Growth products</p>
      <h2>Published prices for the rest of the suite.</h2>
      <p style={{ fontFamily: 'Segoe UI, sans-serif', color: '#5c5348', margin: '0 0 16px', maxWidth: '62ch' }}>
        {POSTCARD_PRICE_SUMMARY} These are different products from Executive Receptionist. ReputationFlow’s $20 price is
        on tryreputationflow.com, not a new charge here.
      </p>
      <table>
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
    </section>
  );
}

export default async function PricingPage() {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const onReceptionistSite = isExecutiveReceptionistHost(host);
  const layout = (
    <OfferPricingLayout showTopbar={onReceptionistSite} otherProducts={onReceptionistSite ? undefined : <OtherProducts />} />
  );

  if (onReceptionistSite) {
    return layout;
  }

  return <SuiteShell>{layout}</SuiteShell>;
}
