import { exampleSentence } from '@/lib/ava/missed-call-math';
import { BLS_RECEPTIONIST, GOOGLE_NEARBY_SEARCH } from '@/lib/ava/sources';

export type GuideKind = 'trade' | 'guide' | 'comparison' | 'calculator';

export type GuideFaq = { q: string; a: string };

export type GuideSource = { href: string; text: string };

export type GuideColumn = { title: string; body: string };

export type GuideCostRow = { option: string; cost: string; notes: string };

export type GuideCityNote = { city: string; body: string };

export type AvaGuide = {
  slug: string;
  kind: GuideKind;
  navLabel: string;
  blurb: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  /** Plain-language answer shown immediately under the H1. */
  directAnswer?: string;
  audience: string;
  lede: string;
  pain: string;
  calls: string[];
  qualification: string[];
  roiTitle: string;
  roiBody: string;
  faqs: GuideFaq[];
  related: string[];
  columns?: GuideColumn[];
  sources?: GuideSource[];
  costRows?: GuideCostRow[];
  costNote?: string;
  cityNotes?: GuideCityNote[];
  areaServed?: string[];
};

const blsSource: GuideSource = {
  href: BLS_RECEPTIONIST.url,
  text: `${BLS_RECEPTIONIST.name}: median pay ${BLS_RECEPTIONIST.medianAnnual.toLocaleString('en-US')} dollars a year (${BLS_RECEPTIONIST.medianHourly.toFixed(2)} dollars an hour) in ${BLS_RECEPTIONIST.period}.`,
};

const nearbySource: GuideSource = {
  href: GOOGLE_NEARBY_SEARCH.url,
  text: `${GOOGLE_NEARBY_SEARCH.name} (${GOOGLE_NEARBY_SEARCH.period}). ${GOOGLE_NEARBY_SEARCH.summary}`,
};

function trade(input: Omit<AvaGuide, 'kind'> & { kind?: 'trade' }): AvaGuide {
  return { ...input, kind: 'trade' };
}

