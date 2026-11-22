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
  /** $20 Hot Leads: 500 mixed business leads, instant CSV download after checkout. */
  hotLeads500: 'https://buy.stripe.com/14AdRbanI68l4lXgOM0Ba0i',
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


/**
 * Mask a business email for the public sample table: keep the first two
 * characters of the local part, then bullets, then the real domain.
 * Example: office@domain.com → of•••@domain.com
 */
export function maskLeadEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const keep = local.slice(0, Math.min(2, local.length));
  return `${keep}•••@${domain}`;
}

/**
 * Ten real rows from the same 500-row Hot Leads list served after a paid
 * checkout (Vercel env HOT_LEADS_500_CSV). Emails are masked. The full file
 * is not in this repo. Chosen to show different cities and industries from
 * the list; emails never appear unmasked here.
 */
export const HOT_LEADS_SAMPLE_ROWS = [
  { business_name: 'Air Zone LLC', website: 'airzonellc.com', email: 'pa•••@gmail.com', city: 'Alabaster', state: 'AL' },
  { business_name: 'Accel Auto Repair', website: 'accelautorepair.net', email: 'na•••@accelautorepair.net', city: 'Birmingham', state: 'AL' },
  { business_name: 'J&L Plumbing', website: 'jlplumbingservices.com', email: 'in•••@jlplumbingservices.com', city: 'Cullman', state: 'AL' },
  { business_name: "AJ's Septic Service", website: 'ajsss.com', email: 'aj•••@gmail.com', city: 'Gadsden', state: 'AL' },
  { business_name: 'THE REFINERY', website: 'therefinery.clinic', email: 'in•••@therefinery.clinic', city: 'Guntersville', state: 'AL' },
  { business_name: 'Homes and Apartments for Rent - Athens, AL - Near Huntsville', website: 'c21jandlrealty.com', email: 'ce•••@gmail.com', city: 'Huntsville', state: 'AL' },
  { business_name: 'Rastore Day Spa', website: 'rastoredayspa.com', email: 'ra•••@gmail.com', city: 'Jasper', state: 'AL' },
  { business_name: 'Southside Family Dentistry', website: 'southsidefamilydentistry.com', email: 'so•••@gmail.com', city: 'Southside', state: 'AL' },
  { business_name: 'Scatterridge Lodge', website: 'scatterridgelodge.com', email: 'sc•••@gmail.com', city: 'Gatlinburg', state: 'TN' },
  { business_name: 'Rodeo Mechanical Bulls (RMB)', website: 'rodeomechanicalbulls.com', email: 'ro•••@gmail.com', city: 'Austin', state: 'TX' },
] as const;

export const LEAD_LIST_SUPPORT_EMAIL = 'hello@frontporchgrowth.com';

export const CAN_SPAM_NOTE =
  'These are publicly listed business contacts. If you email them, follow CAN-SPAM: use an honest subject line, include your mailing address, and give an easy way to opt out.';
