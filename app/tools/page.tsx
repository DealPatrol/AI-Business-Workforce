import Link from 'next/link';
import { ErBreadcrumbs, ErShell, erStyles as s } from '@/components/er/ErSite';
import { breadcrumbNode, executiveReceptionistOrganization, jsonLdGraph } from '@/lib/ava/structured-data';
import { CALL_SCRIPTS } from '@/lib/er/call-scripts';
import { erMetadata } from '@/lib/er/page-meta';
import { ER_TOOLS } from '@/lib/er/tools';

export const metadata = erMetadata(
  '/tools',
  'Free Phone Tools for Small Shops | Executive Receptionist',
  'Free tools for home-service shops: missed-call and answering service cost, call forwarding codes, greeting generator, holiday planner and call scripts.',
);

export default function ToolsPage() {
  const jsonLd = jsonLdGraph([
    executiveReceptionistOrganization(),
    breadcrumbNode([
      ['Home', '/'],
      ['Free tools', '/tools'],
    ]),
  ]);
  return (
    <ErShell jsonLd={jsonLd}>
      <section className={s.hero}>
        <div className={s.wrap}>
          <ErBreadcrumbs items={[['Home', '/'], ['Free tools', '/tools']]} />
          <p className={s.eyebrow}>Free tools</p>
          <h1>Free tools for the shop phone.</h1>
          <p className={s.lede}>No sign-up. Each tool runs in your browser and nothing you type is sent anywhere.</p>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Calculators and setup help</h2>
          <ul className={s.grid}>
            {ER_TOOLS.map((t) => (
              <li key={t.href}>
                <Link className={s.card} href={t.href}>
                  <h3>{t.label}</h3>
                  <p>{t.blurb}</p>
                  <span>Open the tool →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className={s.section}>
        <div className={s.wrap}>
          <h2>Call scripts</h2>
          <ul className={s.grid}>
            {CALL_SCRIPTS.map((t) => (
              <li key={t.slug}>
                <Link className={s.card} href={`/templates/${t.slug}`}>
                  <h3>{t.navLabel}</h3>
                  <p>{t.blurb}</p>
                  <span>Read the script →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ErShell>
  );
}
