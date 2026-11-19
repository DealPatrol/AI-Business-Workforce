/**
 * All-business landing pages for Executive Receptionist (Ava).
 *
 * Copy rules (Nov 18, 2026): Ava answers 24/7, takes the caller's name, number and reason, flags urgent calls,
 * and emails the details. The only calendar line allowed is the Desk calendar sentence below. Do not add texting,
 * outside-calendar sync, practice-software or field-service app claims, live transfer or handoff to a person, other
 * languages, compliance claims (HIPAA, bar rules), or pilot pricing to these pages.
 */

export type BusinessPageSlug = 'business' | 'dental' | 'law' | 'salon' | 'auto-repair' | 'med-spa' | 'real-estate';

export type BusinessCall = { title: string; caller: string; ava: string };

export type OwnerVoice = { quote: string; who: string; href: string };

export type BusinessPage = {
  slug: BusinessPageSlug;
  path: `/${BusinessPageSlug}`;
  /** Short name for breadcrumbs and schema, e.g. "Dental offices". */
  audience: string;
  eyebrow: string;
  headline: string;
  hook: string;
  /** "visits" or "appointments", used in the Desk calendar sentence. */
  bookingNoun: 'visits' | 'appointments';
  calls: BusinessCall[];
  details: string[];
  voices: OwnerVoice[];
};

export const DESK_CALENDAR_LINE = (noun: 'visits' | 'appointments') =>
  `Once your calendar is set up in the Desk, she books routine ${noun} into your Desk calendar during the call.`;

const COMMON_DETAILS = [
  'Answers your business line 24/7, nights, weekends and holidays, with a greeting written for your business.',
  'Takes the caller’s name, callback number, and the reason for the call.',
  'Flags urgent calls so they are the first thing you see.',
  'Emails you the details of every call right after it ends.',
  'Never makes up prices, availability, or policies. She only uses what you give her.',
];

