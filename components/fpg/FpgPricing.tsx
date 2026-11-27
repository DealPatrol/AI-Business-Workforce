import Link from 'next/link';
import fpg from '@/components/fpg/fpg.module.css';
import { fpgPriceRowsData } from '@/lib/fpg/prices';
import { ER_HOME, FPG_PUBLIC_EMAIL } from '@/lib/fpg/site';
import {
  CITATION_SPRINT_PAYMENT_URL,
  FOUND_PAYMENT_URL,
  RECOMMENDED_PAYMENT_URL,
} from '@/lib/fpg/aeo-offer';

export function FpgPricingTop() {
  const rows = fpgPriceRowsData();
  return (
    <div className={fpg.wrap}>
      <section className={fpg.hero}>
        <span className={fpg.eyebrow}>Pricing</span>
        <h1>Every Front Porch Growth price, on one page.</h1>
        <p className={fpg.lede}>
          No retainer quotes. Pick a service, see the price, and approve the work before anything is mailed or published. There is no monthly
          postcard plan, and the Google profile setup is a one-time fee.
        </p>
        <div className={fpg.actions}>
          <Link className={fpg.primary} href="/free-tools/postcard-cost-calculator">
            Price a postcard run
          </Link>
          <Link className={fpg.secondary} href="/compare">
            Compare with alternatives
          </Link>
        </div>
      </section>
      <section className={fpg.section} id="front-porch-growth-prices">
        <span className={fpg.kicker}>Front Porch Growth services</span>
        <div className={fpg.tableWrap}>
          <table className={fpg.table}>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">What you get</th>
                <th scope="col">Price</th>
                <th scope="col">Billing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product}>
                  <td>
                    <Link href={row.href}>{row.product}</Link>
                  </td>
                  <td>{row.what}</td>
                  <td>{row.price}</td>
                  <td>{row.billing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={fpg.fine}>
          Not included anywhere on this site: ranking guarantees, review gating, or mail sent without your approval. Missed-call text-back is a{' '}
          <Link href="/missed-call">waitlist</Link>, not a live product.
        </p>
        <div className={fpg.actions} style={{ marginTop: 20 }}>
          <a className={fpg.secondary} href={CITATION_SPRINT_PAYMENT_URL}>
            Pay $497 for the Citation Sprint
          </a>
          <a className={fpg.secondary} href={FOUND_PAYMENT_URL}>
            Start Found — $1,997/mo
          </a>
          <a className={fpg.primary} href={RECOMMENDED_PAYMENT_URL}>
            Start Recommended — $3,497/mo
          </a>
        </div>
        <p className={fpg.fine}>
          Found includes a $750 setup fee and Recommended includes a $1,250 setup fee, billed at checkout. Market Leader
          and Pay When Named are set up by email at <a href={`mailto:${FPG_PUBLIC_EMAIL}`}>{FPG_PUBLIC_EMAIL}</a>. Or{' '}
          <Link href="/ai-search-visibility#gap-report">request a free Gap Report</Link>.
        </p>
      </section>
      <section className={fpg.section} id="receptionist-plans">
        <span className={fpg.kicker}>Sister brand</span>
        <h2 className={fpg.h2}>Executive Receptionist plans</h2>
        <p className={fpg.body}>
          The AI receptionist is a separate product with its own site, <a href={ER_HOME}>executivereceptionist.com</a>. Its five plans are also listed
          below: Starter $79/mo (100 minutes, first month $1), Growth $197/mo (300), Pro $397/mo (1,200)
          and Elite $789/mo (2,000).
        </p>
      </section>
    </div>
  );
}
