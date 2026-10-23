export type TradePage = {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  season: string;
  calls: string[];
  dispatch: string;
  dispatchSlug: string;
  reviews: string;
  leads: string;
  writing: string;
  faqs: { q: string; a: string }[];
};

export const TRADE_PAGES: TradePage[] = [
  {
    slug: 'plumbers',
    name: 'Plumbers',
    title: 'AI tools for plumbing companies | Front Porch Growth',
    description:
      'How a plumbing shop uses Executive Receptionist for leak calls, ReputationFlow for reviews, and Lead Scout for property managers.',
    h1: 'The leak call and the callback, for plumbing companies.',
    season: 'Plumbing demand shows up as interruptions: an active leak, a water heater, a drain, then a quieter fixture quote. The owner is often under a sink when the phone rings.',
    calls: ['Water still running', 'Drain or sewer backup', 'No hot water', 'A fixture that can wait until tomorrow'],
    dispatch: 'Executive Receptionist can ask whether the water is shut off, the address, and a callback number, then text you. It does not shut the water off or roll a truck.',
    dispatchSlug: 'ai-answering-service-for-plumbers',
    reviews: 'After a finished job, ReputationFlow can ask for a Google review with the same public link for every customer. A 5-star review is still about the repair, not the software.',
    leads: 'Lead Scout can list property managers and other businesses in a city. It does not email them. Use it when you want commercial accounts to call yourself.',
    writing: 'The estimate writer can turn “water heater leaking in the garage” into a note. Leave the price blank unless you already publish a diagnostic fee.',
    faqs: [
      {
        q: 'Will Executive Receptionist quote a repipe?',
        a: 'Only if you typed an approved line. Otherwise the draft and the call both avoid a number you did not provide.',
      },
      {
        q: 'Which plan answers after hours?',
        a: 'Starter is $77 a month after the 7-day trial and includes 300 minutes. That is the same price as the pricing page.',
      },
    ],
  },
  {
    slug: 'hvac',
    name: 'HVAC',
    title: 'AI tools for HVAC companies | Front Porch Growth',
    description:
      'After-hours no-cool calls, review requests, and drafts for HVAC shops. Executive Receptionist texts the lead. It does not replace your scheduling software.',
    h1: 'The no-cool call, for HVAC companies.',
    season: 'July and January pile up calls that all sound urgent. A two-truck shop does not have someone sitting on the dispatch board while a tech is in a crawlspace.',
    calls: ['No cooling or no heat', 'A system that is short cycling', 'A maintenance visit', 'A replacement question'],
    dispatch: 'Executive Receptionist asks whether the house has heat or cooling, the address, and when someone is home, then texts you. You book the call on the calendar you already use.',
    dispatchSlug: 'ai-answering-service-for-hvac',
    reviews: 'A tune-up is a natural time to ask for a review. ReputationFlow’s free QR tool can sit on the invoice or the truck. The public Google link does not change based on the star rating the customer taps.',
    leads: 'Lead Scout’s HVAC search is other businesses, such as property managers, not a list of homeowners with broken condensers.',
    writing: 'The service-area writer can draft a page for a city you actually cover. It will not invent a ranking or a review count.',
    faqs: [
      {
        q: 'Does this replace ServiceTitan or Housecall Pro?',
        a: 'No. Those products schedule and invoice. Executive Receptionist is the call layer. The comparison page links to their published prices.',
      },
      {
        q: 'Is the $12,000 changeout a promise?',
        a: 'No. The missed-call ad uses it as an illustration of a replacement versus a tune-up. It is not a customer result.',
      },
    ],
  },
  {
    slug: 'roofers',
    name: 'Roofers',
    title: 'AI tools for roofing companies | Front Porch Growth',
    description:
      'Storm and leak intake for roofers, plus review requests and a lead search that does not send mail.',
    h1: 'The storm call, for roofing companies.',
    season: 'After a hail or wind event the phone is a pile of “we have a leak” calls while crews are already on roofs. The homeowner who reaches a person first usually books the inspection.',
    calls: ['Active leak after rain', 'Missing shingles', 'Insurance inspection questions', 'A replacement that can be scheduled'],
    dispatch: 'Executive Receptionist can ask for the address, whether water is coming in, and a callback number. It should not interpret an insurance policy. You set that rule in the greeting.',
    dispatchSlug: 'ai-answering-service-for-roofers',
    reviews: 'Ask for the review after the inspection or the install, not while the tarp is going on. ReputationFlow keeps the Google link public either way.',
    leads: 'A roofing company using Lead Scout is looking at businesses in a city, not a storm map of damaged houses.',
    writing: 'The follow-up text writer can draft a check-in after an estimate. You send it from your own phone.',
    faqs: [
      {
        q: 'Can Executive Receptionist tell them what the carrier will pay?',
        a: 'No. The roofing guide says it should not interpret coverage. That limit is still in the product.',
      },
    ],
  },
  {
    slug: 'lawn-care',
    name: 'Lawn care',
    title: 'AI tools for lawn care companies | Front Porch Growth',
    description:
      'Weekly-route calls, postcard campaigns, and review requests for lawn care. You approve the mail. Executive Receptionist only texts the lead.',
    h1: 'The weekly route and the one-time cleanup, for lawn care.',
    season: 'Spring start-ups and the first hot week produce a burst of “can you come this week” calls. The rest of the year is route changes, skips, and the occasional cleanup.',
    calls: ['Weekly mowing', 'A one-time cleanup', 'Leaf removal', 'A customer who is already on the route'],
    dispatch: 'Executive Receptionist can ask for the address, a rough lot size if they know it, and whether they want a route or a single visit. It does not price the lawn from a room count it cannot see.',
    dispatchSlug: 'ai-answering-service-for-lawn-care',
    reviews: 'A finished cleanup is a reasonable time for a review request. Use the free QR on the door hanger you already leave, or ReputationFlow’s email request if you are on the $20 plan.',
    leads: 'YardMailer postcards are the mail product: you approve the concept, the list, and the postage before anything is sent. There is no published customer revenue figure for those cards on this site.',
    writing: 'The job ad writer can draft a crew-hiring post from the pay and the city you type. It will not add benefits you did not mention.',
    faqs: [
      {
        q: 'Do the postcards claim a dollar return?',
        a: 'No. Postcards are a $127 setup, charged once per customer, plus $3.54 per 4×6 card or $4.95 per 6×9 card. This site does not publish a revenue case study for the cards.',
      },
    ],
  },
  {
    slug: 'cleaners',
    name: 'Cleaners',
    title: 'AI tools for cleaning companies | Front Porch Growth',
    description:
      'Recurring and move-out intake for cleaning companies, review requests, and drafts that do not invent a per-room price.',
    h1: 'Bedrooms, bathrooms, and pets, for cleaning companies.',
    season: 'Cleaning quotes fall apart without the basics: how many bedrooms and bathrooms, pets, and whether this is a recurring clean or a move-out. The caller often wants a price before you have seen the house.',
    calls: ['Recurring house clean', 'Move-out', 'A deep clean after guests', 'A commercial space you may not take'],
    dispatch: 'Executive Receptionist asks the questions you approve and texts you. It does not promise a price from a room count. If you publish a starting rate, you can put that sentence in the call rules.',
    dispatchSlug: 'ai-answering-service-for-cleaning',
    reviews: 'Recurring clients are the reviews that mention reliability. ReputationFlow’s request goes out the same way for a happy client and an unhappy one.',
    leads: 'Lead Scout can find offices or short-term rental managers in a city if that is the trade you pick. House cleaner is on the list. The results are public listings, not a scraped homeowner file.',
    writing: 'The invoice reminder writer drafts a note for a clean that was already invoiced. It does not create the invoice. Invoicing on this site is still a waitlist.',
    faqs: [
      {
        q: 'Is invoicing for sale?',
        a: 'No. The homepage form saves a waitlist email and does not send mail. Estimates you need today are drafts from the estimate writer, not invoices.',
      },
    ],
  },
];

export function getTradePage(slug: string) {
  return TRADE_PAGES.find((page) => page.slug === slug);
}
