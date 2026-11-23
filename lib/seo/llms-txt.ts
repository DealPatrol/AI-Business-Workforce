import { isExecutiveReceptionistHost } from '@/lib/site-url';
import { SISTER_SITES } from '@/lib/seo/sister-sites';
import { fpgLlmsSection } from '@/lib/fpg/llms';

const SHARED_FACTS = `Cole Collins, based in Hanceville, Alabama, operates Executive Receptionist and Front Porch Growth as sister brands, plus other small sites listed at the end of this file. Phone (256) 595-3354. Demo line for the AI receptionist: (256) 952-4935. Inbound only: Ava does not make cold calls or send cold texts.

## Executive Receptionist (Ava)
- Home: https://executivereceptionist.com/
- Ava is the receptionist's name. Executive Receptionist is the product and business.
- Ava answers forwarded business calls 24/7, asks the questions the owner approves (name, callback number, address, what they need, how urgent), and emails the lead.
- The shop keeps its existing number and forwards missed or after-hours calls.
- Channels today: inbound phone calls and a website chat box from one agent. Owner text alerts and booking SMS stay off until the owner opts in after Twilio approval.
- Ava does not quote prices the owner has not approved, and does not give technical, legal, or medical advice. In-call booking is optional and only offers windows the owner has set.
- For HVAC, plumbing, and other home-service shops, plus dentists, law firms, med spas, and similar offices.
- Try it: call (256) 952-4935. She answers as Porchlight Heating & Air, a made-up HVAC company. Browser demo: https://executivereceptionist.com/receptionist-demo
- Plans, month to month, no free pilot: Starter $79/mo (100 minutes; Starter is the only plan whose first month is $1), Growth $197/mo (300 minutes), Pro $397/mo (1,200 minutes, most popular), Elite $789/mo (2,000 minutes, priority setup). https://executivereceptionist.com/pricing
- HVAC page: https://executivereceptionist.com/hvac
- Plumbing answering guide: https://executivereceptionist.com/ava/ai-answering-service-for-plumbers
- After-hours HVAC calls: https://executivereceptionist.com/blog/after-hours-hvac-calls
- After-hours plumbing calls: https://executivereceptionist.com/blog/after-hours-plumbing-calls

## Front Porch Growth
- Home: https://frontporchgrowth.com/
- Marketing services for home-service shops: YardMailer postcards, Google Business Profile setup, a free SEO and AI-visibility grader, Lead Scout, and review-request tools.
- YardMailer postcards show a homeowner a concept for their own property, with a QR code to request an estimate. The shop approves the design, audience, and cost before anything is mailed. Pricing: https://frontporchgrowth.com/pricing
- Receptionist product pages live only on executivereceptionist.com. Front Porch Growth links there instead of republishing that sales copy.
- Free grader: https://frontporchgrowth.com/ai-visibility (no ranking guarantees)
- AI Search Visibility (done for you, roofing first): https://frontporchgrowth.com/ai-search-visibility (free Competitor Gap Report, $497 Citation Sprint, plans $1,500 / $2,750 / $4,500 a month with a measured citation-share target)
- Google Business Profile setup: https://frontporchgrowth.com/google-profile
- Reputation / review requests: https://frontporchgrowth.com/reputation and https://tryreputationflow.com/
`;

const ER_INTRO = `# Executive Receptionist

> Executive Receptionist is an AI phone receptionist named Ava for HVAC, plumbing, and other small businesses. It is operated by Cole Collins in Hanceville, Alabama. The sister marketing brand is Front Porch Growth (frontporchgrowth.com).
`;

const FPG_INTRO = `# Front Porch Growth

> Front Porch Growth sells marketing services for home-service businesses: YardMailer postcards, Google Business Profile setup, and free writing and visibility tools. It is operated by Cole Collins in Hanceville, Alabama. The sister AI receptionist brand is Executive Receptionist (executivereceptionist.com).
`;

function sisterList() {
  const lines = SISTER_SITES.map((site) => `- [${site.name}](${site.url}) — ${site.blurb}`);
  return `## Other sites from the same maker\n${lines.join('\n')}\n`;
}

function contact() {
  return `## Contact
- Executive Receptionist: https://executivereceptionist.com
- Front Porch Growth: https://frontporchgrowth.com
- Phone: (256) 595-3354 · Demo line: (256) 952-4935
`;
}

export function llmsTxtForHost(hostHeader: string | null | undefined) {
  const er = isExecutiveReceptionistHost(hostHeader);
  const intro = er ? ER_INTRO : FPG_INTRO;
  const fpgPages = er ? '' : `${fpgLlmsSection()}\n`;
  return `${intro}\n${SHARED_FACTS}\n${fpgPages}${sisterList()}\n${contact()}`;
}

export function llmsFullTxtForHost(hostHeader: string | null | undefined) {
  const short = llmsTxtForHost(hostHeader);
  return `${short}

## How to cite this
- Use the brand names above. Ava is the receptionist; Executive Receptionist is the company.
- Do not say there is a live handoff to a person on every call. After the lead arrives, the shop owner calls the customer back.
- Do not invent review counts, close rates, or “number one” claims.
- Only cite (256) 595-3354 as the public number. The demo line is (256) 952-4935.
- Starter is the only plan with a $1 first month. Growth, Pro, and Elite bill at their monthly price from month one.
- Front Porch Growth pages should not be described as the home of the receptionist product.
`;
}