export const BUSINESS_PAGES: Record<BusinessPageSlug, BusinessPage> = {
  business: {
    slug: 'business',
    path: '/business',
    audience: 'Local businesses',
    eyebrow: 'AI receptionist for any business that misses calls',
    headline: 'Every call answered, even when you can’t pick up.',
    hook:
      'Most callers won’t leave a voicemail. They hang up and call the next name on the list. Ava, your AI receptionist, answers every call, day or night, takes the caller’s name, number and reason for calling, flags anything urgent, and emails you the details.',
    bookingNoun: 'appointments',
    calls: [
      {
        title: 'The new customer',
        caller: '“Hi, do y’all have anything open this week? I’ve never been in before.”',
        ava: 'Ava greets them by your business name, gets their name, number and what they need, and emails it to you while they are still deciding.',
      },
      {
        title: 'The after-hours call',
        caller: '“I know you’re closed, I just didn’t want to forget to call.” (9:40 PM)',
        ava: 'Instead of voicemail, the caller talks to Ava. She takes the details and you see the lead in your inbox in the morning.',
      },
      {
        title: 'The urgent one',
        caller: '“This can’t wait until Monday. Who can I talk to?”',
        ava: 'Ava gets a name and callback number and marks the call urgent, so it is the first thing you see.',
      },
    ],
    details: [
      'Dental offices, law firms, salons and barbershops, auto shops, med spas, real estate agents, and any other business whose phone rings while everyone is busy.',
      'You decide what counts as urgent and what Ava should say about your services and prices.',
    ],
    voices: [
      {
        quote: 'Customer calls, no answer, customer calls the next guy.',
        who: 'Post on r/smallbusiness about owners who miss calls mid-job',
        href: 'https://www.reddit.com/r/smallbusiness/comments/1sz3nua/auto_shops_and_service_businesses_how_do_you/',
      },
    ],
  },
  dental: {
    slug: 'dental',
    path: '/dental',
    audience: 'Dental offices',
    eyebrow: 'AI receptionist for dental offices',
    headline: 'The front desk is checking someone in. Ava gets the phone.',
    hook:
      'New patients who reach voicemail often hang up and call the next practice. Ava answers every call your front desk can’t get to, plus nights and weekends. She takes the caller’s name, number and reason for calling, flags anyone in pain as urgent, and emails your office the details.',
    bookingNoun: 'visits',
    calls: [
      {
        title: 'New patient',
        caller: '“I just moved here and I’m looking for a new dentist. Are you taking new patients?”',
        ava: 'Ava answers with what you have told her, takes the name, number and what they are looking for, and emails it to your front desk.',
      },
      {
        title: 'Toothache after hours',
        caller: '“My tooth is killing me and it’s Saturday night.”',
        ava: 'Ava marks it urgent and takes a name and callback number so your team sees it first. She never gives medical advice. If you give her after-hours instructions, she reads those.',
      },
      {
        title: 'Reschedule',
        caller: '“I need to move my cleaning on Thursday.”',
        ava: 'Ava takes the details so the request is not lost in voicemail and a missed appointment does not turn into a no-show.',
      },
    ],
    details: [
      'Ava handles phone calls only. She does not connect to your practice software.',
      'Tell her what to say about insurance and new-patient openings; she will not guess.',
    ],
    voices: [
      {
        quote: 'A new patient can just hang up and call the next practice on the list, so a missed call can easily be a lost booking rather than a delayed one.',
        who: 'Commenter on r/Dentists',
        href: 'https://www.reddit.com/r/Dentists/comments/1x3ychd/how_do_dental_clinics_handle_missed_calls_when/',
      },
    ],
  },
  law: {
    slug: 'law',
    path: '/law',
    audience: 'Law firms',
    eyebrow: 'AI receptionist for law firms',
    headline: 'You’re in court. The next client is calling anyway.',
    hook:
      'Prospective clients often don’t leave a message. They call the next firm. Ava answers every call while you are in court, in a meeting, or off for the night. She takes the caller’s name, number and what the matter is about, flags urgent calls, and emails you the details so you can decide who to call back first.',
    bookingNoun: 'appointments',
    calls: [
      {
        title: 'New matter',
        caller: '“I was in a wreck last week and the insurance company keeps calling me.”',
        ava: 'Ava takes the name, number and a short description of the matter and emails it to you. She does not give legal advice or say whether you will take the case.',
      },
      {
        title: 'Existing client',
        caller: '“This is about my case. I need to talk to the attorney today.”',
        ava: 'Ava takes the details and marks the call urgent so it is the first thing you see.',
      },
      {
        title: 'After hours',
        caller: '“I got served papers today and I don’t know what to do.” (8 PM)',
        ava: 'Instead of voicemail, the caller talks to Ava. You have the name, number and reason in your inbox before you open the office.',
      },
    ],
    details: [
      'Ava handles phone calls only. She does not connect to your case management software or run conflict checks.',
      'You decide which calls count as urgent.',
    ],
    voices: [
      {
        quote: 'There are situations where I miss a call from a legitimate lead for one reason or another, and by the time I call back they’ve moved on.',
        who: 'Solo attorney on r/LawFirm',
        href: 'https://www.reddit.com/r/LawFirm/comments/wsjhfb/answering_service_for_solo_attorney_low_call/',
      },
    ],
  },
  salon: {
    slug: 'salon',
    path: '/salon',
    audience: 'Salons and barbershops',
    eyebrow: 'AI receptionist for salons and barbershops',
    headline: 'Your hands are full. Ava answers the phone.',
    hook:
      'Stylists shouldn’t have to stop a color or a cut to grab the phone, and callers who get voicemail often book somewhere else. Ava answers every call, takes the caller’s name, number and what they want, and emails you the details so you can call back between clients.',
    bookingNoun: 'visits',
    calls: [
      {
        title: 'New client',
        caller: '“Do you have anything Saturday for a cut and color? I’ve never been in.”',
        ava: 'Ava takes the name, number and the service they want and emails it to you, so the first-timer does not drift to the salon down the street.',
      },
      {
        title: 'Running late',
        caller: '“I’m stuck in traffic, I’ll be about 15 minutes late for my 2 o’clock.”',
        ava: 'Ava takes the message and marks it urgent so you see it before the chair sits empty.',
      },
      {
        title: 'Prices and hours',
        caller: '“How much is a men’s cut, and are you open Sunday?”',
        ava: 'Ava answers with the prices and hours you give her. If you have not told her, she takes the question so you can call back. She never makes up a price.',
      },
    ],
    details: ['Works whether you have a front desk or no front desk at all.'],
    voices: [
      {
        quote: 'We listen to voicemails and call back when we are not busy. Our policy is to not answer the phones when we are with clients.',
        who: 'Stylist on r/hairstylist',
        href: 'https://www.reddit.com/r/hairstylist/comments/1ffxibr/answering_machine/',
      },
    ],
  },
  'auto-repair': {
    slug: 'auto-repair',
    path: '/auto-repair',
    audience: 'Auto repair shops',
    eyebrow: 'AI receptionist for auto repair shops',
    headline: 'You’re under a car. The next job is calling.',
    hook:
      'When everyone is in the bays, the phone rings out and the customer calls the next shop. Ava answers every call, takes the name, number, vehicle and what is wrong, flags breakdowns as urgent, and emails you the details.',
    bookingNoun: 'visits',
    calls: [
      {
        title: 'No-start',
        caller: '“My truck won’t start. It clicks once and that’s it.”',
        ava: 'Ava takes the name, number, year, make and model, and what it is doing, marks it urgent, and emails it to you.',
      },
      {
        title: 'Price shopper',
        caller: '“How much for front brakes on a 2017 Camry?”',
        ava: 'Ava never makes up a price. She gives only the prices you set and takes the details so you can quote it.',
      },
      {
        title: 'After hours',
        caller: '“Check engine light came on driving home. Can I bring it in tomorrow?” (7:30 PM)',
        ava: 'Instead of voicemail, the caller talks to Ava. The lead is waiting in your inbox when you open.',
      },
    ],
    details: ['Ava handles phone calls only. She does not connect to your shop management software.'],
    voices: [
      {
        quote: 'Most customers don’t leave a voicemail and they don’t pick up if I call back.',
        who: 'Shop owner on r/AskMechanics',
        href: 'https://www.reddit.com/r/AskMechanics/comments/1n6rslg/keep_missing_calls_at_my_shop_anyone_else/',
      },
    ],
  },
  'med-spa': {
    slug: 'med-spa',
    path: '/med-spa',
    audience: 'Med spas',
    eyebrow: 'AI receptionist for med spas',
    headline: 'You’re with a client. Ava takes the consult call.',
    hook:
      'New clients usually want to ask a question or two before they book, and when they reach voicemail many just try the next spa. Ava answers every call, takes the caller’s name, number and what they are interested in, flags urgent calls, and emails you the details.',
    bookingNoun: 'visits',
    calls: [
      {
        title: 'Consult question',
        caller: '“How much is Botox, and do you do free consults?”',
        ava: 'Ava answers only with the prices and policies you give her, takes the name and number, and emails you the lead.',
      },
      {
        title: 'Post-treatment concern',
        caller: '“I had filler yesterday and the swelling is getting worse.”',
        ava: 'Ava marks it urgent and gets a callback number so your provider sees it first. She never gives medical advice.',
      },
      {
        title: 'After hours',
        caller: '“Do you have any openings next week?” (10 PM)',
        ava: 'Instead of voicemail, the caller talks to Ava. The details are in your inbox when you open.',
      },
    ],
    details: ['Ava handles phone calls only. She does not connect to your booking or charting software.'],
    voices: [
      {
        quote: 'We tried voicemail → barely anyone leaves one. We tried calling back later → half of them already went somewhere else.',
        who: 'Med spa owner on r/MedSpa',
        href: 'https://www.reddit.com/r/MedSpa/comments/1nb8lej/how_do_you_guys_deal_with_missed_calls_at_your/',
      },
    ],
  },
  'real-estate': {
    slug: 'real-estate',
    path: '/real-estate',
    audience: 'Real estate agents',
    eyebrow: 'AI receptionist for real estate agents',
    headline: 'You’re at a showing. The next buyer is calling.',
    hook:
      'Buyers and sellers often call more than one agent and go with whoever answers. Ava answers every call while you are showing a house or at a closing, takes the caller’s name, number and what they are looking for, flags urgent calls, and emails you the details.',
    bookingNoun: 'appointments',
    calls: [
      {
        title: 'Sign call',
        caller: '“I’m sitting in front of the house on Oak Street. Is it still available?”',
        ava: 'Ava takes the name, number and which property, and emails it to you right away. She only shares listing facts you give her.',
      },
      {
        title: 'Seller',
        caller: '“We’re thinking about selling this spring. What would our house go for?”',
        ava: 'Ava never guesses a price. She takes the address, name and number so you can call back with a real answer.',
      },
      {
        title: 'Under contract',
        caller: '“The inspector needs access tomorrow morning. Who do I talk to?”',
        ava: 'Ava marks it urgent and takes the details so you see it first.',
      },
    ],
    details: ['Ava handles phone calls only. She does not connect to your CRM or MLS.'],
    voices: [
      {
        quote: 'How many realtors do you call before finding one that will actually call you back?',
        who: 'Buyer’s question on r/RealEstate',
        href: 'https://www.reddit.com/r/RealEstate/comments/pmod6e/how_many_realtors_do_you_call_before_finding_one/',
      },
    ],
  },
};

export const BUSINESS_PAGE_SLUGS = Object.keys(BUSINESS_PAGES) as BusinessPageSlug[];
export const INDUSTRY_PAGE_SLUGS = BUSINESS_PAGE_SLUGS.filter((slug) => slug !== 'business');

export function businessPageDetails(page: BusinessPage) {
  return [...COMMON_DETAILS, ...page.details];
}

/** Words the receptionist copy rule forbids on these pages. Checked by business-pages.test.ts. */
export const FORBIDDEN_BUSINESS_COPY = [
  /\btext(ing|s|ed)?\b/i,
  /\bsms\b/i,
  /google calendar/i,
  /\bspanish\b/i,
  /transfer/i,
  /hand ?off/i,
  /\bpilot\b/i,
  /\$25/,
  /\$297/,
  /hipaa/i,
  /complian/i,
  /guarantee/i,
];
