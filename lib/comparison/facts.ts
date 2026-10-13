export const COMPARISON_AS_OF = '2026-10-13';

export type ComparisonFact = {
  name: string;
  category: string;
  publishedPrice: string;
  terms: string;
  whatTheyPublish: string;
  sourceLabel: string;
  sourceUrl: string;
};

/**
 * Facts read from each company's own public pages on 2026-10-13.
 * Dollar amounts are copied only when that page showed them.
 */
export const COMPARISON_FACTS: ComparisonFact[] = [
  {
    name: 'Front Porch Growth',
    category: 'This site',
    publishedPrice:
      'Executive Receptionist is $79, $149, or $299 a month after a 7-day trial and a $0 setup fee. YardProof postcards are a $99/month founding offer. Demo Blast 10 is $49. ReputationFlow, a separate site Cole operates, publishes a free starter and Professional at $20/month.',
    terms: 'Executive Receptionist trial and prices are the Stripe plans on this site. ReputationFlow says Professional is billed monthly and can be canceled in the Stripe customer portal, with no setup fee.',
    whatTheyPublish:
      'Executive Receptionist answers forwarded calls and texts the lead. It does not book a calendar. Postcards mail only after you approve the concept, audience, and costs. Lead Scout searches public listings and does not contact them. The writing agents draft text on the page and do not send it.',
    sourceLabel: 'frontporchgrowth.com/pricing and tryreputationflow.com/pricing',
    sourceUrl: 'https://frontporchgrowth.com/pricing',
  },
  {
    name: 'ServiceTitan',
    category: 'Field service software',
    publishedPrice:
      'ServiceTitan’s pricing pages do not publish a starting dollar price. They describe per-technician packages and ask for a demo or a package choice.',
    terms:
      'ServiceTitan’s Terms of Use say subscriptions are month-to-month unless otherwise agreed, and that written notice, including email to support@servicetitan.com, is enough to terminate.',
    whatTheyPublish:
      'The pricing page lists dispatching, scheduling, call booking, invoicing, and a pricebook among the product. That is a full operating system. Executive Receptionist does not replace it.',
    sourceLabel: 'servicetitan.com/pricing',
    sourceUrl: 'https://www.servicetitan.com/pricing',
  },
  {
    name: 'Jobber',
    category: 'Field service software',
    publishedPrice:
      'Jobber’s pricing page says plans start at $29/month. The recommendation cards say Core starts at $29/month, Connect at $99/month, Grow at $149/month, and Plus at $399/month, with annual billing called out. The one-user Core block also shows $49/month with no commitment and $29/month billed annually. Additional users are listed at $29/month each. The page’s own description says plans run from $29 to $529/month billed annually.',
    terms:
      'Jobber’s pricing FAQ says a monthly plan with no commitment can be canceled any time and ends at the end of the billing period. A monthly 1-year commitment keeps billing through the 12 months. An annual plan is paid up front and that initial payment is non-refundable.',
    whatTheyPublish:
      'Scheduling, quoting, invoicing, and, on the Plus feature list, an AI receptionist. Jobber is the system of record for jobs. This site does not invoice or schedule crews.',
    sourceLabel: 'getjobber.com/pricing',
    sourceUrl: 'https://www.getjobber.com/pricing/',
  },
  {
    name: 'Housecall Pro',
    category: 'Field service software',
    publishedPrice:
      'The public pricing page title says plans are from $59/month, and the Basic plan is shown at $59/month billed annually for 1 user. Essentials is described as including 5 users. MAX is described as including 8 users, with $35/month per additional user. Dollar prices for Essentials and MAX were not copied here because that page shows them after an industry quiz.',
    terms:
      'Housecall Pro’s FAQ says it does not require long-term contracts. The same page says the trial is 14 days of MAX features with no credit card. Card processing is listed as low as 2.59%, and bank payments at 1%.',
    whatTheyPublish:
      'Online booking, invoices, scheduling and dispatching, quotes, and review management. Those are field-service tools. Front Porch Growth does not claim to include them.',
    sourceLabel: 'housecallpro.com/pricing',
    sourceUrl: 'https://www.housecallpro.com/pricing/',
  },
  {
    name: 'Podium',
    category: 'Reviews and messaging',
    publishedPrice:
      'Podium’s current pricing flow at podium.com/getpricing asks for a custom quote and does not show one home-services price. A Podium article still on podium.com lists Core at $399 per month and Pro at $599 per month, and says HVAC pricing can differ.',
    terms: 'The live quote page does not publish a contract length. Do not treat $399 as the price a contractor will be offered.',
    whatTheyPublish:
      'The article describes messaging, reviews, and webchat. ReputationFlow is a separate review-request product at $20/month for Professional. It is not Podium.',
    sourceLabel: 'podium.com/getpricing and Podium’s Sprout Social alternatives article',
    sourceUrl: 'https://www.podium.com/getpricing',
  },
  {
    name: 'Birdeye',
    category: 'Reviews and listings',
    publishedPrice: 'Birdeye’s pricing page lists location bands and does not publish a dollar price.',
    terms:
      'Birdeye’s own article “What does Birdeye cost?” says pricing is custom, based on locations, products, and contract terms, and that agreements are typically annual.',
    whatTheyPublish: 'Reviews, listings, and messaging for multi-location brands. No customer-count claim from Birdeye is repeated here.',
    sourceLabel: 'birdeye.com/pricing',
    sourceUrl: 'https://birdeye.com/pricing/',
  },
  {
    name: 'Smith.ai',
    category: 'Live receptionist',
    publishedPrice:
      'Smith.ai’s receptionist pricing page lists $300/month for 30 calls ($11.50 per call over 30), $810/month for 90 calls ($10.50 over), and $2,100/month for 300 calls ($8.50 over).',
    terms:
      'The same page says the service is month-to-month, with no long-term contract, and that new clients get a 30-day money-back guarantee. Add-on prices, such as appointment booking at $1.50, are listed separately.',
    whatTheyPublish:
      'People answer the calls. Executive Receptionist is software on the Starter plan at $79/month after the trial, with 300 included minutes, and it texts you instead of transferring to a live receptionist.',
    sourceLabel: 'smith.ai/pricing/receptionists',
    sourceUrl: 'https://smith.ai/pricing/receptionists',
  },
  {
    name: 'Ruby',
    category: 'Live receptionist',
    publishedPrice:
      'Ruby’s blog says virtual receptionist plans start at $250 per month for 50 minutes and go up to $1,725 per month for 500 minutes. The pricing page also lists 50, 100, 200, and 500 minute plans. Chat add-on prices on that page were not used as the receptionist price.',
    terms: 'Confirm the current minute price and overage on Ruby’s pricing page before you compare a quote. This row uses Ruby’s own blog sentence for the dollar range.',
    whatTheyPublish: 'Live receptionists billed by the minute. Executive Receptionist is not a staffed answering service.',
    sourceLabel: 'ruby.com blog, virtual vs traditional receptionist',
    sourceUrl: 'https://www.ruby.com/blog/virtual-vs-traditional-receptionist-cost-comparison/',
  },
];

