import Link from 'next/link';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { ClosingCards, Crumbs, JsonLd } from '@/components/fpg/Blocks';
import styles from '@/components/fpg/fpg.module.css';
import { breadcrumbNode, fpgMetadata } from '@/lib/fpg/seo';
import { ER_HOME } from '@/lib/fpg/site';
import { POSTCARD_TRADES } from '@/lib/postcards/trade-pages';
import { TRADE_PAGES } from '@/lib/trades/pages';
import { jsonLdGraph } from '@/lib/ava/structured-data';
import { FRONT_PORCH_GROWTH_ORIGIN, absoluteUrl } from '@/lib/site-url';

const PATH = '/trades';
export const metadata = fpgMetadata(PATH);

export default function TradesHubPage() {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Industries', path: PATH },
  ];
  const all = [
    ...POSTCARD_TRADES.map((t) => ({ name: `Postcards for ${t.plural}`, path: `/postcards/${t.slug}` })),
    ...TRADE_PAGES.map((p) => ({ name: `${p.name}: growth tools`, path: `/trades/${p.slug}` })),
  ];
  const data = jsonLdGraph([
    {
      '@type': 'CollectionPage',
      name: 'Industries',
      url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, PATH),
      hasPart: all.map((item) => ({ '@type': 'WebPage', name: item.name, url: absoluteUrl(FRONT_PORCH_GROWTH_ORIGIN, item.path) })),
    },
    breadcrumbNode(crumbs),
  ]);
  return (
    <SuiteShell>
      <JsonLd data={data} />
      <div className={styles.wrap}>
        <Crumbs items={crumbs} />
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Industries</span>
          <h1>Marketing built around the trade you run.</h1>
          <p className={styles.lede}>
            Each page shows what Front Porch Growth does for that kind of shop: postcards with a concept for the homeowner’s own property, a cleaned-up
            Google profile, honest review requests, and AI search visibility starting with roofers.
          </p>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>YardMailer postcards by trade</span>
          <h2 className={styles.h2}>Outdoor and exterior trades</h2>
          <ul className={styles.grid3}>
            {POSTCARD_TRADES.map((t) => (
              <li key={t.slug}>
                <Link className={styles.card} href={`/postcards/${t.slug}`}>
                  <h3>Postcards for {t.plural}</h3>
                  <p>A card showing {t.concept}, mailed to the streets you pick.</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <span className={styles.kicker}>Growth tools by trade</span>
          <h2 className={styles.h2}>Service trades</h2>
          <ul className={styles.grid3}>
            {TRADE_PAGES.map((p) => (
              <li key={p.slug}>
                <Link className={styles.card} href={`/trades/${p.slug}`}>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </Link>
              </li>
            ))}
            <li>
              <Link className={styles.card} href="/ai-search-visibility">
                <h3>Roofers: AI search visibility</h3>
                <p>Get named when a homeowner asks ChatGPT or Google’s AI for a roofer. Starts with a free Competitor Gap Report.</p>
              </Link>
            </li>
          </ul>
          <p className={styles.fine}>
            Looking for someone to answer the phone for your trade? The AI receptionist lives on <a href={ER_HOME}>Executive Receptionist</a>.
          </p>
        </section>
        <ClosingCards />
      </div>
    </SuiteShell>
  );
}
