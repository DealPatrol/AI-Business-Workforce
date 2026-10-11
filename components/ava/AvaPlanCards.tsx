import { Check } from 'lucide-react';
import { TrackedCheckoutLink } from '@/components/analytics/TrackedCheckoutLink';
import { AVA_PLANS, type AvaPlanKey } from '@/lib/ava/pricing';

export function AvaPlanCards() {
  const plans = (Object.keys(AVA_PLANS) as AvaPlanKey[]).map((key) => AVA_PLANS[key]);

  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <article className={plan.featured ? 'plan featured' : 'plan'} key={plan.key}>
          {plan.featured ? <span className="popular">MOST BOOKED</span> : null}
          <h3>{plan.label}</h3>
          <p>{plan.description}</p>
          <div className="price">
            <strong>{plan.monthlyLabel}</strong>
            <span>/mo after trial</span>
          </div>
          <small>
            {plan.minutes.toLocaleString('en-US')} minutes · {plan.overageLabel}
          </small>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>
                <Check />
                {feature}
              </li>
            ))}
          </ul>
          <TrackedCheckoutLink className="plan-btn" href={`/api/checkout?plan=${plan.key}`} plan={plan.key}>
            Start 7-day trial
          </TrackedCheckoutLink>
        </article>
      ))}
    </div>
  );
}
