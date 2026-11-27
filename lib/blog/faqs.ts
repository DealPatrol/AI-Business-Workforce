/**
 * Short, quotable Q&A blocks for pricing articles (rendered as a visible
 * "Quick answers" list plus FAQPage JSON-LD on the post).
 *
 * Every number is computed from the same constants the comparison pages use:
 * competitor plans from COMPETITORS (checked PRICES_CHECKED_LABEL) and Ava's
 * plans from AVA_PLANS. Nothing here is typed in by hand.
 */
import { AVA_PLANS } from '@/lib/ava/pricing';
import { AVA_DEMO_LINE } from '@/lib/ava/demo-line';
import { getCompetitor, PRICES_CHECKED_LABEL } from '@/lib/er/competitors';

export type BlogFaq = { q: string; a: string };

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const andList = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
const perMinute = (price: number, minutes: number) => `$${(price / minutes).toFixed(2)}`;

/** "$1,725/month" -> 1725 */
function priceNumber(label: string) {
  const match = label.replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`No price in "${label}"`);
  return Number(match[1]);
}

/** "200 minutes" -> 200 */
function minutesNumber(label: string) {
  const match = label.replace(/,/g, '').match(/(\d+)\s*minutes/);
  if (!match) throw new Error(`No minutes in "${label}"`);
  return Number(match[1]);
}

export function rubyPlans() {
  const ruby = getCompetitor('ava-vs-ruby');
  if (!ruby) throw new Error('Ruby competitor data missing');
  return ruby.plans.map((plan) => ({ minutes: minutesNumber(plan.name), price: priceNumber(plan.price) }));
}

/** "$250 for 50 minutes to $1,725 for 500" from the Ruby plan data. */
export function rubyPriceRange() {
  const plans = rubyPlans();
  const first = plans[0];
  const last = plans[plans.length - 1];
  return `${usd(first.price)} for ${first.minutes} minutes to ${usd(last.price)} for ${last.minutes}`;
}

function avaStarterLine() {
  const s = AVA_PLANS.starter;
  const g = AVA_PLANS.growth;
  return `Executive Receptionist's AI receptionist, Ava, is ${s.monthlyLabel} a month for ${s.minutesLabel} on Starter (${s.firstMonthLabel} for the first month) and ${g.monthlyLabel} for ${g.minutesLabel} on Growth.`;
}

function rubyFaqs(): BlogFaq[] {
  const plans = rubyPlans();
  const list = plans.map((p) => `${usd(p.price)} a month for ${p.minutes} minutes`);
  const rates = plans.map((p) => `${perMinute(p.price, p.minutes)} on the ${p.minutes}-minute plan`);
  const hundred = plans.find((p) => p.minutes === AVA_PLANS.starter.minutes);
  const sameMinutes = hundred
    ? ` For the same ${hundred.minutes} minutes, Ruby lists ${usd(hundred.price)} and Ava Starter is ${AVA_PLANS.starter.monthlyLabel}.`
    : '';
  return [
    {
      q: 'How much does Ruby Receptionist cost?',
      a: `Ruby's published plans on ruby.com (checked ${PRICES_CHECKED_LABEL}) are ${andList(list)}. Real people answer the calls, and you pay by the receptionist minute.`,
    },
    {
      q: 'How much does Ruby cost per minute?',
      a: `Dividing each plan price by its minutes: ${andList(rates)}. Bigger plans cost less per minute.`,
    },
    {
      q: 'What does Ruby charge for extra minutes?',
      a: 'Ruby’s plans page did not show an overage rate in its text when we checked, so ask Ruby what extra minutes cost before you sign up.',
    },
    {
      q: 'Is there a cheaper alternative to Ruby?',
      a: `If you need every call answered and the details emailed to you, but not a human voice, an AI receptionist costs less. ${avaStarterLine()}${sameMinutes} You can hear Ava first on the demo line, ${AVA_DEMO_LINE.display}.`,
    },
  ];
}

function smithAiFaqs(): BlogFaq[] {
  const smith = getCompetitor('ava-vs-smith-ai');
  if (!smith) throw new Error('Smith.ai competitor data missing');
  const [free, pro, staffed] = smith.plans;
  return [
    {
      q: 'How much does Smith.ai cost?',
      a: `From Smith.ai's pricing pages (checked ${PRICES_CHECKED_LABEL}): the AI receptionist is ${free.price} for ${free.includes} on the free tier and ${pro.price} on Pro for ${pro.includes}. Staffed receptionists (people) are ${staffed.price} for ${staffed.includes}.`,
    },
    {
      q: 'Does Smith.ai charge per call or per minute?',
      a: `Per call. ${smith.overage}`,
    },
    {
      q: 'Is there a flat-priced alternative to Smith.ai?',
      a: `${avaStarterLine()} Plans are priced by included minutes, not per call. Call the demo line at ${AVA_DEMO_LINE.display} to hear Ava.`,
    },
  ];
}

const BLOG_FAQS: Record<string, () => BlogFaq[]> = {
  'ruby-receptionist-pricing': rubyFaqs,
  'smith-ai-pricing': smithAiFaqs,
};

export function getBlogFaqs(slug: string): BlogFaq[] {
  return BLOG_FAQS[slug]?.() ?? [];
}
