import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { avaGuideSlugs } from '@/lib/ava/trade-pages';
import { POSTCARD_SETUP_LABEL, POSTCARD_SIZES, postcardPackageRows } from '@/lib/postcards/pricing';
import { POSTCARD_TRADES, getPostcardTrade, postcardTradeDetail, postcardTradeSeo } from '@/lib/postcards/trade-pages';
import { avaGuidePath } from '@/lib/seo/receptionist-home';
import { absoluteSiteUrl } from '@/lib/site-url';

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTCARD_TRADES.map((t) => ({ trade: t.slug }));
}

/** Matching answering-service guide for the same trade, when one exists. */
const ANSWERING_GUIDE: Record<string, string> = {
  landscaping: 'ai-answering-service-for-landscapers',
  'lawn-care': 'ai-answering-service-for-lawn-care',
  fencing: 'ai-answering-service-for-fencing',
  roofing: 'ai-answering-service-for-roofers',
  'exterior-painting': 'ai-answering-service-for-painters',
  'pool-installation': 'ai-answering-service-for-pool-companies',
  'tree-service': 'ai-answering-service-for-tree-service',
};

export async function generateMetadata({ params }: { params: Promise<{ trade: string }> }): Promise<Metadata> {
  const { trade } = await params;
  const t = getPostcardTrade(trade);
  const seo = postcardTradeSeo(trade);
  if (!t || !seo) return {};
  const title = seo.title;
  const description = seo.description;
  const url = absoluteSiteUrl(`/postcards/${t.slug}`);
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { images: ['/og-default.png'], title, description, url, type: 'website' } };
}

const wrap = { maxWidth: 820, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, color: '#1f2a24' } as const;
const table = { width: '100%', borderCollapse: 'collapse', margin: '8px 0 4px' } as const;
const cell = { borderBottom: '1px solid #d9d2c0', padding: '8px 6px', textAlign: 'left' } as const;

export default async function PostcardTradePage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade } = await params;
  const t = getPostcardTrade(trade);
  const d = postcardTradeDetail(trade);
  if (!t || !d) notFound();
  const rows = postcardPackageRows();
  const mid = rows.find((r) => r.quantity === 250) ?? rows[0];
  const guideSlug = ANSWERING_GUIDE[t.slug];
  const guide = guideSlug && avaGuideSlugs().includes(guideSlug) ? guideSlug : undefined;
  const faqs = [
    ...d.faqs,
    { q: `How are these postcards different from regular ${t.trade} mailers?`, a: `Each card shows a concept of ${t.concept} for that specific home, so the homeowner sees the result instead of a generic coupon.` },
    { q: 'Do you mail anything without my approval?', a: 'No. You approve, swap, or regenerate every card before anything is mailed.' },
    { q: 'How do homeowners respond?', a: 'A QR code on each card opens an estimate request page for your business.' },
    { q: 'How much does it cost?', a: `A ${POSTCARD_SETUP_LABEL} setup fee is charged once per customer, plus ${POSTCARD_SIZES['4x6'].unitLabel} per 4×6 card or ${POSTCARD_SIZES['6x9'].unitLabel} per 6×9 card. Postage, printing, and mailing are included. Packages are 100, 250, or 500 cards, and custom quantities start at 100. See the pricing page for the totals.` },
  ];
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'Service', name: `Marketing postcards for ${t.plural}`, serviceType: 'Direct mail marketing', provider: { '@type': 'Organization', name: 'Front Porch Growth', url: absoluteSiteUrl('/') }, areaServed: 'US', url: absoluteSiteUrl(`/postcards/${t.slug}`) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteSiteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Postcards', item: absoluteSiteUrl('/postcards') },
      { '@type': 'ListItem', position: 3, name: t.plural, item: absoluteSiteUrl(`/postcards/${t.slug}`) },
    ] },
  ];
  return (
    <main style={wrap}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <p style={{ fontSize: 14 }}><Link href="/">Home</Link> / <Link href="/postcards">Postcards</Link></p>
      <h1 style={{ fontSize: 40, lineHeight: 1.15 }}>Marketing postcards for {t.plural}</h1>
      <p style={{ fontSize: 19 }}>Show homeowners {t.concept} on their own house. AI designs the card, then it&apos;s printed and mailed directly to the homeowners. Every card includes a QR code to request your estimate.</p>

      <h2>What does the {t.trade} postcard show?</h2>
      <p>{d.cardShows}</p>
      <p>{d.sizeTip}</p>

      <h2>When should {t.plural} mail postcards?</h2>
      <p>{d.whenToMail}</p>

      <h2>Which homes should get the card?</h2>
      <p>{d.whichHomes}</p>
      <ul>{t.hooks.map((h) => <li key={h}>{h}</li>)}</ul>

      <h2>What should the card offer?</h2>
      <p>{d.offer}</p>
      <p><strong>Avoid:</strong> {d.avoid}</p>

      <h2>What does a {t.trade} postcard campaign cost?</h2>
      <p>Totals include the {POSTCARD_SETUP_LABEL} setup fee, charged once per customer. Postage, printing, and mailing are included in the per-card price.</p>
      <table style={table}>
        <thead>
          <tr><th style={cell}>Cards</th><th style={cell}>4×6 total</th><th style={cell}>6×9 total</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.quantity}><td style={cell}>{r.quantity}</td><td style={cell}>{r.fourBySixLabel}</td><td style={cell}>{r.sixByNineLabel}</td></tr>
          ))}
        </tbody>
      </table>
      <p>Simple break-even check: a {mid.quantity}-card 4×6 run is {mid.fourBySixLabel} the first time. If one {t.trade} job is worth more than that to you, one booked job covers the run. Later runs skip the setup fee.</p>

      <h2>How a campaign works</h2>
      <ol>
        <li>Pick a few streets in your service area.</li>
        <li>AI designs the card for each home.</li>
        <li>You approve, swap, or regenerate every design.</li>
        <li>The card is printed and mailed directly to the homeowners.</li>
        <li>Homeowners scan the QR to request an estimate.</li>
      </ol>
      <p>
        <Link href="/postcards"><strong>See postcard examples →</strong></Link> · <Link href="/pricing">Pricing</Link> ·{' '}
        <Link href="https://executivereceptionist.com/">Need someone to answer the calls? Meet Executive Receptionist</Link>
        {guide ? <> · <Link href={`https://executivereceptionist.com${avaGuidePath(guide)}`}>AI answering service for {t.plural}</Link></> : null}
      </p>

      <h2>FAQ</h2>
      {faqs.map((f) => (<div key={f.q}><h3 style={{ fontSize: 18, marginBottom: 4 }}>{f.q}</h3><p style={{ marginTop: 0 }}>{f.a}</p></div>))}
      <h2>Other trades</h2>
      <p>{POSTCARD_TRADES.filter((o) => o.slug !== t.slug).map((o, i) => (<span key={o.slug}>{i ? ' · ' : ''}<Link href={`/postcards/${o.slug}`}>{o.trade} postcards</Link></span>))}</p>
    </main>
  );
}
