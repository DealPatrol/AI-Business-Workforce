import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_OFFER, AVA_PLAN_INCLUDES, AVA_PLAN_KEYS, AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';
import { TalkToAvaButton } from '@/components/ava/TalkToAvaButton';
import styles from './monthly-plans.module.css';

export function PlanCheckoutButton({
  plan = 'starter',
  className,
  children,
}: {
  plan?: AvaPlanKey;
  className?: string;
  children?: string;
}) {
  const p = AVA_PLANS[plan];
  const label = children ?? (p.firstMonthLabel ? `Start ${p.label} for ${p.firstMonthLabel}` : `Get ${p.label}`);
  return (
    <TrackedCheckoutLink className={className ?? styles.cta} href={`/api/checkout?plan=${p.key}`} plan={p.key}>
      {label}
    </TrackedCheckoutLink>
  );
}

/** The five published monthly plans (Overflow first, cheapest). Pro is the featured plan. */
export function MonthlyPlans({ heading = true, includes = true }: { heading?: boolean; includes?: boolean }) {
  return (
    <div className={styles.wrap} id="plans">
      {heading ? (
        <div className={styles.head}>
          <p className={styles.kicker}>Pricing · month to month</p>
          <h2>Pick your minutes. Ava answers every call.</h2>
          <p>
            Plans differ by how many minutes of calls Ava answers each month. Overflow starts at {AVA_PLANS.overflow.monthlyLabel}/month
            for {AVA_PLANS.overflow.minutesLabel}, then {AVA_PLANS.overflow.overageLabel}. Starter&rsquo;s first month is{' '}
            {AVA_PLANS.starter.firstMonthLabel}.
          </p>
        </div>
      ) : null}
      <div className={styles.grid}>
        {AVA_PLAN_KEYS.map((key) => {
          const plan = AVA_PLANS[key];
          return (
            <article key={key} className={`${styles.plan} ${plan.featured ? styles.featured : ''}`}>
              {plan.badge ? <p className={plan.featured ? styles.badgeHot : styles.badge}>{plan.badge}</p> : null}
              <h3>{plan.label}</h3>
              <p className={styles.price}>
                <b>{plan.monthlyLabel}</b>
                <span>/month</span>
              </p>
              <p className={styles.minutes}>
                {plan.minutesLabel}/month <span>· about {plan.perMinuteLabel}</span>
              </p>
              {plan.valueNote ? <p className={styles.value}>{plan.valueNote}</p> : null}
              <p className={styles.desc}>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <PlanCheckoutButton plan={key} className={plan.featured ? styles.ctaHot : styles.cta} />
              <p className={styles.terms}>
                {plan.firstMonthLabel
                  ? `${plan.firstMonthLabel} today for your first month, then ${plan.monthlyLabel}/month. Renews automatically. Cancel anytime.`
                  : plan.overageLabel
                    ? `${plan.monthlyLabel} today, then ${plan.monthlyLabel}/month. ${plan.minutesLabel} included, ${plan.overageLabel}, billed on your next invoice. Cancel anytime.`
                    : `${plan.monthlyLabel} today, then ${plan.monthlyLabel}/month. Renews monthly. Cancel anytime.`}
              </p>
              <TalkToAvaButton plan={key} />
            </article>
          );
        })}
      </div>
      {includes ? (
        <div className={styles.includes}>
          <h3>Starter, Growth, Pro and Elite include</h3>
          <ul>
            {AVA_PLAN_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.note}>
            Overflow includes 24/7 answering, the caller&rsquo;s details, and an emailed summary of every call. {AVA_OFFER.overflowLine}
          </p>
          <p className={styles.note}>{AVA_OFFER.overageNote}</p>
          <p className={styles.note}>
            Ava takes the details and emails them to you right after the call, so you can call the customer back and schedule the job.
          </p>
        </div>
      ) : null}
    </div>
  );
}
