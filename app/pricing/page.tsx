import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { OfferPricingLayout } from '@/components/ava/OfferPricingLayout';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { requestHost } from '@/lib/seo/request-host';
import {
  POSTCARD_PRICE_SUMMARY,
  POSTCARD_SETUP_LABEL,
  POSTCARD_SIZES,
  postcardPackageRows,
  postcardPublicOffers,
} from '@/lib/postcards/pricing';
import { avaOfferNodes, jsonLdGraph } from '@/lib/ava/structured-data';
import { pageSeo } from '@/lib/seo/pages';
import { absoluteUrl, EXECUTIVE_RECEPTIONIST_ORIGIN, getSiteUrl, isExecutiveReceptionistHost } from '@/lib/site-url';
import styles from '@/components/ava/offer-pricing.module.css';
import { FpgPricingTop } from '@/components/fpg/FpgPricing';

const seo = pageSeo('/pricing');
const description = seo.description;
const EXECUTIVE_PRICING_TITLE = 'AI Receptionist Pricing | Executive Receptionist';
const FPG_PRICING_TITLE = 'Front Porch Growth Pricing: Postcards, SEO & AI Search';
const FPG_PRICING_DESCRIPTION =
  'Published prices: YardMailer postcards ($127 setup, $3.54 a card), $99 Google profile setup, AI search plans from $1,500/mo, and review tools.';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { canonical, openGraphUrl } = await urlsForRequest('/pricing', '/pricing');
  // On executivereceptionist.com this page is the receptionist price list, so it carries that brand.
  const executiveHost = isExecutiveReceptionistHost(await requestHost());
  const siteName = executiveHost ? 'Executive Receptionist' : 'Front Porch Growth';
  const pageTitle = executiveHost ? EXECUTIVE_PRICING_TITLE : FPG_PRICING_TITLE;
  const pageDescription = executiveHost ? description : FPG_PRICING_DESCRIPTION;
  return {
    title: { absolute: pageTitle },
    description: pageDescription,
    alternates: { canonical },
    openGraph: { images: ['/og-default.png'],
      title: pageTitle,
      description: pageDescription,
      url: openGraphUrl,
      siteName,
      type: 'website',
    },
    twitter: { images: ['/og-default.png'],
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}

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
  ['Executive Receptionist', 'Five monthly plans: 60, 100, 300, 1,200 or 2,000 minutes. Overflow $1/min after 60. Starter first month $1.', '$25 to $789/month'],
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
  // Price list as structured data, built from the same constants the page renders.
  const pageUrl = absoluteUrl(onReceptionistSite ? EXECUTIVE_RECEPTIONIST_ORIGIN : getSiteUrl(), '/pricing');
  const structured = jsonLdGraph([
    {
      '@type': 'OfferCatalog',
      name: onReceptionistSite ? 'Executive Receptionist plans' : 'Front Porch Growth prices',
      url: pageUrl,
      itemListElement: onReceptionistSite
        ? avaOfferNodes(`${pageUrl}#plans`)
        : [...avaOfferNodes(`${pageUrl}#plans`), ...postcardPublicOffers(`${pageUrl}#other-products`)],
    },
  ]);
  const layout = (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <OfferPricingLayout showTopbar={onReceptionistSite} otherProducts={onReceptionistSite ? undefined : <OtherProducts />} />
    </>
  );

  if (onReceptionistSite) {
    return layout;
  }

  // Front Porch Growth: its own services first, then the sister brand's plans (kept so /pricing#plans checkout returns still land).
  return (
    <SuiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <FpgPricingTop />
      <OfferPricingLayout variant="section" showTopbar={false} />
    </SuiteShell>
  );
}