export const AVA_GUIDES: AvaGuide[] = [
  trade({
    slug: 'ai-answering-service-for-plumbers',
    navLabel: 'Plumbers',
    blurb: 'Active leaks, drains, water heaters, and after-hours dispatch intake.',
    title: 'AI Answering Service for Plumbers',
    metaTitle: 'AI Receptionist & Answering Service for Plumbers',
    description:
      'An AI answering service for plumbers that answers 24/7, takes the job details, and emails you the lead. Starter is $1 the first month, then $79/mo.',
    eyebrow: 'AI answering service for plumbers',
    h1: 'AI answering service for plumbers',
    directAnswer:
      'Executive Receptionist is an AI answering service for plumbing shops. She answers the calls you forward, asks whether the water is shut off, takes the name, callback number, address, and what’s wrong, and emails you the lead. Plans are Starter $79 a month (first month $1, 100 minutes), Growth $197, Pro $397, and Elite $789. Hear her on the demo line at (256) 952-4935.',
    audience: 'plumbing companies and owner-operators',
    lede:
      'A homeowner with water on the floor does not wait on voicemail. Executive Receptionist picks up, asks whether they can shut the water off, and emails you a lead you can dispatch or call back.',
    pain:
      'Plumbing demand shows up as interruptions. The owner is soldering, the apprentice is driving, and the office line — if there is one — is the same cell phone in a pocket. The caller who reaches a person first usually gets the job.',
    calls: [
      'Active leaks and “water won’t stop” calls',
      'Clogged drains, toilets, and sewer backups',
      'Water heater leaks, no hot water, and replacement questions',
      'Fixture installs that can wait until tomorrow',
      'After-hours calls from property managers and homeowners',
    ],
    qualification: [
      'Caller name and a direct callback number',
      'Service address and whether anyone is home',
      'What is leaking or blocked, and which fixture',
      'Whether the water is shut off',
      'How soon they need someone on site',
    ],
    roiTitle: 'What a missed plumbing call is worth — as an example you edit',
    roiBody: `Emergency calls are the ones that will not leave a second voicemail. ${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 425, jobLabel: 'plumbing job' })} A plan from $79 a month is the published price to compare against your own version of that example.`,
    faqs: [
      {
        q: 'Can Executive Receptionist tell an emergency from a faucet quote?',
        a: 'You write the urgent rules. A typical plumbing setup asks whether water is still running and flags active flooding for the callback path you choose. Executive Receptionist does not shut off water or dispatch a truck by herself.',
      },
      {
        q: 'Will she quote a price on the call?',
        a: 'Only if you give her an approved line, such as a diagnostic fee you already publish. She should not invent trip charges or repair prices.',
      },
      {
        q: 'Can I keep my current plumbing number?',
        a: 'Usually, by forwarding the calls you do not answer. The exact carrier steps are confirmed during setup. Executive Receptionist does not replace your phone carrier.',
      },
      {
        q: 'How much does an AI answering service for plumbers cost?',
        a: 'Four monthly plans: Starter $79 (100 minutes, first month $1), Growth $197 (300 minutes), Pro $397 (1,200 minutes), Elite $789 (2,000 minutes). Month to month, cancel anytime. If you run past your minutes, Ava keeps answering and we reach out about a bigger plan.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-hvac',
    navLabel: 'HVAC',
    blurb: 'No-cool, no-heat, maintenance, and replacement estimate calls.',
    title: 'AI Answering Service for HVAC',
    metaTitle: 'AI Receptionist & Answering Service for HVAC Companies',
    description:
      'AI Receptionist answers HVAC calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for HVAC',
    h1: 'Pick up the no-cool call while the tech is on another roof.',
    audience: 'HVAC contractors and heating and cooling teams',
    lede:
      'Peak season is a pile of calls that all sound urgent. Executive Receptionist asks whether the house has heat or cooling, what the system is doing, and when someone can be home — then emails you the lead.',
    pain:
      'A two-truck shop does not have a dispatcher sitting still in July. The phone rings while someone is in a crawlspace. If that call rolls to voicemail, the homeowner is already looking at the next company in the map pack.',
    calls: [
      'No cooling and no heat',
      'Strange noises, short cycling, and thermostat complaints',
      'Maintenance and tune-up requests',
      'Replacement and “how much is a new system” questions',
      'After-hours calls when the on-call tech is already out',
    ],
    qualification: [
      'Name and callback number',
      'Service address',
      'Heat, cooling, or indoor air problem',
      'Whether the system is running at all',
      'Repair, maintenance, or replacement intent',
    ],
    roiTitle: 'A worked example for a missed no-cool call',
    roiBody: `Replacement leads and same-day repairs are not the same ticket. Use a number you recognize. ${exampleSentence({ missedPerWeek: 8, oneIn: 4, jobValue: 350, jobLabel: 'HVAC service call' })} If your real ticket is a system replacement, put that higher number in the calculator instead of treating $350 as typical.`,
    faqs: [
      {
        q: 'Can Executive Receptionist handle emergency HVAC wording?',
        a: 'She can flag the phrases you list, such as no heat with someone medically vulnerable in the home, and follow the escalation note you wrote. Life-safety situations still follow your human policy, including telling the caller to contact emergency services when that is your rule.',
      },
      {
        q: 'Does Executive Receptionist replace ServiceTitan or Housecall Pro?',
        a: 'No. Executive Receptionist is the call layer. Your field software stays where jobs are scheduled and invoiced.',
      },
      {
        q: 'Can maintenance agreements and replacement leads use different questions?',
        a: 'Yes. Growth and Pro include more room for separate service types and routing. Starter still covers one clear intake: who, where, and what is wrong.',
      },
    ],
    related: ['best-ai-receptionist-for-hvac-companies', 'ai-answering-service-for-plumbers', 'ai-receptionist-for-hvac-and-plumbing-in-alabama'],
  }),
  trade({
    slug: 'ai-answering-service-for-roofers',
    navLabel: 'Roofers',
    blurb: 'Storm, leak, inspection, and replacement calls while crews are on roofs.',
    title: 'AI Answering Service for Roofers',
    metaTitle: 'AI Receptionist for Roofing Companies, Plans from $79/mo',
    description:
      'AI Receptionist answers roofing calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for roofers',
    h1: 'Catch the storm calls that hit while every ladder is already up.',
    audience: 'roofing contractors and storm-response crews',
    lede:
      'After hail, the phone does not ring once. It rings while you are on someone else’s roof. Executive Receptionist takes the address, asks whether water is coming in now, and emails you a list you can schedule instead of a voicemail box.',
    pain:
      'Roofing sales happen away from a desk. A leak caller and a “we might need a roof next year” caller leave the same kind of voicemail. Sorting them at 8 p.m. is how inspections slip to the company that answered at 2 p.m.',
    calls: [
      'Active roof leaks',
      'Hail and wind claims that need an inspection',
      'Full replacement estimates',
      'Missing shingles after a storm',
      'Gutter and exterior questions you choose to accept',
    ],
    qualification: [
      'Name and callback number',
      'Property address',
      'Leak, storm date, or planned replacement',
      'Whether water is entering the house now',
      'Roof type if the caller knows it',
    ],
    roiTitle: 'Storm weeks are a volume problem, not a staffing slogan',
    roiBody: `One booked inspection is not a closed roof. Count it as a conversation you got to have. ${exampleSentence({ missedPerWeek: 10, oneIn: 5, jobValue: 500, jobLabel: 'roof inspection you would have run' })} Put your own average job in the calculator if you sell replacements. Do not treat the example as a revenue forecast.`,
    faqs: [
      {
        q: 'Can Executive Receptionist talk about insurance?',
        a: 'She can ask whether the caller already filed a claim and when the storm was, if you want those facts. She should not interpret coverage or tell anyone what a carrier will pay.',
      },
      {
        q: 'What about a surge of fifty calls?',
        a: 'Executive Receptionist can take them one after another and email you each lead. If a storm week runs you past your plan’s minutes, she keeps answering and we reach out about moving you up a plan. No surprise per-minute charges.',
      },
      {
        q: 'Can urgent leaks be marked differently from estimate requests?',
        a: 'Yes. You write the rule. A typical one is: water coming inside now gets a different text prefix than a spring replacement quote.',
      },
    ],
    related: ['ai-answering-service-for-general-contractors', 'missed-call-cost-calculator', 'ai-answering-service-for-painters'],
  }),
  trade({
    slug: 'ai-answering-service-for-electricians',
    navLabel: 'Electricians',
    blurb: 'Outages, panel questions, and the calls that should be 911 instead.',
    title: 'AI Answering Service for Electricians',
    metaTitle: 'AI Receptionist & Answering Service for Electricians',
    description:
      'AI Receptionist answers electrical calls and emails you the lead. She does not give electrical advice. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for electricians',
    h1: 'Take the panel call without stepping off the ladder.',
    audience: 'electrical contractors',
    lede:
      'Executive Receptionist can ask which breakers tripped, whether the whole house is dark, and if anyone smells burning. Burning, sparks, or a line on the ground should follow the emergency instruction you write — often “call 911 and the utility,” not “wait for a callback.”',
    pain:
      'Electrical work is hard to pause, and the dangerous calls are mixed in with EV charger quotes and “this outlet died.” A voicemail does not ask the safety question. The next electrician who answers does.',
    calls: [
      'Partial outages and tripped breakers',
      'Panel upgrades and capacity questions',
      'EV charger and remodel wiring estimates',
      'Flickering lights and warm outlets',
      'Storm outages where the utility may already own the problem',
    ],
    qualification: [
      'Name and callback number',
      'Service address',
      'Whole home, one room, or one device',
      'Burning smell, sparks, or a downed line — yes or no',
      'Repair now or an estimate later',
    ],
    roiTitle: 'Use your own average ticket, not a national electrical average',
    roiBody: `Service calls and panel replacements should not share one pretend average. ${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 280, jobLabel: 'electrical service call' })} If you mostly sell panel upgrades, raise the job value. The point is to see the gap next to a plan from $79 a month, with your numbers.`,
    faqs: [
      {
        q: 'Will Executive Receptionist tell people how to reset a breaker?',
        a: 'Only if you explicitly approve that sentence. By default she should collect the situation and avoid coaching someone through a panel.',
      },
      {
        q: 'What if the caller reports a downed line?',
        a: 'Put that in urgent rules: tell them to stay away and contact emergency services and the utility. Executive Receptionist is not a utility dispatcher.',
      },
      {
        q: 'Can she book the job on my calendar?',
        a: 'Not in this product. She emails the lead. You call back and schedule in whatever system you already use.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'ai-answering-service-for-garage-door', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-landscapers',
    navLabel: 'Landscapers',
    blurb: 'Installs, cleanups, and design-build estimates while the crew is on site.',
    title: 'AI Answering Service for Landscapers',
    metaTitle: 'AI Receptionist for Landscapers, 24/7, Plans from $79/mo',
    description:
      'AI Receptionist answers landscaping calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for landscapers',
    h1: 'Stay on the install. Let Executive Receptionist take the next estimate call.',
    audience: 'landscaping companies',
    lede:
      'Landscape leads are specific: new beds, a patio, drainage, a cleanup after a storm. Executive Receptionist asks which of those they want, where the property is, and when they hope to start, then emails you enough to decide if it is your work.',
    pain:
      'The person who can price a project is usually the person running equipment. Returning a vague voicemail at dusk means a second call just to learn they wanted a sketch, not mowing. The sample call on the Executive Receptionist homepage is a landscaping estimate so you can hear that pace.',
    calls: [
      'New landscape and planting projects',
      'Hardscape, drainage, and grading questions',
      'Seasonal cleanups and hedge work',
      'Design questions that need a site visit',
      'Calls that are actually weekly mowing — which you can route differently',
    ],
    qualification: [
      'Name and phone number',
      'Property address and city',
      'The work they described, in their words',
      'Rough timing',
      'Whether they want a site visit or a recurring route',
    ],
    roiTitle: 'An estimate you never hear about cannot be won',
    roiBody: `A landscape project’s value varies too much to publish one “average job.” ${exampleSentence({ missedPerWeek: 4, oneIn: 3, jobValue: 900, jobLabel: 'landscape estimate you would have visited' })} Count the visit, not a closed contract, unless you put your own close rate into the calculator.`,
    faqs: [
      {
        q: 'Is this the same as the lawn care page?',
        a: 'No. Lawn care is mostly recurring routes and same-week starts. This page is project work: installs, cleanups, and site visits. You can still use one Executive Receptionist for both if you spell out the two question paths.',
      },
      {
        q: 'Can Executive Receptionist describe plants or promise a design?',
        a: 'She should not design the yard on the call. She captures the request so you can look at the property.',
      },
      {
        q: 'Where is the sample call?',
        a: 'On the Executive Receptionist homepage, labeled as a prerecorded landscaping estimate. It is an example, not a recording of a customer of yours.',
      },
    ],
    related: ['ai-answering-service-for-lawn-care', 'ai-answering-service-for-fencing', 'ai-answering-service-for-tree-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-lawn-care',
    navLabel: 'Lawn care',
    blurb: 'Weekly mowing, cleanups, and route leads while you are on a mower.',
    title: 'AI Answering Service for Lawn Care',
    metaTitle: 'AI Receptionist for Lawn Care Companies, Plans from $79/mo',
    description:
      'AI Receptionist answers lawn care calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for lawn care',
    h1: 'Take the new-route call without killing the mower.',
    audience: 'lawn care and mowing companies',
    lede:
      'Lawn leads are often simple and time-sensitive: they want someone this week. Executive Receptionist asks for the address, lot size if they know it, and whether they want weekly service or a one-time cut.',
    pain:
      'Route density matters. A missed call across town is not the same as a missed call on a street you already mow. Voicemail rarely includes the cross street. You call back and they have already booked the neighbor’s kid or the other lawn company.',
    calls: [
      'Weekly mowing for a new address',
      'One-time cuts and move-out yards',
      'Leaf cleanup and bed weeding',
      '“Do you service my neighborhood?”',
      'Existing customers asking to skip or add a visit',
    ],
    qualification: [
      'Name and mobile number',
      'Street address',
      'Recurring or one-time',
      'Rough yard size or “I’ll text a photo” if you want that',
      'Preferred start week',
    ],
    roiTitle: 'A route lead is smaller than a remodel, and easier to lose',
    roiBody: `Recurring revenue is why the call matters, but the first month is the honest comparison. ${exampleSentence({ missedPerWeek: 7, oneIn: 3, jobValue: 160, jobLabel: 'first month of mowing' })} If you want to include a season of visits, multiply your own monthly price in the calculator. Do not assume every missed call was on your route.`,
    faqs: [
      {
        q: 'Can Executive Receptionist tell people the price of a cut?',
        a: 'Only with a sentence you approve, such as “mowing is quoted from the address.” Guessing a price from a vague description is a good way to create a bad job.',
      },
      {
        q: 'What about customers who already have an account?',
        a: 'You can tell Executive Receptionist to mark “existing customer” and email you the request instead of treating it as a new lead.',
      },
      {
        q: 'Does this include landscaping installs?',
        a: 'You can add those questions. If installs are a different crew, point her at a different callback note than the mowing route.',
      },
    ],
    related: ['ai-answering-service-for-landscapers', 'ai-answering-service-for-pest-control', 'missed-call-cost-calculator'],
  }),
  trade({
    slug: 'ai-answering-service-for-pest-control',
    navLabel: 'Pest control',
    blurb: 'What they saw, where, and whether kids or pets are in the house.',
    title: 'AI Answering Service for Pest Control',
    metaTitle: 'AI Receptionist & Answering Service for Pest Control',
    description:
      'AI Receptionist answers pest-control calls and emails you the lead. She does not recommend pesticides. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for pest control',
    h1: 'Get the “there are wasps in the wall” call while you are under another house.',
    audience: 'pest control companies',
    lede:
      'People call pest control when something is in the kitchen or the eaves, and they want a person today. Executive Receptionist asks what they saw, which room, and whether children or pets live there, then emails you. She does not name a chemical or promise an extermination.',
    pain:
      'Technicians are in crawlspaces with poor reception. The office phone, if it exists, is often unanswered during routes. A wildlife or stinging-insect call that waits until evening has usually called a second company.',
    calls: [
      'Ants, roaches, and rodents inside',
      'Wasps, hornets, and nests on the eaves',
      'Termite inspection requests',
      'Recurring service and quarterly plans',
      'Wildlife questions you either take or refer',
    ],
    qualification: [
      'Name and callback number',
      'Address',
      'What they saw, and inside or outside',
      'Pets or children in the home — yes or no, not a treatment plan',
      'One-time visit or ongoing service',
    ],
    roiTitle: 'A same-day pest call is perishable',
    roiBody: `Quarterly contracts and one-time wasp jobs should be entered separately. ${exampleSentence({ missedPerWeek: 6, oneIn: 3, jobValue: 189, jobLabel: 'pest visit' })} The $189 figure is an example input, not a published industry price.`,
    faqs: [
      {
        q: 'Can Executive Receptionist recommend a product?',
        a: 'No. She should not tell callers which pesticide to buy or how to apply one. Your technician does that on site, under your license.',
      },
      {
        q: 'What about wildlife trapping?',
        a: 'If you do not offer it, give Executive Receptionist the sentence you want, such as the name of a referral or “we don’t trap wildlife.”',
      },
      {
        q: 'Can she sell a quarterly plan on the call?',
        a: 'She can describe a plan only with the words you approve, then email you the lead. Closing the agreement stays with you.',
      },
    ],
    related: ['ai-answering-service-for-lawn-care', 'ai-answering-service-for-cleaning', 'ai-receptionist-for-small-business'],
  }),
  trade({
    slug: 'ai-answering-service-for-cleaning',
    navLabel: 'Cleaning',
    blurb: 'Recurring house cleaning, move-outs, and the details a quote actually needs.',
    title: 'AI Answering Service for Cleaning Companies',
    metaTitle: 'AI Receptionist & Answering Service for Cleaning Companies',
    description:
      'AI Receptionist answers cleaning-company calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for cleaning companies',
    h1: 'Book the walkthrough conversation while your team is in someone else’s house.',
    audience: 'residential and commercial cleaning companies',
    lede:
      'Cleaning quotes fall apart without basics: bedrooms and bathrooms, pets, and whether this is a recurring clean or a move-out. Executive Receptionist asks those questions and emails you a summary. She does not promise a price from a room count.',
    pain:
      'Owners of small cleaning companies are often on the job. The call comes in during a deep clean, goes to voicemail, and the household books a company that answered. Move-out dates do not wait.',
    calls: [
      'Recurring house cleaning',
      'First-time deep cleans',
      'Move-in and move-out cleans with a date',
      'Office or studio questions if you take them',
      'Existing clients changing a day',
    ],
    qualification: [
      'Name and phone',
      'Address or neighborhood',
      'Home size in their words (beds and baths)',
      'Recurring, one-time, or move-out — and the date if they have one',
      'Pets and any access notes they volunteer',
    ],
    roiTitle: 'Recurring cleans compound; missed first calls do not',
    roiBody: `Compare the first clean, not a fictional lifetime value. ${exampleSentence({ missedPerWeek: 5, oneIn: 3, jobValue: 180, jobLabel: 'first cleaning visit' })} If a client stays for months, that is upside on top of the example, not something Executive Receptionist can claim.`,
    faqs: [
      {
        q: 'Can Executive Receptionist say the team is background-checked or insured?',
        a: 'Only if that sentence is true and you approve the exact wording. Executive Receptionist should not invent credentials.',
      },
      {
        q: 'Will she give a per-room price?',
        a: 'Not unless you supply a published price and the conditions. Most shops do better collecting the facts and quoting themselves.',
      },
      {
        q: 'What if I only want after-hours coverage?',
        a: 'Forward the line to Executive Receptionist when you do not answer, or only outside the hours you work. You do not have to send every call.',
      },
    ],
    related: ['ai-answering-service-for-painters', 'ai-receptionist-for-small-business', 'missed-call-cost-calculator'],
  }),
  trade({
    slug: 'ai-answering-service-for-painters',
    navLabel: 'Painters',
    blurb: 'Interior rooms, exteriors, and the questions that keep a bid honest.',
    title: 'AI Answering Service for Painters',
    metaTitle: 'AI Receptionist & Answering Service for Painters',
    description:
      'AI Receptionist answers painting calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for painters',
    h1: 'Take the estimate call without climbing down.',
    audience: 'painting contractors',
    lede:
      'A painting lead without a scope is a callback that wastes the evening. Executive Receptionist asks interior or exterior, about how many rooms or which sides of the house, and whether they are painting occupied rooms.',
    pain:
      'Painters price by seeing the surface. The phone still has to be answered or the homeowner hires whoever can “come look Thursday.” Lead-safe work and repairs are easy to mishandle if an answering script starts promising methods.',
    calls: [
      'Interior room repaints',
      'Exterior repaints and peeling paint',
      'Cabinet refinishing if you offer it',
      'Color questions that still need a site visit',
      'Commercial or multi-unit work you choose to accept',
    ],
    qualification: [
      'Name and number',
      'Address',
      'Interior, exterior, or both',
      'Rough scope in the caller’s words',
      'Timing and whether anyone lives in the space',
    ],
    roiTitle: 'A painting bid starts with a visit you were invited to',
    roiBody: `${exampleSentence({ missedPerWeek: 4, oneIn: 3, jobValue: 750, jobLabel: 'painting estimate visit you would have booked' })} The visit is the example, not a closed contract. Exterior whole-house work can be worth more; put that number in yourself.`,
    faqs: [
      {
        q: 'Can Executive Receptionist discuss lead paint?',
        a: 'She should not advise on lead abatement or tell someone to sand old paint. If the home might be pre-1978, your approved line can be that you will cover that on the visit.',
      },
      {
        q: 'Can she text photos requests?',
        a: 'The lead text goes to you, not a photo thread with the homeowner, unless you handle that yourself after the call. Executive Receptionist’s handoff is the summary to your phone.',
      },
      {
        q: 'Do I need the Pro plan?',
        a: 'Most painting shops start on Starter or Growth. Pro is for higher minute volume and more call paths, not a different paint product.',
      },
    ],
    related: ['ai-answering-service-for-general-contractors', 'ai-answering-service-for-roofers', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-general-contractors',
    navLabel: 'General contractors',
    blurb: 'Remodel and repair intake that does not pretend to be a bid.',
    title: 'AI Answering Service for General Contractors',
    metaTitle: 'AI Receptionist & Answering Service for General Contractors',
    description:
      'AI Receptionist answers contractor calls and emails you the lead. She does not produce a bid on the call. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for general contractors',
    h1: 'Capture the remodel call while you are on a jobsite.',
    audience: 'general contractors and remodeling companies',
    lede:
      'GC calls are messy on purpose: a bathroom, a deck, “a few things around the house.” Executive Receptionist’s job is to learn which trade is involved, whether the home is occupied, and how to reach them — not to price the work.',
    pain:
      'You are the estimator and the superintendent. The phone rings during a walkthrough with another client. Those missed calls are often the next project, and they do not leave a clean scope on voicemail.',
    calls: [
      'Kitchen and bath remodel inquiries',
      'Additions and whole-house questions',
      'Punch-list and repair calls from past clients',
      'Subcontractor and supplier calls you may want marked differently',
      'Insurance-restoration questions you either take or decline',
    ],
    qualification: [
      'Name and callback number',
      'Project address',
      'What they want built or fixed, in their words',
      'Occupied home or vacant',
      'Any timing or budget they volunteer — never a number Executive Receptionist invents',
    ],
    roiTitle: 'Do not divide a remodel by a fake close rate',
    roiBody: `A single won remodel dwarfs the subscription. The honest first step is the conversation you missed. ${exampleSentence({ missedPerWeek: 3, oneIn: 3, jobValue: 400, jobLabel: 'site visit you would have scheduled' })} Price the visit in the example. Put the project value in the calculator only if you want to see that larger, riskier number.`,
    faqs: [
      {
        q: 'Will Executive Receptionist sound like a project manager?',
        a: 'She sounds like the greeting and questions you approve. She should not discuss allowances, change orders, or contract terms.',
      },
      {
        q: 'Can vendors be screened out?',
        a: 'You can give her a rule for sales calls, such as taking a number and marking the text as a vendor. She will not be perfect at that. Review the texts.',
      },
      {
        q: 'How is this different from a call center?',
        a: 'A call center is a staffing service with its own price sheet. Executive Receptionist is software on a published plan: four monthly plans from $79 a month (Starter’s first month is $1), with included minutes listed on the plan.',
      },
    ],
    related: ['ai-receptionist-vs-answering-service', 'ai-answering-service-for-painters', 'ai-answering-service-for-roofers'],
  }),
  trade({
    slug: 'ai-answering-service-for-dentists',
    navLabel: 'Dentists',
    blurb: 'New-patient and scheduling calls, without pretending this is a HIPAA product.',
    title: 'AI Answering Service for Dentists',
    metaTitle: 'AI Receptionist & Answering Service for Dentists',
    description:
      'AI Receptionist for dental front-desk overflow. Not a HIPAA product. Confirm what she may say before you forward the line. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for dental offices',
    h1: 'Cover the front desk when the chair is full and the phone is still ringing.',
    audience: 'dental practices and small clinics',
    lede:
      'Executive Receptionist can greet a caller, give the hours and address you approve, and take a name and number for a callback. She should not collect clinical details, insurance treatment histories, or anything you are not willing to have in a text message to the office phone.',
    pain:
      'A one-doctor office often has one person at the front. When they are walking a patient out, the new-patient call goes to the answering machine. That caller may still be in pain or may simply book the next office that picks up.',
    calls: [
      'New-patient “are you accepting patients?” calls',
      'Hours, location, and parking questions',
      'Requests to schedule, returned as a callback',
      'Existing patients asking for a call back about an appointment',
      'Billing questions you route to a person',
    ],
    qualification: [
      'Caller name and phone',
      'New patient or existing patient',
      'Which location, if you have more than one',
      'The reason in everyday words, not a diagnosis',
      'Best time for the office to call back',
    ],
    roiTitle: 'A new patient is your number to enter',
    roiBody: `We are not publishing a “value of a new dental patient.” Practices disagree, and a lot of those charts online are marketing. ${exampleSentence({ missedPerWeek: 4, oneIn: 4, jobValue: 200, jobLabel: 'new-patient visit you would have offered' })} Replace $200 with the figure you actually use.`,
    faqs: [
      {
        q: 'Is Executive Receptionist HIPAA compliant?',
        a: 'No. Do not use Executive Receptionist to collect health information, insurance member IDs, or clinical notes. If your compliance officer says the line must stay with trained staff, keep it there. This page is for offices that want a callback taken, not a chart started.',
      },
      {
        q: 'Can she book directly on the practice software?',
        a: 'No. There is no dental-software integration in this product. She texts the office the callback.',
      },
      {
        q: 'What should she say about emergencies?',
        a: 'Use your own sentence, such as where to go for urgent dental pain after hours. Do not leave that sentence to the model.',
      },
    ],
    related: ['ai-answering-service-for-law-firms', 'ai-receptionist-for-small-business', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-law-firms',
    navLabel: 'Law firms',
    blurb: 'Consult callbacks with a conflict check left to the firm.',
    title: 'AI Answering Service for Law Firms',
    metaTitle: 'AI Receptionist & Answering Service for Law Firms',
    description:
      'AI Receptionist takes a name and number for a law-firm callback. She does not give legal advice or run a conflict check. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for law firms',
    h1: 'Take the consult call when everyone is in a hearing.',
    audience: 'small law firms and solo practices',
    lede:
      'Executive Receptionist can answer, say she is an AI receptionist, and collect a name, phone number, and the kind of matter in plain language. She should not assess a case, promise confidentiality beyond what your engagement process actually provides, or decide there is no conflict.',
    pain:
      'Small firms miss calls during court, depositions, and client meetings. The person who called about a deadline may call the next firm on the search results. A careful intake still has to happen with a person. The missed call is the step before that.',
    calls: [
      'New consult requests',
      'Existing clients asking for a callback',
      'Hours and address',
      '“Do you handle this type of matter?” using only your approved list',
      'Calls that should be sent to voicemail or a person because they are sensitive',
    ],
    qualification: [
      'Name and phone',
      'New or existing client, as they describe it',
      'Matter type in a few words you allow her to record',
      'Whether there is a date they already mentioned',
      'Best time for a lawyer or intake staff to call',
    ],
    roiTitle: 'Do not invent a case value',
    roiBody: `A consult fee or a matter value belongs in your calculator, not in our marketing. ${exampleSentence({ missedPerWeek: 3, oneIn: 4, jobValue: 150, jobLabel: 'consult you would have scheduled' })} The $150 input is a placeholder consult, not a claim about fees in your jurisdiction.`,
    faqs: [
      {
        q: 'Does this create an attorney-client relationship?',
        a: 'It should not. Your greeting needs to say that a callback is not representation and that she cannot give legal advice. Have the lawyer who owns the firm approve that sentence.',
      },
      {
        q: 'Can Executive Receptionist run conflicts?',
        a: 'No. She does not see your client list. Staff still screen conflicts before anyone is engaged.',
      },
      {
        q: 'Should criminal, family, or immigration callers talk to an AI?',
        a: 'That is the firm’s decision. Many firms will want those calls transferred to a person or sent to a dedicated voicemail. You can refuse to let Executive Receptionist take them.',
      },
    ],
    related: ['ai-answering-service-for-dentists', 'ai-receptionist-for-small-business', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-garage-door',
    navLabel: 'Garage door',
    blurb: 'Stuck doors, broken springs, and opener quotes with a safety line.',
    title: 'AI Answering Service for Garage Door Companies',
    metaTitle: 'AI Receptionist for Garage Door Companies',
    description:
      'AI Receptionist answers garage-door calls and emails you the lead. She does not talk anyone through a spring repair. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for garage door companies',
    h1: 'Answer the stuck-door call while you are on another driveway.',
    audience: 'garage door repair and installation companies',
    lede:
      'A car trapped in the garage is a today call. Executive Receptionist asks whether the door is stuck open or closed, single or double, and whether a spring looks broken. She should tell callers not to touch a spring if that is your rule.',
    pain:
      'Garage door companies live on same-day repair. The technician who is already under a door cannot take the next call. The homeowner calls the next ad. Springs are dangerous enough that a sloppy script is worse than voicemail.',
    calls: [
      'Door stuck open or closed',
      'Broken spring and cable calls',
      'Opener repairs and replacements',
      'New door estimates',
      'Off-track doors',
    ],
    qualification: [
      'Name and callback number',
      'Address',
      'Stuck open, stuck closed, or noisy',
      'One car or two',
      'Whether they already tried the release — only if you want that asked, not coached',
    ],
    roiTitle: 'Same-day repair is the perishable job',
    roiBody: `${exampleSentence({ missedPerWeek: 6, oneIn: 3, jobValue: 320, jobLabel: 'garage-door service call' })} New door sales can be larger. Enter that separately if it is most of your book.`,
    faqs: [
      {
        q: 'Can Executive Receptionist walk someone through winding a spring?',
        a: 'No. The approved line should be that springs are dangerous and a technician needs to see them.',
      },
      {
        q: 'Can she quote a spring replacement?',
        a: 'Only if you publish a price that does not depend on details she cannot see. Most shops email the lead and quote after a look or a photo you request yourself.',
      },
      {
        q: 'After hours?',
        a: 'Yes. Forward nights and weekends, or only the calls you miss during the day.',
      },
    ],
    related: ['ai-answering-service-for-electricians', 'ai-answering-service-for-hvac', 'missed-call-answering-home-services'],
  }),
  trade({
    slug: 'ai-answering-service-for-tree-service',
    navLabel: 'Tree service',
    blurb: 'Storm limbs and removal estimates, with downed lines sent to the utility.',
    title: 'AI Answering Service for Tree Service',
    metaTitle: 'AI Receptionist for Tree Service Companies',
    description:
      'AI Receptionist answers tree-service calls and emails you the address. Downed power lines stay a utility call. From $79/mo.',
    eyebrow: 'AI answering service for tree service',
    h1: 'Take the storm-limb call while the chipper is already running.',
    audience: 'tree service and arborist companies',
    lede:
      'Executive Receptionist asks what happened to the tree, whether it is on a house or a car, and whether any wire is involved. If a line is down, your script should send them to emergency services and the utility — not put them in a callback queue.',
    pain:
      'Tree crews are loud and away from the phone. After a storm the calls stack up, and the profitable removals go to whoever logs the address first. A voicemail that says “big tree, call me” is not a schedule.',
    calls: [
      'Removals and hazardous trees',
      'Limbs on a roof or fence',
      'Storm cleanup',
      'Trimming and clearance estimates',
      'Stump grinding if you offer it',
    ],
    qualification: [
      'Name and phone',
      'Address',
      'On a structure, in the yard, or blocking a drive',
      'Any wire involved — yes or no',
      'Whether they need an estimate or same-week cleanup',
    ],
    roiTitle: 'Storm cleanup and a trimming bid are different jobs',
    roiBody: `${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 650, jobLabel: 'tree job you would have looked at' })} Use your own number for a removal versus a trim. The example is only the arithmetic.`,
    faqs: [
      {
        q: 'Will Executive Receptionist claim to be an arborist?',
        a: 'No. She answers the phone. Certifications and insurance wording have to be sentences you approve because they are true.',
      },
      {
        q: 'What about a tree on a power line?',
        a: 'Urgent rule: do not offer an arrival time. Tell the caller to contact the utility and emergency services and stay clear.',
      },
      {
        q: 'Can she give a removal price from “it’s a big oak”?',
        a: 'She should not. Removals are priced from the site.',
      },
    ],
    related: ['ai-answering-service-for-roofers', 'ai-answering-service-for-landscapers', 'missed-call-cost-calculator'],
  }),
  trade({
    slug: 'ai-answering-service-for-pool-companies',
    navLabel: 'Pool companies',
    blurb: 'Green pools, openings, and weekly service routes.',
    title: 'AI Answering Service for Pool Companies',
    metaTitle: 'AI Receptionist & Answering Service for Pool Companies',
    description:
      'AI Receptionist answers pool-company calls and emails you the lead. She does not prescribe chemicals. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for pool companies',
    h1: 'Answer the green-pool call while you are in someone else’s equipment pit.',
    audience: 'pool service and repair companies',
    lede:
      'Pool calls cluster when the weather turns. Executive Receptionist asks weekly service or a one-time cleanup, roughly how the water looks, and whether equipment is making noise. Chemical dosing stays off the call.',
    pain:
      'Route techs cannot stop at every ring. Opening season and the first hot week produce a burst of “our pool is green” calls. The company that logs the address gets the route add.',
    calls: [
      'Weekly cleaning routes',
      'Green pool recoveries',
      'Openings and closings',
      'Pump, heater, and leak questions',
      'Existing route customers with a skip or a repair',
    ],
    qualification: [
      'Name and phone',
      'Address',
      'In-ground or above-ground, if they know',
      'Service, repair, or opening',
      'How soon they want someone there',
    ],
    roiTitle: 'A route add is a small first ticket',
    roiBody: `${exampleSentence({ missedPerWeek: 5, oneIn: 3, jobValue: 220, jobLabel: 'first pool visit' })} Weekly service after that is your retention, not a number we can promise.`,
    faqs: [
      {
        q: 'Can Executive Receptionist tell them how much chlorine to add?',
        a: 'No. She should not give chemical instructions.',
      },
      {
        q: 'Equipment repair versus cleaning?',
        a: 'Ask her to mark the text as repair or route so the right person calls back.',
      },
      {
        q: 'Do you integrate with pool software?',
        a: 'No. The handoff is a text and email lead to the contacts you put on the setup form.',
      },
    ],
    related: ['ai-answering-service-for-lawn-care', 'ai-answering-service-for-cleaning', 'ai-receptionist-for-small-business'],
  }),
  trade({
    slug: 'ai-answering-service-for-fencing',
    navLabel: 'Fencing',
    blurb: 'Wood, vinyl, and gate estimates with the measurements left for the visit.',
    title: 'AI Answering Service for Fencing Companies',
    metaTitle: 'AI Receptionist & Answering Service for Fencing Companies',
    description:
      'AI Receptionist answers fencing calls 24/7, takes the job details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for fencing companies',
    h1: 'Log the fence estimate while the crew is setting posts.',
    audience: 'fence contractors',
    lede:
      'Fence leads want a price before they have a measurement. Executive Receptionist’s useful job is to learn wood, vinyl, or chain link, whether they need a gate, and the address — then let you measure.',
    pain:
      'Crews are in backyards with the phone in the truck. HOA callers and “can you match the neighbor” callers leave voicemails that all sound the same. The company that calls back the same day with a visit time usually wins the bid.',
    calls: [
      'New fence estimates',
      'Gate repairs',
      'Storm-damaged sections',
      'HOA and material questions',
      'Commercial or pool enclosures if you install them',
    ],
    qualification: [
      'Name and phone',
      'Address',
      'Material they asked about',
      'Replace, repair, or brand new',
      'Gate needed or not',
    ],
    roiTitle: 'The bid starts when someone picks up',
    roiBody: `${exampleSentence({ missedPerWeek: 4, oneIn: 3, jobValue: 800, jobLabel: 'fence estimate you would have measured' })} Linear-foot prices vary by material and height. Keep the example at the visit unless you enter your own average job.`,
    faqs: [
      {
        q: 'Can Executive Receptionist quote per foot?',
        a: 'Only from a price list you explicitly approve, and even then most contractors would rather measure first. Default is no price.',
      },
      {
        q: 'Will she promise an HOA approval?',
        a: 'No. She can note that they mentioned an HOA.',
      },
      {
        q: 'Utility locates?',
        a: 'She should not tell callers they can dig. Scheduling and locates stay with you.',
      },
    ],
    related: ['ai-answering-service-for-landscapers', 'ai-answering-service-for-general-contractors', 'ai-answering-service-for-pool-companies'],
  }),
  {
    slug: 'ai-receptionist-for-small-business',
    kind: 'guide',
    navLabel: 'Small business',
    blurb: 'When the owner is the receptionist and the phone rings during the work.',
    title: 'AI Receptionist for Small Business',
    metaTitle: 'AI Receptionist for Small Business, Plans from $79/mo',
    description:
      'AI Receptionist for small businesses that miss calls while the owner works. It takes a name and number, then emails you. From $79/mo.',
    eyebrow: 'AI receptionist for small business',
    h1: 'A front desk for the shop where the owner still answers the phone.',
    audience: 'small businesses whose owner or a single employee answers the phone',
    lede:
      'Executive Receptionist is for the business that does not have a person sitting at a desk from 8 to 5. She answers, asks what the caller needs, and emails the owner. A full-time receptionist is a different purchase — the federal median pay for receptionists was $37,230 a year in May 2024, before taxes and benefits.',
    pain:
      'Small shops lose calls in a boring way: they are with a customer, on a job, or closed. The caller does not know that. They know the phone rang and nobody talked to them. Hiring a person to cover nights and lunch is a payroll decision. Forwarding the missed calls to software is a smaller one, with a published monthly price.',
    calls: [
      'New customer questions during a job',
      'After-hours calls',
      'Lunch and overlap, when the only employee is busy',
      'Simple hours and location questions',
      'Existing customers who need a callback',
    ],
    qualification: [
      'Who is calling',
      'A number that reaches them',
      'What they want',
      'How soon',
      'Anything else you put on a short list',
    ],
    roiTitle: 'Compare Executive Receptionist with a person, using a real wage figure',
    roiBody: `The U.S. Bureau of Labor Statistics reported median pay for receptionists of $37,230 a year, $17.90 an hour, in May 2024. That is about $3,103 a month before employer taxes, benefits, recruiting, or coverage outside one shift. Executive Receptionist is four monthly plans from $79 a month, and does not do every task that person does — it answers and emails you the lead. ${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 250, jobLabel: 'job or appointment you would have called back' })}`,
    faqs: [
      {
        q: 'Is an AI receptionist the same as an answering service?',
        a: 'Buyers use both phrases. A traditional answering service is people in a call center. Executive Receptionist is software with a voice, on a plan you can read before you talk to sales. The comparison page spells out the differences.',
      },
      {
        q: 'What does setup cost?',
        a: '$0 setup. Plans run from $79 a month (100 minutes) to $789 a month (2,000 minutes). Starter’s first month is $1.',
      },
      {
        q: 'Can any small business use it?',
        a: 'The call has to be something you are willing to let an AI ask about. Contractors are the main fit. Dental and legal pages explain the limits. If the call needs a licensed person, do not forward it.',
      },
    ],
    related: ['ai-receptionist-vs-answering-service', 'missed-call-cost-calculator', 'ai-answering-service-for-general-contractors'],
    sources: [blsSource],
  },
  {
    slug: 'ai-receptionist-vs-answering-service',
    kind: 'comparison',
    navLabel: 'Vs answering service',
    blurb: 'Voicemail, a human answering service, and Executive Receptionist — what each one actually does.',
    title: 'AI Receptionist vs Traditional Answering Service',
    metaTitle: 'AI Receptionist vs Answering Service: Cost Comparison',
    description:
      'AI receptionist vs. a traditional answering service, by cost. Executive Receptionist: $1 the first month, then $79/mo. No invented competitor prices.',
    eyebrow: 'AI receptionist vs. traditional answering service',
    h1: 'AI receptionist vs. traditional answering service: the cost comparison',
    directAnswer:
      'Executive Receptionist is an AI receptionist with published monthly plans: Starter is $1 the first month, then $79 a month for 100 minutes; Growth is $197; Pro is $397; Elite is $789. A traditional answering service is usually a person in a call center, and the price is typically a quote after a sales call, often by the minute or by the month. An in-house receptionist is a different purchase: the U.S. Bureau of Labor Statistics reported median pay for receptionists of $37,230 a year in May 2024, or about $3,103 a month in wages alone, before taxes and benefits. Executive Receptionist answers the call and emails you the lead. We do not publish other companies’ prices here because we cannot verify them.',
    audience: 'owners comparing an answering service with an AI receptionist',
    lede:
      '“Answering service” usually means people who pick up and take a message. “AI receptionist” means software that holds the conversation you scripted. Executive Receptionist is the second one. The useful comparison is what happens to the caller and what you pay, not a slogan about replacing staff.',
    pain:
      'Human answering services often price after a sales call, by the minute or by the seat. Voicemail is cheap and loses the callers who will not leave a message. A receptionist on payroll is a different product entirely: the median pay was $37,230 a year in May 2024, and that person does work Executive Receptionist does not do.',
    calls: [
      'Calls you do not want to miss',
      'After-hours coverage',
      'Overflow while you are with someone else',
      'The same questions every day',
      'Emergencies that need a rule, not improvisation',
    ],
    qualification: [
      'Name and number',
      'What they need',
      'Where the job or appointment is',
      'How urgent it is, using your rules',
      'A lead summary you can act on',
    ],
    roiTitle: 'Put the prices next to each other without a fake percentage',
    roiBody: `Executive Receptionist’s prices are on this site: four monthly plans from $79 a month (Starter’s first month is $1), with 100, 300, 1,200, or 2,000 included minutes. Past your minutes she keeps answering and we reach out about a bigger plan, with no surprise per-minute charges. A human answering service will give you its own quote. A W-2 receptionist at the May 2024 median is about $3,103 a month in wages alone. ${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 300, jobLabel: 'callback you would have made' })} Use the calculator so the missed-call side is yours.`,
    columns: [
      {
        title: 'Voicemail',
        body: 'The caller decides whether to talk. You get whatever they remember, often without an address. Cost is whatever your phone plan already charges. Nobody asks your qualifying questions.',
      },
      {
        title: 'Human answering service',
        body: 'A person follows a script and sends a message. Quality depends on the agent and the script. Pricing is usually a quote, not a page like this one. They can be a fit if you want a human on every call and will pay for that.',
      },
      {
        title: 'Executive Receptionist',
        body: 'Software answers in the voice and questions you approve, then emails you. You can hear a sample and try a live browser demo before checkout. She will get calls wrong sometimes. You review the leads and edit the rules. She is not a licensed dispatcher, lawyer, or clinician.',
      },
    ],
    faqs: [
      {
        q: 'Is Executive Receptionist cheaper than an answering service?',
        a: 'Executive Receptionist’s price is published. Theirs may not be, until you ask. Compare the quote they send with plans from $79 a month. Do not trust a chart that says “save 80%” without showing both invoices.',
      },
      {
        q: 'Can Executive Receptionist transfer to a person?',
        a: 'You can write escalation rules for urgent calls. Live phone provisioning is still finished with Cole after checkout. The product does not buy your phone number automatically.',
      },
      {
        q: 'Which one should a contractor start with?',
        a: 'If you want to hear the call yourself tonight, play the sample and use the browser demo, then start Starter for $1. If you already have a human service you like, stay. This page is not a reason to cancel something that is working.',
      },
    ],
    related: ['ai-receptionist-for-small-business', 'missed-call-cost-calculator', 'best-ai-receptionist-for-hvac-companies'],
    sources: [blsSource],
    costRows: [
      {
        option: 'Executive Receptionist Starter',
        cost: '$1 the first month, then $79/month',
        notes: '100 minutes included. AI answers 24/7 when you forward the line and emails you the lead.',
      },
      {
        option: 'Growth',
        cost: '$197/month',
        notes: '300 minutes included. Same product, more minutes.',
      },
      {
        option: 'Pro',
        cost: '$397/month',
        notes: '1,200 minutes included. Best value per minute on the published plans.',
      },
      {
        option: 'Elite',
        cost: '$789/month',
        notes: '2,000 minutes included, with priority setup.',
      },
      {
        option: 'Traditional answering service',
        cost: 'Usually quoted after a sales call',
        notes: 'A person takes a message. Prices often run by the minute, by the month, or by the seat. We do not list a number we cannot source.',
      },
      {
        option: 'In-house receptionist',
        cost: 'BLS median $37,230/year (May 2024), about $3,103/month in wages only',
        notes: 'A person at a desk. That role covers more than answering the phone. Figure is wages only, before employer taxes and benefits.',
      },
    ],
    costNote:
      'Executive Receptionist prices are the ones published on this site. Traditional answering-service prices vary; compare the quote they send you with the plans above. The in-house figure is from the U.S. Bureau of Labor Statistics Occupational Outlook Handbook for receptionists, May 2024.',
  },
  {
    slug: 'missed-call-cost-calculator',
    kind: 'calculator',
    navLabel: 'Missed-call calculator',
    blurb: 'Your calls, your assumed close rate, your job value. The math is shown.',
    title: 'Missed Call Cost Calculator',
    metaTitle: 'AI Receptionist Missed-Call Cost Calculator',
    description:
      'Estimate missed-call value with your numbers. The calculator shows the formula. It is not a promise. From $79/mo, first month $1.',
    eyebrow: 'Missed call cost calculator',
    h1: 'What missed calls cost is the arithmetic you put in.',
    audience: 'owners who want a missed-call figure without a fake industry average',
    lede:
      'This page multiplies three numbers you control: how many calls you miss in a week, how many of those you believe you would have booked, and what that job is worth. The result is an example monthly figure. It is not Executive Receptionist’s prediction.',
    pain:
      'Most “missed call statistics” on vendor sites are unsourced or about a different industry. We are not repeating them. If you do not know your missed-call count, check the phone’s recent calls for a normal week and type what you see. If you do not know the booking rate, the default “1 in 4” is a knob, not a finding.',
    calls: [
      'Calls that rang while you were on a job',
      'After-hours rings',
      'Calls that went to voicemail and never called back',
      'Overflow when you were already on the phone',
      'The ones you would not have wanted anyway — leave those out',
    ],
    qualification: [
      'Count a week you recognize',
      'Decide the booking assumption yourself',
      'Use a job value you have actually charged',
      'Read the formula under the result',
      'Compare it with plans from $79 a month',
    ],
    roiTitle: 'How the formula works',
    roiBody:
      'Monthly example = missed calls per week × (1 ÷ “1 in N”) × job value × 52 ÷ 12. The 52 ÷ 12 step turns a week into a month. It assumes every week looks like the week you typed. It ignores seasonality, capacity, and the calls you would have turned down. Executive Receptionist is four monthly plans from $79 a month. The calculator does not subtract that for you, so you can see both numbers.',
    faqs: [
      {
        q: 'Why is there no official missed-call percentage?',
        a: 'Because we do not have a defensible one for plumbers, roofers, or dentists. A percentage from an answering-service ad is not a source. Your call log is.',
      },
      {
        q: 'Does a bigger result mean Executive Receptionist will make that money?',
        a: 'No. It means that is what your assumptions are worth if they are true. Some of those callers would have been price shopping, tire kickers, or outside your area.',
      },
      {
        q: 'What should I do with the number?',
        a: 'If it is large next to a $79 monthly plan, hear the sample call and start Starter for $1. If it is tiny, you may not need this. The calculator is allowed to talk you out of it.',
      },
    ],
    related: ['ai-receptionist-vs-answering-service', 'missed-call-answering-home-services', 'ai-answering-service-for-plumbers'],
  },
  {
    slug: 'missed-call-answering-home-services',
    kind: 'guide',
    navLabel: 'Missed calls',
    blurb: 'Overflow and after-hours coverage without sending every call to Executive Receptionist.',
    title: 'Missed-Call Answering for Home Services',
    metaTitle: 'AI Receptionist for Missed Home-Service Calls',
    description:
      'Use an AI Receptionist on calls you do not answer: after hours, overflow, and weekends. She emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'Missed-call answering for home services',
    h1: 'You do not have to give Executive Receptionist every call. Give her the ones you miss.',
    audience: 'home-service businesses that already answer some of the time',
    lede:
      'Call forwarding can send Executive Receptionist only the rings you do not pick up. You keep talking to the customers you answer. She talks to the rest, including the 7 p.m. call from someone who searched “near me” and is ready to hire a person tonight.',
    pain:
      'Home-service leads are local and impatient. Google and Purchased’s May 2016 smartphone diary found that 76% of people who searched for something nearby visited a business within a day. That study is about nearby search in general, not your close rate. It is still a reason the unanswered call matters: the person was already trying to choose someone close.',
    calls: [
      'Rings while you are on another call',
      'After-hours and weekends',
      'Lunch and school pickup',
      'The second line you never staff',
      'Seasonal spikes',
    ],
    qualification: [
      'Name and number',
      'Address or neighborhood',
      'The job in their words',
      'Urgency using your rules',
      'An email that arrives while you are still on the first job',
    ],
    roiTitle: 'Count only the calls you actually miss',
    roiBody: `Do not put your entire call volume into the calculator. ${exampleSentence({ missedPerWeek: 8, oneIn: 4, jobValue: 275, jobLabel: 'home-service job' })} Eight misses is an example week, not a benchmark.`,
    faqs: [
      {
        q: 'Can I answer the phone myself and still use Executive Receptionist?',
        a: 'Yes. That is the usual setup: forward on no-answer, or forward the schedule you are closed.',
      },
      {
        q: 'What does the caller hear?',
        a: 'Your greeting, including that Executive Receptionist is an AI receptionist. You approve the words during setup.',
      },
      {
        q: 'Where do the leads go?',
        a: 'To the phone and email you enter on the setup form after checkout. You can lock those destinations after the first save.',
      },
    ],
    related: ['missed-call-cost-calculator', 'ai-answering-service-for-hvac', 'ai-receptionist-for-small-business'],
    sources: [nearbySource],
  },
  {
    slug: 'best-ai-receptionist-for-hvac-companies',
    kind: 'guide',
    navLabel: 'HVAC buyer checklist',
    blurb: 'Five tests to run on any AI receptionist before an HVAC shop buys one.',
    title: 'How to Choose an AI Receptionist for an HVAC Company',
    metaTitle: 'Choosing an AI Receptionist for HVAC: 5 Tests',
    description:
      'What to look for in an AI receptionist for HVAC companies. Executive Receptionist: $1 the first month, then $79/mo. Demo: (256) 952-4935.',
    eyebrow: 'Buyer checklist for HVAC companies',
    h1: 'How to choose an AI receptionist for an HVAC company',
    directAnswer:
      'The useful test is not a “best of” badge. It is whether the receptionist can answer a no-heat or no-cool call, take the job details, and get that lead to you without inventing a price or an arrival time. Executive Receptionist (Ava) does that for HVAC shops: she answers forwarded calls 24/7, asks the questions you approve, and emails you the lead. Plans are Starter $79 a month (first month $1, 100 minutes), Growth $197, Pro $397, and Elite $789. Call the demo line at (256) 952-4935; she answers as Porchlight Heating & Air, a made-up HVAC company. Ava’s main HVAC page, with sample calls and plans, is executivereceptionist.com/hvac.',
    audience: 'HVAC contractors comparing AI receptionist options',
    lede:
      'HVAC phones spike in heat waves and cold snaps, often while every tech is already on a roof or in a crawlspace. A receptionist that only takes a name is not enough. You need the address, what the system is doing, and whether anyone in the house is medically vulnerable — then an email you can act on.',
    pain:
      'Most “best AI receptionist” lists do not say how the product handles a no-heat call, what it costs after the first month, or whether you can hear it before you buy. This page sticks to those checks, and to Executive Receptionist’s published plans. It does not invent reviews, customer counts, or competitor prices.',
    calls: [
      'No cooling and no heat, including after hours',
      'Strange noises, short cycling, and thermostat complaints',
      'Maintenance and tune-up requests',
      'Replacement and “how much is a new system” questions',
      'Urgent wording you define, such as no heat with a medically vulnerable person at home',
    ],
    qualification: [
      'Name and callback number',
      'Service address',
      'Heat, cooling, or indoor air problem',
      'Whether the system is running at all',
      'Repair, maintenance, or replacement intent',
    ],
    roiTitle: 'Compare the published price with a missed HVAC call, using your numbers',
    roiBody: `Starter is $1 the first month, then $79 a month. ${exampleSentence({ missedPerWeek: 8, oneIn: 4, jobValue: 350, jobLabel: 'HVAC service call' })} If your real ticket is a system replacement, put that higher number in the calculator instead of treating $350 as typical.`,
    faqs: [
      {
        q: 'What should an HVAC company look for in an AI receptionist?',
        a: 'A greeting that says it is an AI receptionist, questions you approve for no-heat and no-cool calls, a lead sent to you by email, a way to hear the product before you pay, and a published price. Booking is optional and only uses hours you set up. It should not invent a price or promise an arrival time.',
      },
      {
        q: 'How much does Executive Receptionist cost for an HVAC shop?',
        a: 'Four monthly plans: Starter $79 (100 minutes, first month $1), Growth $197 (300 minutes), Pro $397 (1,200 minutes), Elite $789 (2,000 minutes). Month to month, cancel anytime. There is no free plan. If you run past your minutes, Ava keeps answering and we reach out about a bigger plan.',
      },
      {
        q: 'Can I hear it before I buy?',
        a: 'Yes. Call (256) 952-4935, where Ava answers as Porchlight Heating & Air, a made-up HVAC shop. You can also play a prerecorded sample on this site or talk to her in the browser. None of those need a credit card.',
      },
      {
        q: 'Does she text me the lead?',
        a: 'She emails you the lead. Text alerts are not on yet: they turn on only after phone-carrier registration is approved. Until then every lead arrives by email.',
      },
      {
        q: 'Is this a replacement for ServiceTitan or Housecall Pro?',
        a: 'No. Executive Receptionist is the call layer. Your field software stays where jobs are scheduled and invoiced.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-receptionist-vs-answering-service'],
  },
  {
    slug: 'ai-receptionist-for-hvac-and-plumbing-in-alabama',
    kind: 'guide',
    navLabel: 'Alabama HVAC & plumbing',
    blurb: 'An AI receptionist for HVAC and plumbing shops in Gadsden, Birmingham, Huntsville, Cullman, and Decatur.',
    title: 'AI Receptionist for HVAC and Plumbing in Alabama',
    metaTitle: 'Alabama HVAC & Plumbing Shops: AI Receptionist',
    description:
      'Statewide guide for Alabama HVAC and plumbing shops in Gadsden, Birmingham, Huntsville, Cullman, and Decatur. Starter is $1, then $79/mo.',
    eyebrow: 'AI receptionist for HVAC and plumbing in Alabama',
    h1: 'AI receptionist for HVAC and plumbing in Alabama',
    directAnswer:
      'Executive Receptionist is an AI phone receptionist run by Cole Collins in Hanceville, Alabama. HVAC and plumbing shops in Gadsden, Birmingham, Huntsville, Cullman, Decatur, and the rest of the state can forward missed and after-hours calls to her. She takes the name, callback number, address, and what’s wrong, and emails you the lead. Plans are Starter $79 a month (first month $1, 100 minutes), Growth $197, Pro $397, and Elite $789. Call the demo line at (256) 952-4935; it is an Alabama number, and she answers as a made-up HVAC shop.',
    audience: 'Alabama HVAC and plumbing shop owners',
    lede:
      'The setup is the same in every city: you keep your business number and forward the calls you cannot pick up. Cole is based in Hanceville, near Cullman and Gadsden, and works with shops across Alabama. This page does not claim a list of current customers in each city.',
    pain:
      'A no-heat call in Huntsville and a leak in Birmingham do not wait on voicemail. Owner-operators on a job, or a two-truck shop after hours, lose the same kind of call in every Alabama metro. An AI receptionist is one way to pick up those overflow and after-hours calls without hiring a night desk.',
    calls: [
      'No-heat and no-cool calls after hours',
      'Active leaks and water-heater failures',
      'Maintenance and tune-up requests',
      'Overflow while every tech is already out',
      'Callback-only questions you would rather not miss',
    ],
    qualification: [
      'Name and a direct callback number',
      'Service address in the city you cover',
      'What the system or pipe is doing',
      'Whether anyone is home, and how urgent it is',
      'An email lead you can return from the truck',
    ],
    roiTitle: 'Price the missed Alabama call with your own ticket',
    roiBody: `The plans are the same statewide. ${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 350, jobLabel: 'HVAC or plumbing job' })} Put your real average ticket in the calculator. The $350 figure is an example, not an Alabama market average.`,
    faqs: [
      {
        q: 'Do you serve HVAC and plumbing shops in Gadsden, Birmingham, Huntsville, Cullman, and Decatur?',
        a: 'Yes. Any shop in those cities, or elsewhere in Alabama, can use Executive Receptionist. You keep your existing number and forward missed or after-hours calls. The operator is Cole Collins in Hanceville, Alabama.',
      },
      {
        q: 'What does it cost in Alabama?',
        a: 'The same published plans as the rest of the country: Starter $79 a month (100 minutes, first month $1), Growth $197, Pro $397, Elite $789. Month to month, cancel anytime. There is no separate Alabama rate.',
      },
      {
        q: 'Is the demo line a local number?',
        a: 'The demo line is (256) 952-4935, an Alabama number. Ava answers as Porchlight Heating & Air, a made-up HVAC company, so you can try a no-heat or leak call without using a real customer.',
      },
      {
        q: 'Will she text me the lead?',
        a: 'She emails you the lead. Text alerts are not on yet: they turn on only after phone-carrier registration is approved.',
      },
      {
        q: 'Can she book a visit on the call?',
        a: 'Once your hours are set up in your Desk, she can offer open times and put the visit on your Desk calendar. Until then she captures the lead and emails it to you. She never invents a price or promises an arrival time you have not offered.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'ai-answering-service-for-plumbers', 'best-ai-receptionist-for-hvac-companies', 'ai-answering-service-cullman-al', 'ai-answering-service-huntsville-al', 'ai-answering-service-gadsden-al', 'ai-answering-service-birmingham-al'],
    areaServed: ['Gadsden', 'Birmingham', 'Huntsville', 'Cullman', 'Decatur', 'Hanceville', 'Alabama', 'United States'],
    cityNotes: [
      {
        city: 'Gadsden',
        body: 'Gadsden and Etowah County shops can forward overflow and after-hours calls to Executive Receptionist. Cole is based nearby in Hanceville. The product, plans, and demo line are the same as the rest of the state.',
      },
      {
        city: 'Birmingham',
        body: 'Birmingham-area HVAC and plumbing shops often see after-hours and lunch-hour overflow. Forwarding those calls is the same setup used elsewhere in Alabama. We do not claim a Birmingham office or a published list of local customers.',
      },
      {
        city: 'Huntsville',
        body: 'Shops covering Huntsville and Madison County can use the same AI receptionist for no-heat, no-cool, and leak calls. Pricing does not change by metro. Hear the demo on (256) 952-4935 before you buy.',
      },
      {
        city: 'Cullman',
        body: 'Cullman is close to the operator’s Hanceville address. HVAC and plumbing shops here use the same four monthly plans, from $1 the first month on Starter, then $79 a month.',
      },
      {
        city: 'Decatur',
        body: 'Decatur and Morgan County shops can forward missed and after-hours HVAC or plumbing calls. The lead arrives by email. There is no separate Decatur plan or setup fee.',
      },
    ],
  },
  {
    slug: 'after-hours-answering-service',
    kind: 'guide',
    navLabel: 'After-hours answering',
    blurb: 'Nights, weekends and holidays answered, with the lead in your email by morning.',
    title: 'After-Hours Answering Service for Small Businesses',
    metaTitle: 'After-Hours AI Receptionist & Answering Service',
    description:
      'An AI after-hours answering service: Ava answers nights, weekends and holidays, takes the details, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'After-hours answering service',
    h1: 'After-hours answering service that picks up every time',
    directAnswer:
      'Executive Receptionist (Ava) answers the calls you forward after you close: nights, weekends and holidays. She says she is an AI receptionist, takes the name, callback number, address and what the caller needs, flags the urgent ones at the top of the summary, and emails you the lead. Plans are Starter $79 a month (first month $1, 100 minutes), Growth $197, Pro $397 and Elite $789. Hear her at (256) 952-4935.',
    audience: 'small businesses that close before their callers do',
    lede:
      'Forward your line when you lock up. Ava answers, asks the questions you approved, and the lead is in your inbox before you open in the morning.',
    pain:
      'Most after-hours calls land in a voicemail box, and many urgent callers hang up and try the next number. A staffed night service bills by the minute. Ava is a flat monthly plan.',
    calls: [
      'Evening and weekend calls after the office closes',
      'Holiday calls when nobody is on the phones',
      'Urgent problems you define, flagged at the top of the summary',
      'New customers asking for a quote or a visit',
      'Existing customers who just need a callback',
    ],
    qualification: [
      'Name and callback number',
      'Address or service area',
      'What they need, in their own words',
      'Whether it is urgent under your rules',
      'Best time to call them back',
    ],
    roiTitle: 'What an unanswered evening call is worth, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 300, jobLabel: 'job' })} Put your own numbers in the calculator.`,
    faqs: [
      {
        q: 'Can I forward only after-hours calls?',
        a: 'Yes. You choose what to forward: every call, only the ones you miss, or only after hours. Your carrier’s forwarding settings control it; see the call forwarding codes tool for Verizon and T-Mobile.',
      },
      {
        q: 'Does Ava call or text me for urgent calls at night?',
        a: 'Ava flags urgent calls at the top of the emailed summary. Text alerts are not on yet; they turn on only after phone-carrier registration is approved.',
      },
      {
        q: 'What does it cost?',
        a: 'Starter $79 a month (100 minutes, first month $1), Growth $197 (300), Pro $397 (1,200), Elite $789 (2,000). No per-minute overage.',
      },
    ],
    related: ['missed-call-answering-home-services', 'ai-receptionist-vs-answering-service', 'missed-call-cost-calculator'],
  },
  {
    slug: 'spanish-answering-service',
    kind: 'guide',
    navLabel: 'Spanish answering',
    blurb: 'Ava switches to Spanish when the caller does, then emails you the lead.',
    title: 'Bilingual Answering Service: English and Spanish',
    metaTitle: 'Spanish & English AI Receptionist for Small Business',
    description:
      'A bilingual AI answering service: Ava answers in English and switches to Spanish when the caller does, then emails you the lead. From $79/mo.',
    eyebrow: 'Bilingual answering service',
    h1: 'An answering service that switches to Spanish when your caller does',
    directAnswer:
      'Executive Receptionist (Ava) answers in English and switches to Spanish when a caller starts in Spanish, then keeps going: name, callback number, address and what they need. She emails you the summary. Spanish is included on every plan: Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. Try it on the demo line, (256) 952-4935, by speaking Spanish.',
    audience: 'shops with Spanish-speaking customers',
    lede:
      'A caller who opens with “¿Hablan español?” gets an answer in Spanish, not a voicemail. You get the lead in your email.',
    pain:
      'Many staffed answering services charge extra for a bilingual line. Missing a Spanish-speaking caller is the same lost job as missing anyone else.',
    calls: [
      'Callers who start in Spanish',
      'Service requests and quotes in either language',
      'After-hours calls from Spanish-speaking customers',
      'Property managers and tenants calling about repairs',
      'Callbacks and scheduling questions',
    ],
    qualification: [
      'Name and callback number',
      'Address',
      'What they need',
      'Preferred language for the callback',
      'How soon they need you',
    ],
    roiTitle: 'Price a missed Spanish-speaking caller, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 3, oneIn: 3, jobValue: 300, jobLabel: 'job' })} Your numbers will differ; the calculator uses yours.`,
    faqs: [
      {
        q: 'Is Spanish an add-on?',
        a: 'No. Ava switches to Spanish on every plan at no extra cost.',
      },
      {
        q: 'What language is the summary in?',
        a: 'The emailed summary is written for you, the owner. Ask Cole during setup if you want something different.',
      },
    ],
    related: ['after-hours-answering-service', 'ai-receptionist-for-small-business', 'ai-receptionist-vs-answering-service'],
  },
  {
    slug: 'emergency-call-answering',
    kind: 'guide',
    navLabel: 'Emergency calls',
    blurb: 'Urgent rules you write, flagged at the top of every summary.',
    title: 'Emergency Call Answering for Contractors',
    metaTitle: 'Emergency Call AI Receptionist for Contractors',
    description:
      'Ava answers emergency calls for contractors 24/7, follows the urgent rules you write, and flags those calls at the top of the emailed summary.',
    eyebrow: 'Emergency call answering',
    h1: 'Emergency call answering that follows your rules',
    directAnswer:
      'You write what counts as urgent: no heat with a baby at home, water still running, a tree on the roof. Executive Receptionist (Ava) asks about it on every call and flags those calls at the top of the summary she emails you. She does not dispatch a truck or promise an arrival time. For a gas smell or danger, she tells the caller to call 911 or the gas company. Plans from $79 a month (Starter first month $1). Demo: (256) 952-4935.',
    audience: 'contractors who take emergency calls',
    lede:
      'Emergency calls come at the worst time. Ava gets the address and the problem while the caller is still on the line, and you decide who calls back.',
    pain:
      'An emergency caller who reaches voicemail calls the next shop. A message that just says “call me back” doesn’t tell you whether to get out of bed.',
    calls: [
      'No heat or no cooling with someone at risk',
      'Water that won’t stop',
      'Storm damage and active roof leaks',
      'Power out to part of the house',
      'Garage doors stuck open at night',
    ],
    qualification: [
      'Name and callback number',
      'Service address',
      'What is happening right now',
      'Whether it meets your urgent rules',
      'Whether anyone is in danger',
    ],
    roiTitle: 'What one emergency job is worth, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 2, oneIn: 2, jobValue: 600, jobLabel: 'emergency job' })} Your own ticket goes in the calculator.`,
    faqs: [
      {
        q: 'Will Ava send a tech out?',
        a: 'No. She takes the details, flags urgent calls at the top of the emailed summary, and you or your on-call tech decide. She never promises an arrival time.',
      },
      {
        q: 'What happens with a gas smell?',
        a: 'You set the safety line. A typical setup tells the caller to leave the house and call the gas company or 911 first.',
      },
    ],
    related: ['after-hours-answering-service', 'ai-answering-service-for-plumbers', 'ai-answering-service-for-roofers'],
  },
  trade({
    slug: 'ai-answering-service-for-septic',
    navLabel: 'Septic',
    blurb: 'Backups, alarms and pump-out requests, captured while the truck is out.',
    title: 'AI Answering Service for Septic Companies',
    metaTitle: 'AI Receptionist & Answering Service for Septic',
    description:
      'An AI answering service for septic companies: Ava answers 24/7, takes the job details, and emails you the lead. Starter is $1 the first month, then $79/mo.',
    eyebrow: 'AI answering service for septic companies',
    h1: 'AI answering service for septic companies',
    directAnswer:
      'Executive Receptionist (Ava) answers the calls you forward for your septic business: backups, alarms, pump-outs and inspections. She takes the name, callback number, address and what is happening, and emails you the lead. Plans are Starter $79 a month (first month $1, 100 minutes), Growth $197, Pro $397 and Elite $789. Demo line: (256) 952-4935.',
    audience: 'septic pumping and repair companies',
    lede: 'A backup into the house is a call that won’t wait. Ava picks up while you are on a pump job and gets the details you need to call back.',
    pain: 'Septic work is mostly in the field. When the phone rings during a pump-out, it goes to voicemail, and a homeowner with a backup calls the next company.',
    calls: [
      'Sewage backing up into the house',
      'Tank alarms going off',
      'Routine pump-out scheduling',
      'Real-estate inspections',
      'Drain field and repair questions',
    ],
    qualification: [
      'Name and callback number',
      'Property address and county',
      'Whether sewage is backing up inside',
      'When the tank was last pumped, if they know',
      'Whether it is for a home sale inspection',
    ],
    roiTitle: 'What a missed septic call is worth, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 4, oneIn: 3, jobValue: 450, jobLabel: 'septic job' })} Use your own ticket in the calculator.`,
    faqs: [
      {
        q: 'Can Ava tell a backup from a routine pump-out?',
        a: 'Yes, with the urgent rules you write. A backup inside the house can be flagged at the top of the summary.',
      },
      {
        q: 'Will she quote a pump-out price?',
        a: 'Only a price you give her to say. Otherwise she takes the details for your callback.',
      },
      {
        q: 'How much does it cost?',
        a: 'Starter $79 a month (100 minutes, first month $1), Growth $197 (300), Pro $397 (1,200), Elite $789 (2,000). Month to month.',
      },
    ],
    related: ['ai-answering-service-for-plumbers', 'emergency-call-answering', 'missed-call-cost-calculator'],
  }),
  trade({
    slug: 'ai-answering-service-for-water-damage-restoration',
    navLabel: 'Water damage restoration',
    blurb: 'Flooded rooms and burst pipes, taken at 2 AM with the address and the source.',
    title: 'AI Answering Service for Water Damage Restoration',
    metaTitle: 'AI Receptionist for Water Damage Restoration',
    description:
      'An AI answering service for water damage restoration companies: Ava answers 24/7, takes the loss details, and emails you the lead. From $79/mo.',
    eyebrow: 'AI answering service for restoration companies',
    h1: 'AI answering service for water damage restoration',
    directAnswer:
      'Executive Receptionist (Ava) answers restoration calls you forward, day or night. She asks where the water is coming from, whether it is stopped, the address and the callback number, and emails you the lead with urgent calls flagged first. Plans are Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. Demo line: (256) 952-4935.',
    audience: 'water damage restoration companies',
    lede: 'A flooded basement call comes in at 2 AM. Ava answers, gets the source and the address, and you decide who rolls.',
    pain: 'Restoration jobs go to the company that answers first. Voicemail at night means the job goes to someone else.',
    calls: [
      'Burst pipes and flooded rooms',
      'Water heater and appliance leaks',
      'Storm and roof-leak water damage',
      'Sewage cleanup requests',
      'Insurance-claim callbacks',
    ],
    qualification: [
      'Name and callback number',
      'Property address',
      'Source of the water and whether it is stopped',
      'Rooms affected',
      'Whether an insurance claim is open',
    ],
    roiTitle: 'What one missed restoration call is worth, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 2, oneIn: 3, jobValue: 2500, jobLabel: 'restoration job' })} Put in your own average job.`,
    faqs: [
      {
        q: 'Does Ava give insurance advice?',
        a: 'No. She asks whether a claim is open so your team has it on the callback.',
      },
      {
        q: 'How much does it cost?',
        a: 'Starter $79 a month (100 minutes, first month $1), Growth $197 (300), Pro $397 (1,200), Elite $789 (2,000).',
      },
    ],
    related: ['emergency-call-answering', 'ai-answering-service-for-plumbers', 'after-hours-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-locksmiths',
    navLabel: 'Locksmiths',
    blurb: 'Lockouts and rekey requests, answered while you’re on a job.',
    title: 'AI Answering Service for Locksmiths',
    metaTitle: 'AI Receptionist & Answering Service for Locksmiths',
    description:
      'An AI answering service for locksmiths: Ava answers 24/7, takes the lockout details and location, and emails you the lead. From $79/mo, first month $1.',
    eyebrow: 'AI answering service for locksmiths',
    h1: 'AI answering service for locksmiths',
    directAnswer:
      'Executive Receptionist (Ava) answers locksmith calls you forward: lockouts, rekeys, lock changes and car keys. She takes the name, callback number, location and what is needed, and emails you the lead. Plans are Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. Demo line: (256) 952-4935.',
    audience: 'locksmiths and lock-and-key shops',
    lede: 'A locked-out caller calls until somebody answers. Ava answers and gets the location so you can call back fast.',
    pain: 'Locksmiths work alone in the field a lot. Every call missed during a job is a lockout that goes to the next listing.',
    calls: [
      'House and car lockouts',
      'Rekeys after a move-in',
      'Lock changes and new hardware',
      'Commercial lock and access requests',
      'Car key and fob questions',
    ],
    qualification: [
      'Name and callback number',
      'Exact location',
      'Home, car or business',
      'What is needed',
      'How soon',
    ],
    roiTitle: 'What a missed lockout call is worth, as an example',
    roiBody: `${exampleSentence({ missedPerWeek: 6, oneIn: 3, jobValue: 150, jobLabel: 'locksmith job' })} Use your own numbers in the calculator.`,
    faqs: [
      {
        q: 'Will Ava quote a lockout price?',
        a: 'Only a price you approve. Otherwise she takes the details for your callback.',
      },
      {
        q: 'How much does it cost?',
        a: 'Starter $79 a month (100 minutes, first month $1), Growth $197 (300), Pro $397 (1,200), Elite $789 (2,000).',
      },
    ],
    related: ['ai-answering-service-for-garage-door', 'after-hours-answering-service', 'missed-call-cost-calculator'],
  }),
  {
    slug: 'ai-answering-service-gadsden-al',
    kind: 'guide',
    navLabel: 'Gadsden, AL',
    blurb: 'An AI receptionist for Gadsden and Etowah County shops.',
    title: 'AI Answering Service in Gadsden, AL',
    metaTitle: 'AI Receptionist & Answering Service in Gadsden, AL',
    description:
      'An AI answering service for Gadsden and Etowah County shops. Forward missed and after-hours calls; Ava emails you the lead. Starter $1, then $79/mo.',
    eyebrow: 'Gadsden, Alabama',
    h1: 'AI answering service for Gadsden shops',
    directAnswer:
      'Executive Receptionist is run by Cole Collins in Hanceville, Alabama, about an hour from Gadsden. Shops in Gadsden, Rainbow City, Attalla, Southside and the rest of Etowah County keep their number and forward missed or after-hours calls to Ava. She takes the details and emails you the lead. Plans are the same statewide: Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. The demo line, (256) 952-4935, is a 256 number.',
    audience: 'Gadsden and Etowah County shops',
    lede: 'Same setup as anywhere: keep your number, forward the calls you can’t take, and get every lead by email. Setup is done over the phone and email.',
    pain: 'Small Gadsden shops are often one or two trucks with the owner answering the phone. When everyone is on a job, calls go to voicemail.',
    calls: [
      'No-heat and no-cool calls in Etowah County',
      'Plumbing leaks and backups',
      'Roofing and storm calls',
      'After-hours and weekend calls',
      'Overflow while the owner is on a job',
    ],
    qualification: ['Name and callback number', 'Address and town', 'What they need', 'How urgent it is', 'Best callback time'],
    roiTitle: 'Price a missed Gadsden call with your own numbers',
    roiBody: `${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 350, jobLabel: 'job' })} The $350 is an example, not a Gadsden average.`,
    faqs: [
      {
        q: 'Do you have an office in Gadsden?',
        a: 'No. Executive Receptionist is run by Cole Collins from Hanceville, Alabama. Setup is done by phone and email.',
      },
      {
        q: 'Is there a local rate?',
        a: 'No. The same four plans apply statewide: Starter $79 (first month $1), Growth $197, Pro $397, Elite $789.',
      },
      {
        q: 'Which Gadsden trades is it set up for?',
        a: 'HVAC, plumbing, roofing, electrical, and other home-service shops. Cole writes the greeting and intake questions for your trade, such as no-heat versus no-cool, an active leak, storm damage, or a breaker that keeps tripping. Ava takes the details and emails you the lead.',
      },
      {
        q: 'Can I hear it before I pay?',
        a: 'Yes. Call (256) 952-4935 and Ava answers as a made-up HVAC company, or talk to her in your browser on the demo page. Nothing books a real truck.',
      },
    ],
    related: ['ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-answering-service-birmingham-al', 'ai-answering-service-cullman-al', 'after-hours-answering-service'],
    areaServed: ['Gadsden', 'Rainbow City', 'Attalla', 'Southside', 'Alabama', 'United States'],
  },
  {
    slug: 'ai-answering-service-birmingham-al',
    kind: 'guide',
    navLabel: 'Birmingham, AL',
    blurb: 'An AI receptionist for Birmingham-area home-service shops.',
    title: 'AI Answering Service in Birmingham, AL',
    metaTitle: 'AI Receptionist & Answering Service, Birmingham AL',
    description:
      'An AI answering service for Birmingham-area home-service shops. Forward missed and after-hours calls; Ava emails you the lead. Starter $1, then $79/mo.',
    eyebrow: 'Birmingham, Alabama',
    h1: 'AI answering service for Birmingham shops',
    directAnswer:
      'Executive Receptionist is run by Cole Collins in Hanceville, Alabama, north of Birmingham. Shops in Birmingham, Hoover, Vestavia Hills, Trussville and the rest of the metro keep their number and forward missed or after-hours calls to Ava. She takes the details and emails you the lead. Plans are the same statewide: Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. Demo line: (256) 952-4935.',
    audience: 'Birmingham-area home-service shops',
    lede: 'Keep your 205 number, forward what you can’t take, and get every lead by email. Setup is done over the phone and email.',
    pain: 'Birmingham shops juggle lunch-hour overflow, drive time across the metro and after-hours calls. Each unanswered call can go to the next listing.',
    calls: [
      'HVAC calls in summer heat and winter cold snaps',
      'Plumbing leaks and backups',
      'Electrical and panel questions',
      'After-hours and weekend calls',
      'Overflow while every tech is out',
    ],
    qualification: ['Name and callback number', 'Address and part of town', 'What they need', 'How urgent it is', 'Best callback time'],
    roiTitle: 'Price a missed Birmingham call with your own numbers',
    roiBody: `${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 350, jobLabel: 'job' })} The $350 is an example, not a Birmingham average.`,
    faqs: [
      {
        q: 'Do you have a Birmingham office?',
        a: 'No. Executive Receptionist is run by Cole Collins from Hanceville, Alabama. Setup is done by phone and email.',
      },
      {
        q: 'Can I keep my 205 number?',
        a: 'Yes. You forward calls from your existing number to Ava. Your number and carrier stay the same.',
      },
      {
        q: 'Which Birmingham trades is it set up for?',
        a: 'HVAC, plumbing, electrical, roofing, and other home-service shops across the metro. The greeting and questions are written for your trade, and every call is emailed to you as a lead. Starter is $79 a month with the first month $1.',
      },
      {
        q: 'Does Ava tell Birmingham callers she is AI?',
        a: 'Yes. Her greeting says she is an AI receptionist for your business. She does not pretend to be a person and does not quote prices you have not approved.',
      },
    ],
    related: ['ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-answering-service-gadsden-al', 'ai-answering-service-huntsville-al', 'after-hours-answering-service'],
    areaServed: ['Birmingham', 'Hoover', 'Vestavia Hills', 'Trussville', 'Alabama', 'United States'],
  },
  {
    slug: 'ai-answering-service-cullman-al',
    kind: 'guide',
    navLabel: 'Cullman, AL',
    blurb: 'An AI receptionist for Cullman County HVAC, plumbing, roofing, and electrical shops.',
    title: 'AI Answering Service in Cullman, AL',
    metaTitle: 'AI Receptionist & Answering Service in Cullman, AL',
    description:
      'An AI answering service for Cullman County HVAC, plumbing, roofing, and electrical shops. Ava emails you every lead. Starter $1, then $79/mo.',
    eyebrow: 'Cullman, Alabama',
    h1: 'AI answering service for Cullman shops',
    directAnswer:
      'Executive Receptionist is run by Cole Collins in Hanceville, Alabama, in Cullman County. HVAC, plumbing, roofing, and electrical shops in Cullman, Hanceville, Good Hope, Vinemont, and the rest of the county keep their number and forward missed or after-hours calls to Ava. She says she is an AI receptionist, takes the name, callback number, address, and what is wrong, and emails you the lead. Plans are the same statewide: Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. The demo line, (256) 952-4935, is a 256 number.',
    audience: 'Cullman County home-service shops',
    lede: 'This is the operator’s home county. You keep your number, forward the calls you can’t take, and get every lead by email. Setup is done by phone and email, and Cole writes the greeting from your services, hours, and service area.',
    pain: 'Most Cullman County shops are one to three trucks, and the owner is the one answering the phone between jobs. A no-cool call at 9 p.m. or a leak on a Sunday goes to voicemail, and the caller tries the next shop on the list.',
    calls: [
      'No-heat and no-cool calls after hours',
      'Leaks, backups, and water-heater failures',
      'Storm and roof-leak calls after a front moves through',
      'Breakers tripping, outages, and panel questions',
      'Overflow while the owner is on a job',
    ],
    qualification: ['Name and callback number', 'Address and town in the county', 'What the system, pipe, roof, or panel is doing', 'How urgent it is', 'Best callback time'],
    roiTitle: 'Price a missed Cullman call with your own numbers',
    roiBody: `${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 350, jobLabel: 'job' })} The $350 is an example, not a Cullman average.`,
    faqs: [
      {
        q: 'Is Executive Receptionist based in Cullman County?',
        a: 'Yes. It is operated by Cole Collins DBA Executive Receptionist in Hanceville, Alabama. Setup is done by phone and email.',
      },
      {
        q: 'Which Cullman trades is it set up for?',
        a: 'HVAC, plumbing, roofing, electrical, and other home-service shops. The greeting and intake questions are written for your trade: no-heat versus no-cool, an active leak, storm damage, or a breaker that keeps tripping.',
      },
      {
        q: 'What does it cost?',
        a: 'The same four plans apply statewide: Starter $79 a month (100 minutes, first month $1), Growth $197, Pro $397, Elite $789. Month to month, cancel anytime, no per-minute overage.',
      },
      {
        q: 'Can I keep my number and only forward missed calls?',
        a: 'Yes. Your carrier forwards calls to Ava. Forward every call, or only the ones you miss or can’t take while busy, so she covers overflow and after hours.',
      },
    ],
    related: ['ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-answering-service-huntsville-al', 'ai-answering-service-gadsden-al', 'after-hours-answering-service'],
    areaServed: ['Cullman', 'Hanceville', 'Good Hope', 'Vinemont', 'Cullman County', 'Alabama', 'United States'],
  },
  {
    slug: 'ai-answering-service-huntsville-al',
    kind: 'guide',
    navLabel: 'Huntsville, AL',
    blurb: 'An AI receptionist for Huntsville and Madison County home-service shops.',
    title: 'AI Answering Service in Huntsville, AL',
    metaTitle: 'AI Receptionist & Answering Service in Huntsville, AL',
    description:
      'AI answering service for Huntsville and Madison County HVAC, plumbing, roofing, and electrical shops. Ava emails you every lead. Starter $1, then $79/mo.',
    eyebrow: 'Huntsville, Alabama',
    h1: 'AI answering service for Huntsville shops',
    directAnswer:
      'Executive Receptionist is run by Cole Collins in Hanceville, Alabama, about an hour south of Huntsville. HVAC, plumbing, roofing, and electrical shops in Huntsville, Madison, Harvest, Hampton Cove, and the rest of Madison County keep their number and forward missed or after-hours calls to Ava. She says she is an AI receptionist, takes the details, and emails you the lead. Plans are the same statewide: Starter $79 a month (first month $1), Growth $197, Pro $397, Elite $789. Demo line: (256) 952-4935.',
    audience: 'Huntsville and Madison County home-service shops',
    lede: 'Keep your 256 number, forward what you can’t take, and get every lead by email. Setup is done by phone and email. We do not claim a Huntsville office or a list of local customers.',
    pain: 'Huntsville keeps growing, and so does the drive time between jobs. When every tech is on a call across town, the phone rolls to voicemail, and new-construction homeowners with no regular shop yet just call the next listing.',
    calls: [
      'No-heat and no-cool calls in Madison County',
      'Leaks, backups, and water-heater failures',
      'Roof leaks and storm-damage calls',
      'Electrical outages and panel questions',
      'After-hours and weekend overflow',
    ],
    qualification: ['Name and callback number', 'Address and part of town', 'What they need', 'How urgent it is', 'Best callback time'],
    roiTitle: 'Price a missed Huntsville call with your own numbers',
    roiBody: `${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 350, jobLabel: 'job' })} The $350 is an example, not a Huntsville average.`,
    faqs: [
      {
        q: 'Do you have a Huntsville office?',
        a: 'No. Executive Receptionist is run by Cole Collins from Hanceville, Alabama. Setup is done by phone and email.',
      },
      {
        q: 'Which Huntsville trades is it set up for?',
        a: 'HVAC, plumbing, roofing, electrical, and other home-service shops. The greeting and intake questions are written for your trade, and every call is emailed to you as a lead.',
      },
      {
        q: 'What does it cost?',
        a: 'The same four plans apply statewide: Starter $79 a month (100 minutes, first month $1), Growth $197, Pro $397, Elite $789. Month to month, cancel anytime.',
      },
      {
        q: 'Can Ava book the visit?',
        a: 'Once your hours are set up in your Desk, she offers open windows and books the visit on the call. Until then she takes the details and emails you the lead so you can call back.',
      },
    ],
    related: ['ai-receptionist-for-hvac-and-plumbing-in-alabama', 'ai-answering-service-cullman-al', 'ai-answering-service-birmingham-al', 'after-hours-answering-service'],
    areaServed: ['Huntsville', 'Madison', 'Harvest', 'Hampton Cove', 'Madison County', 'Alabama', 'United States'],
  },
];


const guideBySlug = new Map(AVA_GUIDES.map((guide) => [guide.slug, guide]));

if (AVA_GUIDES.length !== 32 || guideBySlug.size !== 32) {
  throw new Error(`Expected 32 unique Executive Receptionist guides, found ${AVA_GUIDES.length} rows and ${guideBySlug.size} slugs.`);
}

for (const guide of AVA_GUIDES) {
  for (const slug of guide.related) {
    if (!guideBySlug.has(slug) || slug === guide.slug) {
      throw new Error(`Executive Receptionist guide ${guide.slug} points at a missing related page: ${slug}`);
    }
  }
}

export function getAvaGuide(slug: string) {
  return guideBySlug.get(slug);
}

export function avaGuideSlugs() {
  return AVA_GUIDES.map((guide) => guide.slug);
}
