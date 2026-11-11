import { Check } from 'lucide-react';
import { AVA_OFFER } from '@/lib/ava/pricing';

export function AvaPlanCards() {
  return (
    <div className="plan-grid">
      <article className="plan featured">
        <h3>Free 14-day pilot</h3>
        <p>Pay only when it books you work. Set up in person in Gadsden.</p>
        <div className="price">
          <strong>{AVA_OFFER.perBookedJobLabel}</strong>
          <span>/booked job · $0 until your first one</span>
        </div>
        <small>Never more than {AVA_OFFER.monthlyCapLabel}/month</small>
        <ul>
          <li><Check />24/7 answering on your own number</li>
          <li><Check />Lead summaries emailed within minutes</li>
          <li><Check />{AVA_OFFER.guarantee}</li>
        </ul>
        <a className="plan-btn" href={AVA_OFFER.demoUrl} target="_blank" rel="noopener noreferrer">
          Try the live demo
        </a>
        <a className="plan-btn" href="tel:+12565953354">
          Call Cole to set up your pilot
        </a>
      </article>
    </div>
  );
}
