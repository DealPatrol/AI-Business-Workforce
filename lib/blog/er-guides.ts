import type { BlogBlock, BlogPost } from '@/lib/blog/posts';
import { PRICES_CHECKED_LABEL } from '@/lib/er/competitors';

const ER = 'https://executivereceptionist.com';
const cta = (path: string, slug: string) => `${ER}${path}?utm_source=blog&utm_medium=article&utm_campaign=${slug}`;

function words(blocks: BlogBlock[]) {
  return blocks
    .map((b) => ('text' in b ? b.text : b.items.join(' ')))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function post(input: Omit<BlogPost, 'words' | 'site' | 'published'>): BlogPost {
  return { ...input, site: 'er', published: '2026-11-22', words: words(input.blocks) };
}

const AVA_PLANS_LINE =
  'Executive Receptionist (Ava) is a flat monthly plan: Starter $79 for 100 minutes (the first month is $1), Growth $197 for 300 minutes, Pro $397 for 1,200 minutes, and Elite $789 for 2,000 minutes. There are no per-minute overage fees; if you run past your minutes, Ava keeps answering and we reach out about a bigger plan.';

export const ER_GUIDE_POSTS: BlogPost[] = [
  post({
    slug: 'smith-ai-pricing',
    title: `Smith.ai Pricing, Explained (Checked ${PRICES_CHECKED_LABEL})`,
    metaTitle: 'Smith.ai Pricing: AI and Staffed Plans Explained',
    description: `Smith.ai's AI receptionist and staffed receptionist prices, read from smith.ai on ${PRICES_CHECKED_LABEL}, with what a per-call plan costs a busy shop.`,
    tags: ['pricing', 'Smith.ai', 'AI receptionist', 'answering service'],
    ctaLabel: 'Compare Ava vs Smith.ai side by side',
    ctaUrl: cta('/compare/ava-vs-smith-ai', 'smith-ai-pricing'),
    blocks: [
      { type: 'p', text: `Smith.ai sells two products: an AI receptionist and a staffed (human) receptionist. Both are priced per call, not per minute. These numbers come from Smith.ai's own pricing pages, checked on ${PRICES_CHECKED_LABEL}. Prices change, so confirm on smith.ai before you buy.` },
      { type: 'h2', text: 'Smith.ai AI receptionist' },
      { type: 'ul', items: [
        'Free: $0 for 25 calls a month.',
        'Pro: $150 a month for 75 calls, about $2.00 a call.',
        'Bigger steps: $270 for 150 calls, $500 for 300 calls, $800 for 500 calls.',
        'Extra calls past your plan cost between $3.00 and $2.10 each, depending on the plan.',
      ] },
      { type: 'h2', text: 'Smith.ai staffed receptionists' },
      { type: 'ul', items: [
        '$300 a month for 30 calls, $11.50 for each extra call.',
        '$810 a month for 90 calls, $10.50 for each extra call.',
        '$2,100 a month for 300 calls, $8.50 for each extra call.',
        'Smith.ai lists a 30-day money-back guarantee.',
      ] },
      { type: 'h2', text: 'What per-call pricing means for a busy shop' },
      { type: 'p', text: 'Per-call pricing is easy to understand when call volume is steady. It gets harder to predict in a heat wave or a storm week, when call count can jump. Short calls count the same as long ones.' },
      { type: 'p', text: 'Example from published prices: a shop that sends 150 calls a month to the Smith.ai AI plan would sit on the $270 step. The same 150 calls averaging two minutes is 300 minutes, which is Ava Growth at $197. Your calls may be longer or shorter, so run your own numbers.' },
      { type: 'h2', text: 'Where Smith.ai is the better fit' },
      { type: 'p', text: 'If you want live humans who can transfer a caller to you, Smith.ai offers that and Ava does not. Smith.ai also has a free AI tier for very low call volume.' },
      { type: 'h2', text: 'How Executive Receptionist prices it' },
      { type: 'p', text: AVA_PLANS_LINE },
      { type: 'p', text: 'You can hear Ava before you pay: call the demo line at (256) 952-4935.' },
    ],
  }),
  post({
    slug: 'ruby-receptionist-pricing',
    title: `Ruby Receptionist Pricing (Checked ${PRICES_CHECKED_LABEL})`,
    metaTitle: 'Ruby Receptionist Pricing: Plans by Minutes',
    description: `Ruby's live receptionist plans, read from ruby.com on ${PRICES_CHECKED_LABEL}, with what per-minute billing costs and when an AI receptionist fits.`,
    tags: ['pricing', 'Ruby', 'answering service', 'virtual receptionist'],
    ctaLabel: 'Compare Ava vs Ruby side by side',
    ctaUrl: cta('/compare/ava-vs-ruby', 'ruby-receptionist-pricing'),
    blocks: [
      { type: 'p', text: `Ruby is a staffed virtual receptionist service: real people answer your calls. Plans are sold by the minute. These are the headline prices shown on ruby.com/plans-and-pricing on ${PRICES_CHECKED_LABEL}.` },
      { type: 'ul', items: [
        '$250 a month for 50 receptionist minutes.',
        '$395 a month for 100 minutes.',
        '$720 a month for 200 minutes.',
        '$1,725 a month for 500 minutes.',
      ] },
      { type: 'p', text: 'Ruby does not show its overage rate in the page text we could read, so ask Ruby what extra minutes cost before you sign up.' },
      { type: 'h2', text: 'What it works out to' },
      { type: 'p', text: 'On the 100-minute plan, Ruby works out to about $3.95 a receptionist minute. That buys a human voice, and for some offices that is worth it.' },
      { type: 'h2', text: 'Where Ruby is the better fit' },
      { type: 'p', text: 'If every caller must reach a person, or you need live call transfers to your team, a staffed service like Ruby fits better than an AI receptionist. Ava does not transfer calls live.' },
      { type: 'h2', text: 'Where an AI receptionist fits' },
      { type: 'p', text: 'If what you need is every call answered, the details taken, and the lead emailed to you, an AI receptionist covers more minutes for less. ' + AVA_PLANS_LINE },
      { type: 'p', text: 'Hear Ava answer as a made-up HVAC shop at (256) 952-4935.' },
    ],
  }),
  post({
    slug: 'ai-receptionist-cost',
    title: 'How Much Does an AI Receptionist Cost in 2026?',
    metaTitle: 'AI Receptionist Cost in 2026: Published Prices',
    description: `What AI receptionists cost, from published prices checked on ${PRICES_CHECKED_LABEL}: per-call, per-minute, per-customer and flat plans compared.`,
    tags: ['pricing', 'AI receptionist', 'small business'],
    ctaLabel: 'Try the answering service cost calculator',
    ctaUrl: cta('/tools/answering-service-cost-calculator', 'ai-receptionist-cost'),
    blocks: [
      { type: 'p', text: `AI receptionists are priced four different ways, which makes them hard to compare. Here is each model with real published prices, all read from the vendors' own pages on ${PRICES_CHECKED_LABEL}.` },
      { type: 'h2', text: 'Per call' },
      { type: 'p', text: 'Smith.ai AI receptionist: free for 25 calls, $150 for 75 calls, up to $800 for 500 calls. Quo (formerly OpenPhone) Sona: $25 for 40 calls, $49 for 100, $99 for 250, $199 for 600, on top of Quo per-user phone plans; Quo says calls under 15 seconds are free.' },
      { type: 'h2', text: 'Per minute' },
      { type: 'p', text: 'Rosie: $49 for 250 minutes, $149 for 1,000, $299 for 2,000 a month. My AI Front Desk: $99 a month, or $79 a month billed yearly, for 200 voice minutes, with prepaid credits for extra use.' },
      { type: 'h2', text: 'Per unique caller' },
      { type: 'p', text: 'Goodcall: $79 a month for 100 unique customers, $129 for 500, $299 for 2,000, with a per-customer charge past that.' },
      { type: 'h2', text: 'Flat plan with minutes and no overage' },
      { type: 'p', text: AVA_PLANS_LINE + ' Setup is done for you.' },
      { type: 'h2', text: 'How to compare' },
      { type: 'ol', items: [
        'Count last month’s missed and after-hours calls, and guess the average length.',
        'Price each option at that volume, including overage.',
        'Call each demo line and listen to how it handles a real problem from your trade.',
        'Ask who does the setup and what it costs.',
      ] },
      { type: 'p', text: 'Several tools above cost less than Ava at low volume. Ava’s pitch is setup done for you, trade-specific questions, a flat bill, and a demo line you can call: (256) 952-4935.' },
    ],
  }),
  post({
    slug: 'smith-ai-alternatives-for-home-services',
    title: 'Smith.ai Alternatives for Home-Service Shops',
    metaTitle: 'Smith.ai Alternatives for Home-Service Shops',
    description: `Five Smith.ai alternatives for HVAC, plumbing and roofing shops, with published prices checked ${PRICES_CHECKED_LABEL} and who each one fits.`,
    tags: ['Smith.ai', 'alternatives', 'home services', 'AI receptionist'],
    ctaLabel: 'See every comparison',
    ctaUrl: cta('/compare', 'smith-ai-alternatives-for-home-services'),
    blocks: [
      { type: 'p', text: `Smith.ai is a solid choice, especially if you want live humans. If you run a home-service shop and want something else, here are alternatives with prices from each vendor's own page, checked ${PRICES_CHECKED_LABEL}.` },
      { type: 'h2', text: 'Ruby' },
      { type: 'p', text: 'Staffed receptionists billed by the minute: $250 for 50 minutes up to $1,725 for 500. Best if every caller must reach a person.' },
      { type: 'h2', text: 'Goodcall' },
      { type: 'p', text: 'AI agent priced by unique callers: $79 for 100, $129 for 500, $299 for 2,000. Cheaper than Ava at low volume; you set it up yourself.' },
      { type: 'h2', text: 'Rosie' },
      { type: 'p', text: 'AI answering priced by minutes: $49 for 250, $149 for 1,000, $299 for 2,000. Low monthly price, self-serve setup.' },
      { type: 'h2', text: 'My AI Front Desk' },
      { type: 'p', text: '$99 a month ($79 billed yearly) for 200 voice minutes, with credits for extra use. Lots of settings for owners who like to tinker.' },
      { type: 'h2', text: 'Executive Receptionist (Ava)' },
      { type: 'p', text: AVA_PLANS_LINE + ' Ava is built around trade calls: she asks your no-heat, leak and storm questions, flags urgent calls at the top of the emailed summary, answers in Spanish when the caller does, and can book into your Desk calendar once your hours are set. Setup is done for you. She does not transfer calls live, and text alerts are not on yet.' },
      { type: 'p', text: 'Call the demo line at (256) 952-4935 and try a no-heat call.' },
    ],
  }),
  post({
    slug: 'missed-call-text-back-vs-ai-receptionist',
    title: 'Missed-Call Text Back vs an AI Receptionist',
    metaTitle: 'Missed-Call Text Back vs AI Receptionist',
    description: 'A missed-call text back sends a message after the caller is gone. An AI receptionist answers while they are still on the line. Here is when each fits.',
    tags: ['missed calls', 'text back', 'AI receptionist', 'home services'],
    ctaLabel: 'Hear Ava answer, from $1 the first month',
    ctaUrl: cta('/', 'missed-call-text-back-vs-ai-receptionist'),
    blocks: [
      { type: 'p', text: 'Missed-call text back is a simple idea: when you miss a call, the caller gets an automatic text saying you will get back to them. An AI receptionist picks up the call itself.' },
      { type: 'h2', text: 'What text back does well' },
      { type: 'ul', items: [
        'It is cheap and quick to turn on.',
        'It tells the caller you saw the call.',
        'Some callers prefer to text anyway.',
      ] },
      { type: 'h2', text: 'Where it falls short' },
      { type: 'ul', items: [
        'The caller has already hung up, and may already be dialing the next shop.',
        'You still don’t know the address or the problem until they reply.',
        'Business texting in the US needs carrier registration (10DLC) before it works reliably.',
      ] },
      { type: 'h2', text: 'What an AI receptionist adds' },
      { type: 'p', text: 'Ava answers while the caller is still on the line, says she is an AI receptionist, asks your questions, and emails you the name, number, address and problem, with urgent calls flagged first.' },
      { type: 'h2', text: 'Does Executive Receptionist text?' },
      { type: 'p', text: 'Not yet. Text confirmations are built but stay off until phone-carrier registration is approved. Today, every lead and confirmation goes by email, and calls are logged in your Desk.' },
      { type: 'p', text: AVA_PLANS_LINE },
      { type: 'p', text: 'Hear the difference yourself: call (256) 952-4935.' },
    ],
  }),
];