export const COMPARISON_SOURCES = [
  { label: 'ServiceTitan pricing', url: 'https://www.servicetitan.com/pricing' },
  { label: 'ServiceTitan Terms of Use (PDF)', url: 'https://get.servicetitan.com/rs/304-EAE-038/images/TermsOfUse.pdf' },
  { label: 'Jobber pricing', url: 'https://www.getjobber.com/pricing/' },
  { label: 'Housecall Pro pricing', url: 'https://www.housecallpro.com/pricing/' },
  { label: 'Podium pricing', url: 'https://www.podium.com/getpricing' },
  { label: 'Podium article listing Core at $399/month', url: 'https://www.podium.com/article/sprout-social-alternatives' },
  { label: 'Birdeye pricing', url: 'https://birdeye.com/pricing/' },
  { label: 'What does Birdeye cost?', url: 'https://birdeye.com/blog/what-does-birdeye-cost/' },
  { label: 'Smith.ai receptionist pricing', url: 'https://smith.ai/pricing/receptionists' },
  { label: 'Ruby pricing article', url: 'https://www.ruby.com/blog/virtual-vs-traditional-receptionist-cost-comparison/' },
  { label: 'Ruby plans', url: 'https://www.ruby.com/plans-and-pricing/' },
  { label: 'ReputationFlow pricing', url: 'https://tryreputationflow.com/pricing' },
] as const;
