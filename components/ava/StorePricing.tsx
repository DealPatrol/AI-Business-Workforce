import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_STORE_OFFER } from '@/lib/ava/store-pricing';
import styles from './store-pricing.module.css';

export function StoreCheckoutButton({ className, children }: { className?: string; children?: string }) {
  return (
    <TrackedCheckoutLink className={className ?? styles.cta} href="/api/checkout?plan=store" plan="store">
      {children ?? AVA_STORE_OFFER.ctaLabel}
    </TrackedCheckoutLink>
  );
}

/** Online-store price card: $119/month + $1 per call Ava handles, free 14-day trial. */
export function StorePricing({ compact = false }: { compact?: boolean }) {
  return (
    <div className={styles.card} id="store-pricing">
      <p className={styles.kicker}>Online store plan</p>
      <p className={styles.price}>
        <b>{AVA_STORE_OFFER.monthlyLabel}</b>/month <span>+ {AVA_STORE_OFFER.perCallLabel} per call Ava handles</span>
      </p>
      {compact ? null : (
        <ul className={styles.list}>
          <li>Free {AVA_STORE_OFFER.trialDays}-day trial with a card on file. $0 today.</li>
          <li>Calls during the trial are free.</li>
          <li>{AVA_STORE_OFFER.callDefinition}</li>
          <li>No per-minute charges. Cancel before the trial ends and you pay nothing.</li>
        </ul>
      )}
      <StoreCheckoutButton />
    </div>
  );
}
