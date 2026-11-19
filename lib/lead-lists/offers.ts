/**
 * Lead-list funnel offers. Live Stripe payment links on the Workspace account.
 * Every lead product is built after the order from public sources: the business's own
 * website for the email. No delivery-time promises anywhere in this funnel.
 */
export const LEAD_LIST_LINKS = {
  leads1000: 'https://buy.stripe.com/5kQ00l7bwdANcStaqo0Ba0c',
  leads5000: 'https://buy.stripe.com/5kQ28t8fA2W95q1fKI0Ba0e',
  secondList: 'https://buy.stripe.com/5kQ28t3ZkaoBbOp9mk0Ba0d',
  emailSequence: 'https://buy.stripe.com/4gM00l9jE68lcStbus0Ba0f',
  monthly: 'https://buy.stripe.com/bJeaEZ1RcdAN3hTfKI0Ba0g',
  outreach: 'https://buy.stripe.com/14A8wR0N8aoBf0B5640Ba0h',
  /** $20 Hot Leads add-on: 1,000 more leads after a 500-lead order. */
  hotAddon1000: 'https://buy.stripe.com/6oUdRb67s2W919L2XW0Ba0j',
} as const;

/** Live Workspace payment link for the $20 / 500 Hot Leads offer. */
export const HOT_LEADS_500_PAYMENT_LINK_ID = 'plink_1UdeTSRJZZUpaweBjWElJm11';
export const HOT_LEADS_500_OFFER = 'hot-leads-500';

export const LEAD_LIST_STATES = [
  'Alabama',
  'Arkansas',
  'Florida',
  'Georgia',
  'Kentucky',
  'Louisiana',
  'Mississippi',
  'North Carolina',
  'South Carolina',
  'Tennessee',
  'Texas',
  'Virginia',
] as const;

export const LEAD_LIST_COLUMNS = ['business_name', 'website', 'email', 'city', 'state'] as const;

/** Fictional rows. The page labels them "sample format". */
export const SAMPLE_ROWS = [
  { business_name: 'Example Dental Studio', website: 'example.com', email: 'office@example.com', city: 'Huntsville', state: 'AL' },
  { business_name: 'Sample Roofing Co.', website: 'example.net', email: 'info@example.net', city: 'Macon', state: 'GA' },
  { business_name: 'Demo Law Group', website: 'example.org', email: 'contact@example.org', city: 'Knoxville', state: 'TN' },
] as const;

export const LEAD_LIST_SUPPORT_EMAIL = 'hello@frontporchgrowth.com';

export const CAN_SPAM_NOTE =
  'These are publicly listed business contacts. If you email them, follow CAN-SPAM: use an honest subject line, include your mailing address, and give an easy way to opt out.';
