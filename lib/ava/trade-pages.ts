import { exampleSentence } from '@/lib/ava/missed-call-math';
import { BLS_RECEPTIONIST, GOOGLE_NEARBY_SEARCH } from '@/lib/ava/sources';

export type GuideKind = 'trade' | 'guide' | 'comparison' | 'calculator';

export type GuideFaq = { q: string; a: string };

export type GuideSource = { href: string; text: string };

export type GuideColumn = { title: string; body: string };

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
    metaTitle: 'AI Answering Service for Plumbers | Ava',
    description:
      'Ava answers plumbing calls when the truck is on a job. She captures the leak, the address, and a callback number, then texts you the lead. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for plumbers',
    h1: 'Answer the leak call while you are still under the sink.',
    audience: 'plumbing companies and owner-operators',
    lede:
      'A homeowner with water on the floor does not wait on voicemail. Ava picks up, asks whether they can shut the water off, and texts you a lead you can dispatch or call back.',
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
    roiBody: `Emergency calls are the ones that will not leave a second voicemail. ${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 425, jobLabel: 'plumbing job' })} A $79 Starter plan after the trial is the published price to compare against your own version of that example.`,
    faqs: [
      {
        q: 'Can Ava tell an emergency from a faucet quote?',
        a: 'You write the urgent rules. A typical plumbing setup asks whether water is still running and flags active flooding for the callback path you choose. Ava does not shut off water or dispatch a truck by herself.',
      },
      {
        q: 'Will she quote a price on the call?',
        a: 'Only if you give her an approved line, such as a diagnostic fee you already publish. She should not invent trip charges or repair prices.',
      },
      {
        q: 'Can I keep my current plumbing number?',
        a: 'Usually, by forwarding the calls you do not answer. The exact carrier steps are confirmed during setup. Ava does not replace your phone carrier.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'missed-call-cost-calculator', 'ai-answering-service-for-general-contractors'],
  }),
  trade({
    slug: 'ai-answering-service-for-hvac',
    navLabel: 'HVAC',
    blurb: 'No-cool, no-heat, maintenance, and replacement estimate calls.',
    title: 'AI Answering Service for HVAC',
    metaTitle: 'AI Answering Service for HVAC Companies | Ava',
    description:
      'Ava answers HVAC calls during no-cool and no-heat spikes, captures the symptom and address, and texts the lead. Free 7-day trial, then plans from $79 a month.',
    eyebrow: 'AI answering service for HVAC',
    h1: 'Pick up the no-cool call while the tech is on another roof.',
    audience: 'HVAC contractors and heating and cooling teams',
    lede:
      'Peak season is a pile of calls that all sound urgent. Ava asks whether the house has heat or cooling, what the system is doing, and when someone can be home — then texts you the lead.',
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
        q: 'Can Ava handle emergency HVAC wording?',
        a: 'She can flag the phrases you list, such as no heat with someone medically vulnerable in the home, and follow the escalation note you wrote. Life-safety situations still follow your human policy, including telling the caller to contact emergency services when that is your rule.',
      },
      {
        q: 'Does Ava replace ServiceTitan or Housecall Pro?',
        a: 'No. Ava is the call layer. Your field software stays where jobs are scheduled and invoiced.',
      },
      {
        q: 'Can maintenance agreements and replacement leads use different questions?',
        a: 'Yes. Growth and Pro include more room for separate service types and routing. Starter still covers one clear intake: who, where, and what is wrong.',
      },
    ],
    related: ['ai-answering-service-for-plumbers', 'ai-answering-service-for-electricians', 'missed-call-answering-home-services'],
  }),
  trade({
    slug: 'ai-answering-service-for-roofers',
    navLabel: 'Roofers',
    blurb: 'Storm, leak, inspection, and replacement calls while crews are on roofs.',
    title: 'AI Answering Service for Roofers',
    metaTitle: 'AI Answering Service for Roofers | Ava',
    description:
      'Ava captures roof leak and storm-damage calls while your crews are on site. She collects the address and what happened, then texts you. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for roofers',
    h1: 'Catch the storm calls that hit while every ladder is already up.',
    audience: 'roofing contractors and storm-response crews',
    lede:
      'After hail, the phone does not ring once. It rings while you are on someone else’s roof. Ava takes the address, asks whether water is coming in now, and texts you a list you can schedule instead of a voicemail box.',
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
        q: 'Can Ava talk about insurance?',
        a: 'She can ask whether the caller already filed a claim and when the storm was, if you want those facts. She should not interpret coverage or tell anyone what a carrier will pay.',
      },
      {
        q: 'What about a surge of fifty calls?',
        a: 'Ava can take them one after another and text each lead. Your included minutes still apply. A storm week can use the plan’s overage rate, which is printed on the pricing section before you start.',
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
    metaTitle: 'AI Answering Service for Electricians | Ava',
    description:
      'Ava answers electrical calls, separates a dead outlet from a downed line, and texts you the lead. She does not give electrical advice. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for electricians',
    h1: 'Take the panel call without stepping off the ladder.',
    audience: 'electrical contractors',
    lede:
      'Ava can ask which breakers tripped, whether the whole house is dark, and if anyone smells burning. Burning, sparks, or a line on the ground should follow the emergency instruction you write — often “call 911 and the utility,” not “wait for a callback.”',
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
    roiBody: `Service calls and panel replacements should not share one pretend average. ${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 280, jobLabel: 'electrical service call' })} If you mostly sell panel upgrades, raise the job value. The point is to see the gap next to a $79 or $149 plan, with your numbers.`,
    faqs: [
      {
        q: 'Will Ava tell people how to reset a breaker?',
        a: 'Only if you explicitly approve that sentence. By default she should collect the situation and avoid coaching someone through a panel.',
      },
      {
        q: 'What if the caller reports a downed line?',
        a: 'Put that in urgent rules: tell them to stay away and contact emergency services and the utility. Ava is not a utility dispatcher.',
      },
      {
        q: 'Can she book the job on my calendar?',
        a: 'Not in this product. She texts the lead. You call back and schedule in whatever system you already use.',
      },
    ],
    related: ['ai-answering-service-for-hvac', 'ai-answering-service-for-garage-door', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-landscapers',
    navLabel: 'Landscapers',
    blurb: 'Installs, cleanups, and design-build estimates while the crew is on site.',
    title: 'AI Answering Service for Landscapers',
    metaTitle: 'AI Answering Service for Landscapers | Ava',
    description:
      'Ava answers landscaping estimate calls, captures the property and the work requested, and texts you. Built for crews that cannot stop a job to take a lead. Plans from $79 a month.',
    eyebrow: 'AI answering service for landscapers',
    h1: 'Stay on the install. Let Ava take the next estimate call.',
    audience: 'landscaping companies',
    lede:
      'Landscape leads are specific: new beds, a patio, drainage, a cleanup after a storm. Ava asks which of those they want, where the property is, and when they hope to start, then texts you enough to decide if it is your work.',
    pain:
      'The person who can price a project is usually the person running equipment. Returning a vague voicemail at dusk means a second call just to learn they wanted a sketch, not mowing. The sample call on the Ava homepage is a landscaping estimate so you can hear that pace.',
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
        a: 'No. Lawn care is mostly recurring routes and same-week starts. This page is project work: installs, cleanups, and site visits. You can still use one Ava for both if you spell out the two question paths.',
      },
      {
        q: 'Can Ava describe plants or promise a design?',
        a: 'She should not design the yard on the call. She captures the request so you can look at the property.',
      },
      {
        q: 'Where is the sample call?',
        a: 'On the Ava homepage, labeled as a prerecorded landscaping estimate. It is an example, not a recording of a customer of yours.',
      },
    ],
    related: ['ai-answering-service-for-lawn-care', 'ai-answering-service-for-fencing', 'ai-answering-service-for-tree-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-lawn-care',
    navLabel: 'Lawn care',
    blurb: 'Weekly mowing, cleanups, and route leads while you are on a mower.',
    title: 'AI Answering Service for Lawn Care',
    metaTitle: 'AI Answering Service for Lawn Care Companies | Ava',
    description:
      'Ava answers lawn care calls about mowing, cleanups, and recurring service, then texts you the address and what they asked for. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for lawn care',
    h1: 'Take the new-route call without killing the mower.',
    audience: 'lawn care and mowing companies',
    lede:
      'Lawn leads are often simple and time-sensitive: they want someone this week. Ava asks for the address, lot size if they know it, and whether they want weekly service or a one-time cut.',
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
        q: 'Can Ava tell people the price of a cut?',
        a: 'Only with a sentence you approve, such as “mowing is quoted from the address.” Guessing a price from a vague description is a good way to create a bad job.',
      },
      {
        q: 'What about customers who already have an account?',
        a: 'You can tell Ava to mark “existing customer” and text you the request instead of treating it as a new lead.',
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
    metaTitle: 'AI Answering Service for Pest Control | Ava',
    description:
      'Ava answers pest control calls, asks what the caller saw and where, and texts you the lead. She does not recommend pesticides. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for pest control',
    h1: 'Get the “there are wasps in the wall” call while you are under another house.',
    audience: 'pest control companies',
    lede:
      'People call pest control when something is in the kitchen or the eaves, and they want a person today. Ava asks what they saw, which room, and whether children or pets live there, then texts you. She does not name a chemical or promise an extermination.',
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
        q: 'Can Ava recommend a product?',
        a: 'No. She should not tell callers which pesticide to buy or how to apply one. Your technician does that on site, under your license.',
      },
      {
        q: 'What about wildlife trapping?',
        a: 'If you do not offer it, give Ava the sentence you want, such as the name of a referral or “we don’t trap wildlife.”',
      },
      {
        q: 'Can she sell a quarterly plan on the call?',
        a: 'She can describe a plan only with the words you approve, then text you the lead. Closing the agreement stays with you.',
      },
    ],
    related: ['ai-answering-service-for-lawn-care', 'ai-answering-service-for-cleaning', 'ai-receptionist-for-small-business'],
  }),
  trade({
    slug: 'ai-answering-service-for-cleaning',
    navLabel: 'Cleaning',
    blurb: 'Recurring house cleaning, move-outs, and the details a quote actually needs.',
    title: 'AI Answering Service for Cleaning Companies',
    metaTitle: 'AI Answering Service for Cleaning Companies | Ava',
    description:
      'Ava answers cleaning-company calls, asks about the home and how often they want service, and texts you the lead. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for cleaning companies',
    h1: 'Book the walkthrough conversation while your team is in someone else’s house.',
    audience: 'residential and commercial cleaning companies',
    lede:
      'Cleaning quotes fall apart without basics: bedrooms and bathrooms, pets, and whether this is a recurring clean or a move-out. Ava asks those questions and texts you. She does not promise a price from a room count.',
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
    roiBody: `Compare the first clean, not a fictional lifetime value. ${exampleSentence({ missedPerWeek: 5, oneIn: 3, jobValue: 180, jobLabel: 'first cleaning visit' })} If a client stays for months, that is upside on top of the example, not something Ava can claim.`,
    faqs: [
      {
        q: 'Can Ava say the team is background-checked or insured?',
        a: 'Only if that sentence is true and you approve the exact wording. Ava should not invent credentials.',
      },
      {
        q: 'Will she give a per-room price?',
        a: 'Not unless you supply a published price and the conditions. Most shops do better collecting the facts and quoting themselves.',
      },
      {
        q: 'What if I only want after-hours coverage?',
        a: 'Forward the line to Ava when you do not answer, or only outside the hours you work. You do not have to send every call.',
      },
    ],
    related: ['ai-answering-service-for-painters', 'ai-receptionist-for-small-business', 'missed-call-cost-calculator'],
  }),
  trade({
    slug: 'ai-answering-service-for-painters',
    navLabel: 'Painters',
    blurb: 'Interior rooms, exteriors, and the questions that keep a bid honest.',
    title: 'AI Answering Service for Painters',
    metaTitle: 'AI Answering Service for Painters | Ava',
    description:
      'Ava answers painting estimate calls, captures rooms or exterior details, and texts you the lead while you are on a job. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for painters',
    h1: 'Take the estimate call without climbing down.',
    audience: 'painting contractors',
    lede:
      'A painting lead without a scope is a callback that wastes the evening. Ava asks interior or exterior, about how many rooms or which sides of the house, and whether they are painting occupied rooms.',
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
        q: 'Can Ava discuss lead paint?',
        a: 'She should not advise on lead abatement or tell someone to sand old paint. If the home might be pre-1978, your approved line can be that you will cover that on the visit.',
      },
      {
        q: 'Can she text photos requests?',
        a: 'The lead text goes to you, not a photo thread with the homeowner, unless you handle that yourself after the call. Ava’s handoff is the summary to your phone.',
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
    metaTitle: 'AI Answering Service for General Contractors | Ava',
    description:
      'Ava answers general-contractor calls, captures the project and the address, and texts you. She does not produce a bid on the call. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for general contractors',
    h1: 'Capture the remodel call while you are on a jobsite.',
    audience: 'general contractors and remodeling companies',
    lede:
      'GC calls are messy on purpose: a bathroom, a deck, “a few things around the house.” Ava’s job is to learn which trade is involved, whether the home is occupied, and how to reach them — not to price the work.',
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
      'Any timing or budget they volunteer — never a number Ava invents',
    ],
    roiTitle: 'Do not divide a remodel by a fake close rate',
    roiBody: `A single won remodel dwarfs the subscription. The honest first step is the conversation you missed. ${exampleSentence({ missedPerWeek: 3, oneIn: 3, jobValue: 400, jobLabel: 'site visit you would have scheduled' })} Price the visit in the example. Put the project value in the calculator only if you want to see that larger, riskier number.`,
    faqs: [
      {
        q: 'Will Ava sound like a project manager?',
        a: 'She sounds like the greeting and questions you approve. She should not discuss allowances, change orders, or contract terms.',
      },
      {
        q: 'Can vendors be screened out?',
        a: 'You can give her a rule for sales calls, such as taking a number and marking the text as a vendor. She will not be perfect at that. Review the texts.',
      },
      {
        q: 'How is this different from a call center?',
        a: 'A call center is a staffing service with its own price sheet. Ava is software on a published plan: $79, $149, or $299 a month after a 7-day trial, with included minutes listed on the plan.',
      },
    ],
    related: ['ai-receptionist-vs-answering-service', 'ai-answering-service-for-painters', 'ai-answering-service-for-roofers'],
  }),
  trade({
    slug: 'ai-answering-service-for-dentists',
    navLabel: 'Dentists',
    blurb: 'New-patient and scheduling calls, without pretending this is a HIPAA product.',
    title: 'AI Answering Service for Dentists',
    metaTitle: 'AI Answering Service for Dentists | Ava',
    description:
      'Ava can answer dental front-desk overflow: new-patient calls, hours, and callback requests. She is not a HIPAA product. Confirm what she may say before you forward the line. Plans from $79 a month.',
    eyebrow: 'AI answering service for dental offices',
    h1: 'Cover the front desk when the chair is full and the phone is still ringing.',
    audience: 'dental practices and small clinics',
    lede:
      'Ava can greet a caller, give the hours and address you approve, and take a name and number for a callback. She should not collect clinical details, insurance treatment histories, or anything you are not willing to have in a text message to the office phone.',
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
        q: 'Is Ava HIPAA compliant?',
        a: 'No. Do not use Ava to collect health information, insurance member IDs, or clinical notes. If your compliance officer says the line must stay with trained staff, keep it there. This page is for offices that want a callback taken, not a chart started.',
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
    metaTitle: 'AI Answering Service for Law Firms | Ava',
    description:
      'Ava can take a name and number for a law-firm callback and repeat the hours you approve. She does not give legal advice or run a conflict check. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for law firms',
    h1: 'Take the consult call when everyone is in a hearing.',
    audience: 'small law firms and solo practices',
    lede:
      'Ava can answer, say she is an AI receptionist, and collect a name, phone number, and the kind of matter in plain language. She should not assess a case, promise confidentiality beyond what your engagement process actually provides, or decide there is no conflict.',
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
        q: 'Can Ava run conflicts?',
        a: 'No. She does not see your client list. Staff still screen conflicts before anyone is engaged.',
      },
      {
        q: 'Should criminal, family, or immigration callers talk to an AI?',
        a: 'That is the firm’s decision. Many firms will want those calls transferred to a person or sent to a dedicated voicemail. You can refuse to let Ava take them.',
      },
    ],
    related: ['ai-answering-service-for-dentists', 'ai-receptionist-for-small-business', 'ai-receptionist-vs-answering-service'],
  }),
  trade({
    slug: 'ai-answering-service-for-garage-door',
    navLabel: 'Garage door',
    blurb: 'Stuck doors, broken springs, and opener quotes with a safety line.',
    title: 'AI Answering Service for Garage Door Companies',
    metaTitle: 'AI Answering Service for Garage Door Companies | Ava',
    description:
      'Ava answers garage-door calls about stuck doors, springs, and new openers, then texts you the lead. She does not talk anyone through a spring repair. Plans from $79 a month.',
    eyebrow: 'AI answering service for garage door companies',
    h1: 'Answer the stuck-door call while you are on another driveway.',
    audience: 'garage door repair and installation companies',
    lede:
      'A car trapped in the garage is a today call. Ava asks whether the door is stuck open or closed, single or double, and whether a spring looks broken. She should tell callers not to touch a spring if that is your rule.',
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
        q: 'Can Ava walk someone through winding a spring?',
        a: 'No. The approved line should be that springs are dangerous and a technician needs to see them.',
      },
      {
        q: 'Can she quote a spring replacement?',
        a: 'Only if you publish a price that does not depend on details she cannot see. Most shops text the lead and quote after a look or a photo you request yourself.',
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
    metaTitle: 'AI Answering Service for Tree Service Companies | Ava',
    description:
      'Ava answers tree-service calls about removals, limbs, and storm damage, and texts you the address. Downed power lines stay an emergency-services and utility call. Plans from $79 a month.',
    eyebrow: 'AI answering service for tree service',
    h1: 'Take the storm-limb call while the chipper is already running.',
    audience: 'tree service and arborist companies',
    lede:
      'Ava asks what happened to the tree, whether it is on a house or a car, and whether any wire is involved. If a line is down, your script should send them to emergency services and the utility — not put them in a callback queue.',
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
        q: 'Will Ava claim to be an arborist?',
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
    metaTitle: 'AI Answering Service for Pool Companies | Ava',
    description:
      'Ava answers pool-company calls about green water, openings, and weekly service, then texts you the lead. She does not prescribe chemicals. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI answering service for pool companies',
    h1: 'Answer the green-pool call while you are in someone else’s equipment pit.',
    audience: 'pool service and repair companies',
    lede:
      'Pool calls cluster when the weather turns. Ava asks weekly service or a one-time cleanup, roughly how the water looks, and whether equipment is making noise. Chemical dosing stays off the call.',
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
        q: 'Can Ava tell them how much chlorine to add?',
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
    metaTitle: 'AI Answering Service for Fencing Companies | Ava',
    description:
      'Ava answers fencing estimate calls, asks material and roughly where the fence goes, and texts you the lead. She does not price linear feet she cannot see. Plans from $79 a month.',
    eyebrow: 'AI answering service for fencing companies',
    h1: 'Log the fence estimate while the crew is setting posts.',
    audience: 'fence contractors',
    lede:
      'Fence leads want a price before they have a measurement. Ava’s useful job is to learn wood, vinyl, or chain link, whether they need a gate, and the address — then let you measure.',
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
        q: 'Can Ava quote per foot?',
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
    metaTitle: 'AI Receptionist for Small Business | Ava',
    description:
      'Ava is an AI receptionist for small businesses that miss calls while the owner is doing the work. She takes a name, number, and reason, then texts you. Plans from $79 a month after a 7-day trial.',
    eyebrow: 'AI receptionist for small business',
    h1: 'A front desk for the shop where the owner still answers the phone.',
    audience: 'small businesses whose owner or a single employee answers the phone',
    lede:
      'Ava is for the business that does not have a person sitting at a desk from 8 to 5. She answers, asks what the caller needs, and texts the owner. A full-time receptionist is a different purchase — the federal median pay for receptionists was $37,230 a year in May 2024, before taxes and benefits.',
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
    roiTitle: 'Compare Ava with a person, using a real wage figure',
    roiBody: `The U.S. Bureau of Labor Statistics reported median pay for receptionists of $37,230 a year, $17.90 an hour, in May 2024. That is about $3,103 a month before employer taxes, benefits, recruiting, or coverage outside one shift. Ava Starter is $79 a month after the trial and does not do every task that person does — she answers and texts you the lead. ${exampleSentence({ missedPerWeek: 5, oneIn: 4, jobValue: 250, jobLabel: 'job or appointment you would have called back' })}`,
    faqs: [
      {
        q: 'Is an AI receptionist the same as an answering service?',
        a: 'Buyers use both phrases. A traditional answering service is people in a call center. Ava is software with a voice, on a plan you can read before you talk to sales. The comparison page spells out the differences.',
      },
      {
        q: 'What does setup cost?',
        a: '$0 on the published plans. The 7-day trial is created in Stripe Checkout. After that, Starter is $79, Growth is $149, and Pro is $299 a month.',
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
    blurb: 'Voicemail, a human answering service, and Ava — what each one actually does.',
    title: 'AI Receptionist vs Answering Service',
    metaTitle: 'AI Receptionist vs Answering Service | Ava',
    description:
      'Compare voicemail, a human answering service, and Ava. Ava is a published software plan from $79 a month that answers, qualifies, and texts you the lead. No invented savings percentage.',
    eyebrow: 'AI receptionist vs answering service',
    h1: 'Voicemail, a call center, or software that texts you the lead.',
    audience: 'owners comparing an answering service with an AI receptionist',
    lede:
      '“Answering service” usually means people who pick up and take a message. “AI receptionist” means software that holds the conversation you scripted. Ava is the second one. The useful comparison is what happens to the caller and what you pay, not a slogan about replacing staff.',
    pain:
      'Human answering services often price after a sales call, by the minute or by the seat. Voicemail is cheap and loses the callers who will not leave a message. A receptionist on payroll is a different product entirely: the median pay was $37,230 a year in May 2024, and that person does work Ava does not do.',
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
      'A text you can act on',
    ],
    roiTitle: 'Put the prices next to each other without a fake percentage',
    roiBody: `Ava’s prices are on this site: $79, $149, and $299 a month after a 7-day trial, $0 setup, with 300, 800, or 1,800 included minutes. Overage is $0.28, $0.24, or $0.20 a minute. A human answering service will give you its own quote. A W-2 receptionist at the May 2024 median is about $3,103 a month in wages alone. ${exampleSentence({ missedPerWeek: 6, oneIn: 4, jobValue: 300, jobLabel: 'callback you would have made' })} Use the calculator so the missed-call side is yours.`,
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
        title: 'Ava',
        body: 'Software answers in the voice and questions you approve, then texts you. You can hear a sample and try a live browser demo before checkout. She will get calls wrong sometimes. You review the texts and edit the rules. She is not a licensed dispatcher, lawyer, or clinician.',
      },
    ],
    faqs: [
      {
        q: 'Is Ava cheaper than an answering service?',
        a: 'Ava’s price is published. Theirs may not be, until you ask. Compare the quote they send with $79, $149, or $299 a month and the included minutes. Do not trust a chart that says “save 80%” without showing both invoices.',
      },
      {
        q: 'Can Ava transfer to a person?',
        a: 'You can write escalation rules for urgent calls. Live phone provisioning is still finished with Cole after checkout. The product does not buy your phone number automatically.',
      },
      {
        q: 'Which one should a contractor start with?',
        a: 'If you want to hear the call yourself tonight, play the sample and use the browser demo, then start the Stripe trial. If you already have a human service you like, stay. This page is not a reason to cancel something that is working.',
      },
    ],
    related: ['ai-receptionist-for-small-business', 'missed-call-cost-calculator', 'ai-answering-service-for-general-contractors'],
    sources: [blsSource],
  },
  {
    slug: 'missed-call-cost-calculator',
    kind: 'calculator',
    navLabel: 'Missed-call calculator',
    blurb: 'Your calls, your assumed close rate, your job value. The math is shown.',
    title: 'Missed Call Cost Calculator',
    metaTitle: 'Missed Call Cost Calculator for Contractors | Ava',
    description:
      'Estimate what missed calls might be worth using your own numbers. The calculator shows the formula. It is not a study and not a promise. Ava plans start at $79 a month after a 7-day trial.',
    eyebrow: 'Missed call cost calculator',
    h1: 'What missed calls cost is the arithmetic you put in.',
    audience: 'owners who want a missed-call figure without a fake industry average',
    lede:
      'This page multiplies three numbers you control: how many calls you miss in a week, how many of those you believe you would have booked, and what that job is worth. The result is an example monthly figure. It is not Ava’s prediction.',
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
      'Compare it with $79, $149, or $299 a month',
    ],
    roiTitle: 'How the formula works',
    roiBody:
      'Monthly example = missed calls per week × (1 ÷ “1 in N”) × job value × 52 ÷ 12. The 52 ÷ 12 step turns a week into a month. It assumes every week looks like the week you typed. It ignores seasonality, capacity, and the calls you would have turned down. Ava Starter is $79 a month after the 7-day trial. The calculator does not subtract that for you, so you can see both numbers.',
    faqs: [
      {
        q: 'Why is there no official missed-call percentage?',
        a: 'Because we do not have a defensible one for plumbers, roofers, or dentists. A percentage from an answering-service ad is not a source. Your call log is.',
      },
      {
        q: 'Does a bigger result mean Ava will make that money?',
        a: 'No. It means that is what your assumptions are worth if they are true. Some of those callers would have been price shopping, tire kickers, or outside your area.',
      },
      {
        q: 'What should I do with the number?',
        a: 'If it is large next to $79 a month, hear the sample call and start a trial. If it is tiny, you may not need this. The calculator is allowed to talk you out of it.',
      },
    ],
    related: ['ai-receptionist-vs-answering-service', 'missed-call-answering-home-services', 'ai-answering-service-for-plumbers'],
  },
  {
    slug: 'missed-call-answering-home-services',
    kind: 'guide',
    navLabel: 'Missed calls',
    blurb: 'Overflow and after-hours coverage without sending every call to Ava.',
    title: 'Missed-Call Answering for Home Services',
    metaTitle: 'Missed Call Answering for Home Services | Ava',
    description:
      'Use Ava on the calls you do not answer: after hours, overflow, and weekends. She texts you the lead. You can keep answering the calls you pick up. Plans from $79 a month.',
    eyebrow: 'Missed-call answering for home services',
    h1: 'You do not have to give Ava every call. Give her the ones you miss.',
    audience: 'home-service businesses that already answer some of the time',
    lede:
      'Call forwarding can send Ava only the rings you do not pick up. You keep talking to the customers you answer. She talks to the rest, including the 7 p.m. call from someone who searched “near me” and is ready to hire a person tonight.',
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
      'A text that arrives while you are still on the first job',
    ],
    roiTitle: 'Count only the calls you actually miss',
    roiBody: `Do not put your entire call volume into the calculator. ${exampleSentence({ missedPerWeek: 8, oneIn: 4, jobValue: 275, jobLabel: 'home-service job' })} Eight misses is an example week, not a benchmark.`,
    faqs: [
      {
        q: 'Can I answer the phone myself and still use Ava?',
        a: 'Yes. That is the usual setup: forward on no-answer, or forward the schedule you are closed.',
      },
      {
        q: 'What does the caller hear?',
        a: 'Your greeting, including that Ava is an AI receptionist. You approve the words during setup.',
      },
      {
        q: 'Where do the leads go?',
        a: 'To the phone and email you enter on the setup form after checkout. You can lock those destinations after the first save.',
      },
    ],
    related: ['missed-call-cost-calculator', 'ai-answering-service-for-hvac', 'ai-receptionist-for-small-business'],
    sources: [nearbySource],
  },
];

const guideBySlug = new Map(AVA_GUIDES.map((guide) => [guide.slug, guide]));

if (AVA_GUIDES.length !== 20 || guideBySlug.size !== 20) {
  throw new Error(`Expected 20 unique Ava guides, found ${AVA_GUIDES.length} rows and ${guideBySlug.size} slugs.`);
}

for (const guide of AVA_GUIDES) {
  for (const slug of guide.related) {
    if (!guideBySlug.has(slug) || slug === guide.slug) {
      throw new Error(`Ava guide ${guide.slug} points at a missing related page: ${slug}`);
    }
  }
}

export function getAvaGuide(slug: string) {
  return guideBySlug.get(slug);
}

export function avaGuideSlugs() {
  return AVA_GUIDES.map((guide) => guide.slug);
}
