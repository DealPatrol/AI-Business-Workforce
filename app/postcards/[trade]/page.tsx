import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTCARD_TRADES, getPostcardTrade } from '@/lib/postcards/trade-pages';
import { absoluteSiteUrl } from '@/lib/site-url';

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTCARD_TRADES.map((t) => ({ trade: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ trade: string }> }): Promise<Metadata> {
  const { trade } = await params;
  const t = getPostcardTrade(trade);
  if (!t) return {};
  const title = `Marketing Postcards for ${t.plural.replace(/^./, (c) => c.toUpperCase())} | Front Porch Growth`;
  const description = `Property-based direct mail for ${t.plural}: each postcard shows the homeowner a concept of ${t.concept} for their own home, with a QR code to request an estimate.`;
  const url = absoluteSiteUrl(`/postcards/${t.slug}`);
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'website' } };
}

const wrap = { maxWidth: 820, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, color: '#1f2a24' } as const;

export default async function PostcardTradePage({ params }: { params: Promise<{ trade: string }> }) {
  const { trade } = await params;
  const t = getPostcardTrade(trade);
  if (!t) notFound();
  const faqs = [
    { q: `How are these postcards different from regular ${t.trade} mailers?`, a: `Each card shows a concept of ${t.concept} for that specific home, so the homeowner sees the result instead of a generic coupon.` },
    { q: 'Do you mail anything without my approval?', a: 'No. You approve, swap, or regenerate every card before anything is mailed.' },
    { q: 'How do homeowners respond?', a: 'A QR code on each card opens an estimate request page for your business.' },
    { q: 'How much does it cost?', a: 'The founding customer package is $99/month for the initial managed campaign. See the pricing page for details.' },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p style={{ fontSize: 14 }}><Link href="/">Home</Link> / <Link href="/postcards">Postcards</Link></p>
      <h1 style={{ fontSize: 40, lineHeight: 1.15 }}>Marketing postcards for {t.plural}</h1>
      <p style={{ fontSize: 19 }}>Show homeowners {t.concept} on their own house. Front Porch Growth builds property-based postcard campaigns for {t.plural}: every card is a before/after concept for that address, with a QR code to request your estimate.</p>
      <h2>Where these cards work best</h2>
      <ul>{t.hooks.map((h) => <li key={h}>{h}</li>)}</ul>
      <h2>How a campaign works</h2>
      <ol>
        <li>Pick a few streets in your service area.</li>
        <li>We prepare up to 10 before/after concepts so you can see them before you scale.</li>
        <li>You approve, swap, or regenerate each card.</li>
        <li>Cards mail only after your approval; homeowners scan the QR to request an estimate.</li>
      </ol>
      <p><Link href="/postcards"><strong>See postcard examples →</strong></Link> · <Link href="/pricing">Pricing</Link> · <Link href="/receptionist">Need someone to answer the calls? Meet Executive Receptionist</Link></p>
      <h2>FAQ</h2>
      {faqs.map((f) => (<div key={f.q}><h3 style={{ fontSize: 18, marginBottom: 4 }}>{f.q}</h3><p style={{ marginTop: 0 }}>{f.a}</p></div>))}
      <h2>Other trades</h2>
      <p>{POSTCARD_TRADES.filter((o) => o.slug !== t.slug).map((o, i) => (<span key={o.slug}>{i ? ' · ' : ''}<Link href={`/postcards/${o.slug}`}>{o.trade} postcards</Link></span>))}</p>
    </main>
  );
}
