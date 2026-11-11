/**
 * Every Front Porch Growth tool a customer can reach from the Desk.
 * `signedIn` tools live under /dashboard and ask for a login; the rest are public pages.
 */
export type DeskTool = {
  key: string;
  name: string;
  what: string;
  href: string;
  signedIn: boolean;
  status: 'live' | 'waitlist';
};

export const DESK_TOOLS: readonly DeskTool[] = [
  {
    key: 'leads',
    name: 'Leads & CRM',
    what: 'Every caller Ava captured, plus web forms, texts, and bookings. Mark each one contacted, booked, or not a fit.',
    href: '/dashboard/leads',
    signedIn: true,
    status: 'live',
  },
  {
    key: 'lead-finder',
    name: 'Lead Finder',
    what: 'Build buyer lists and outreach drafts. Nothing sends until you approve it.',
    href: '/dashboard/prospector',
    signedIn: true,
    status: 'live',
  },
  {
    key: 'lead-scout',
    name: 'Lead Scout',
    what: 'Search public business listings by trade and city to see who is out there.',
    href: '/lead-scout',
    signedIn: false,
    status: 'live',
  },
  {
    key: 'postcards',
    name: 'Postcard mailer',
    what: 'YardMailer cards with a QR estimate page. You approve every card and street before it prints.',
    href: '/postcards',
    signedIn: false,
    status: 'live',
  },
  {
    key: 'qr-inbox',
    name: 'Postcard QR inbox',
    what: 'Homeowners who scanned a card and asked for an estimate.',
    href: '/dashboard/campaigns',
    signedIn: true,
    status: 'live',
  },
  {
    key: 'ai-photos',
    name: 'AI inspiration photos',
    what: 'Show a homeowner their property today next to an AI concept of the finished job.',
    href: '/visual-canvasser',
    signedIn: false,
    status: 'live',
  },
  {
    key: 'bookings',
    name: 'Online booking',
    what: 'Set services and hours, share a booking page, and take a deposit up front.',
    href: '/dashboard/bookings',
    signedIn: true,
    status: 'live',
  },
  {
    key: 'invoices',
    name: 'Invoices',
    what: 'Estimates and invoices for the jobs Ava brings in. On the waitlist today.',
    href: '/#invoicing',
    signedIn: false,
    status: 'waitlist',
  },
  {
    key: 'reviews',
    name: 'Review requests',
    what: 'Ask for a Google review after a finished job and draft the reply.',
    href: '/reputation',
    signedIn: false,
    status: 'live',
  },
  {
    key: 'agents',
    name: 'Writing agents',
    what: 'Draft estimates, follow-up texts, job ads, and invoice reminders. You copy the draft; nothing sends.',
    href: '/agents',
    signedIn: false,
    status: 'live',
  },
  {
    key: 'missed-call',
    name: 'Missed-call text-back',
    what: 'A lighter option: a missed caller gets a text from your business.',
    href: '/missed-call',
    signedIn: false,
    status: 'waitlist',
  },
  {
    key: 'google-profile',
    name: 'Google Business Profile',
    what: 'Get your profile set up or cleaned up so callers find you.',
    href: '/google-profile',
    signedIn: false,
    status: 'live',
  },
] as const;
