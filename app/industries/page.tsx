import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { breadcrumbNode, executiveReceptionistOrganization, howToNode, jsonLdGraph } from '@/lib/ava/structured-data';
import { erMetadata } from '@/lib/er/page-meta';
import { ER_VERTICAL_PAGES, erTradeLinks } from '@/lib/er/site-links';

export const metadata = erMetadata(
  '/industries',
  'AI Answering Service by Industry | Executive Receptionist',
  'AI receptionist pages for HVAC, plumbing, roofing, electrical, pest control, cleaning and more. Each has the calls Ava takes and the questions she asks.',
);

export default function IndustriesPage() {
  const trades = erTradeLinks();
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    breadcrumbNode([
      ['Home', '/'],
      ['Industries', '/industries'],
    ]),
    howToNode('How to put Ava on your business line'),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Industries', '/industries']]} />
          <p className={s.eyebrow}>Industries</p>
          <h1>An AI receptionist set up for your kind of shop.</h1>
          <p className={s.lede}>
            Every page lists the calls Ava takes for that trade and the questions she asks before she emails you the lead. Same plans and
            prices on every page, from $25 a month.
          </p>
          <div className={s.actions}>
            <a className={s.btnDark} href={AVA_DEMO_LINE.href}>
              Call the demo: {AVA_DEMO_LINE.display}
            </a>
            <Link className={s.btnLight} href="/pricing">
              See pricing
            </Link>
          </div>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Home-service trades</h2>
          <ul className={s.grid}>
            {[ER_VERTICAL_PAGES[0], ...trades].map((t) => (
              <li key={t.href}>
                <Link className={s.card} href={t.href}>
                  <h3>{t.label}</h3>
                  <p>{t.blurb}</p>
                  <span>See the page →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Offices and other small businesses</h2>
          <ul className={s.grid}>
            {ER_VERTICAL_PAGES.slice(1).map((t) => (
              <li key={t.href}>
                <Link className={s.card} href={t.href}>
                  <h3>{t.label}</h3>
                  <p>{t.blurb}</p>
                  <span>See the page →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ErShell>
  );
}
