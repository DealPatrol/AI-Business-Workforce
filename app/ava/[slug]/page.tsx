import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';

const base = 'https://ai-business-workforce.vercel.app';

type PageData = {
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  audience: string;
  pain: string;
  hero: string;
  calls: string[];
  qualification: string[];
  useCases: string[];
  faq: Array<[string,string]>;
};

const pages: Record<string, PageData> = {
  'ai-receptionist-hvac-companies': {
    title: 'AI Receptionist for HVAC Companies',
    metaTitle: 'AI Receptionist for HVAC Companies | Ava',
    description: 'Ava answers HVAC calls 24/7, captures no-cool and no-heat requests, qualifies replacement and repair leads, and sends your team a clean callback summary.',
    eyebrow: 'AI RECEPTIONIST FOR HVAC COMPANIES',
    audience: 'HVAC contractors and heating & cooling teams',
    pain: 'Peak-season calls arrive while technicians are driving, on ladders, in crawlspaces, or already on another job. A missed no-cool or no-heat call can become your competitor’s booked service call.',
    hero: 'Answer more HVAC calls without adding another person to the office.',
    calls: ['No cooling / no heat calls','Repair vs replacement inquiries','Tune-up and maintenance requests','After-hours emergency requests','Estimate and financing questions'],
    qualification: ['Customer name and callback number','Service address','System problem and urgency','Repair, maintenance, or replacement intent','Preferred appointment timing'],
    useCases: ['After-hours overflow','Summer and winter call surges','One-to-five truck shops','Owner-operators who cannot stop mid-job'],
    faq: [
      ['Can Ava handle emergency HVAC calls?','Ava can identify urgent language, collect the right details, and follow the escalation rules you define. Life-safety situations should always follow your human emergency policy.'],
      ['Can Ava book HVAC estimates?','Yes. Ava can collect the information needed for an estimate request and can be configured around your booking or callback workflow.'],
      ['Does Ava replace ServiceTitan or Housecall Pro?','No. Ava is designed to handle the call layer. It can sit beside your current field-service workflow rather than forcing a full software replacement.']
    ]
  },
  'ai-receptionist-plumbers': {
    title: 'AI Receptionist for Plumbers',
    metaTitle: 'AI Receptionist for Plumbing Companies | Ava',
    description: 'Ava answers plumbing calls 24/7, captures leak and drain details, triages urgency, qualifies jobs, and sends your team structured lead information.',
    eyebrow: 'AI RECEPTIONIST FOR PLUMBERS',
    audience: 'plumbing companies and owner-operators',
    pain: 'Plumbing leads are often urgent. If a homeowner with a burst pipe, clogged drain, or failed water heater reaches voicemail, they usually keep calling until someone answers.',
    hero: 'Turn more plumbing calls into qualified jobs instead of voicemails.',
    calls: ['Leaks and active water issues','Clogged drains and sewer calls','Water heater repair or replacement','Fixture installation','Emergency and after-hours requests'],
    qualification: ['Caller contact information','Property address','What is leaking or blocked','Whether water can be shut off','Urgency and preferred timing'],
    useCases: ['Emergency overflow','Night and weekend calls','Small plumbing shops','Dispatch intake before a human callback'],
    faq: [
      ['Can Ava tell the difference between an emergency and routine plumbing call?','Ava can ask urgency questions you define and flag situations such as active flooding for immediate escalation.'],
      ['Can Ava collect enough details for dispatch?','Yes. Ava can capture the issue, address, callback number, timing, and other fields you want your dispatcher to receive.'],
      ['Can customers still reach a person?','Yes. Your call rules can include transfer or escalation paths for specific situations.']
    ]
  },
  'ai-receptionist-roofers': {
    title: 'AI Receptionist for Roofing Companies',
    metaTitle: 'AI Receptionist for Roofers | Ava',
    description: 'Ava helps roofing companies answer estimate, storm-damage, leak, and replacement calls 24/7 and capture the information needed for fast follow-up.',
    eyebrow: 'AI RECEPTIONIST FOR ROOFING COMPANIES',
    audience: 'roofing contractors and storm-response teams',
    pain: 'Roofing sales are high value, but crews and owners spend most of the day away from a desk. Storms can create sudden bursts of inbound calls that are hard to answer fast enough.',
    hero: 'Capture more roofing estimates when the phone spikes after a storm.',
    calls: ['Roof leak requests','Storm and hail damage inquiries','Replacement estimates','Insurance-related callbacks','Gutter and exterior add-on requests'],
    qualification: ['Name and callback number','Property address','Leak, storm, or replacement reason','Roof type when known','Preferred inspection timing'],
    useCases: ['Storm-call surges','Lead intake during inspections','After-hours estimate capture','Multi-crew roofing companies'],
    faq: [
      ['Can Ava handle storm surges?','Ava can handle inbound qualification consistently so your team gets structured lead details instead of a pile of voicemails.'],
      ['Can Ava ask insurance-related questions?','Yes, you can define the intake questions Ava should ask. She should not give insurance or legal advice.'],
      ['Can Ava route urgent leak calls differently?','Yes. You can create a separate escalation path for active leaks or other priority calls.']
    ]
  },
  'ai-receptionist-landscapers': {
    title: 'AI Receptionist for Landscaping Companies',
    metaTitle: 'AI Receptionist for Landscapers | Ava',
    description: 'Ava answers landscaping calls, qualifies mowing and project leads, captures property details, and helps crews stop losing estimates while they are working.',
    eyebrow: 'AI RECEPTIONIST FOR LANDSCAPERS',
    audience: 'landscaping, lawn care, and outdoor-service businesses',
    pain: 'Landscapers are usually on equipment, driving, quoting, or working with a crew when new leads call. Returning a voicemail hours later often means the homeowner already found someone else.',
    hero: 'Keep the crew working while Ava handles the first conversation.',
    calls: ['Lawn care and mowing inquiries','Landscape installation estimates','Cleanup and hedge work','Drainage and hardscape requests','Recurring maintenance leads'],
    qualification: ['Name and phone number','Property address or service area','Requested service','Project timing','Estimate intent and urgency'],
    useCases: ['Owner-operated lawn businesses','Crews that cannot answer equipment-side','Seasonal estimate surges','After-hours lead capture'],
    faq: [
      ['Can Ava qualify landscaping projects?','Yes. Ava can ask what service is needed, capture the property address, timing, and project notes before you call back.'],
      ['Can Ava handle recurring mowing leads?','Yes. You can give Ava separate question flows for recurring lawn service and one-time projects.'],
      ['Can Ava work with my current phone number?','Ava can be used with supported forwarding and telephony setups so you can keep your existing customer-facing number.']
    ]
  },
  'ai-answering-service-contractors': {
    title: 'AI Answering Service for Contractors',
    metaTitle: 'AI Answering Service for Contractors | Ava',
    description: 'Ava is a 24/7 AI answering service for contractors that captures leads, qualifies job requests, routes urgent calls, and sends structured call summaries.',
    eyebrow: 'AI ANSWERING SERVICE FOR CONTRACTORS',
    audience: 'home-service contractors and field teams',
    pain: 'Contractors rarely work next to a desk phone. Every missed call creates a chance for the customer to hire the next company that answers.',
    hero: 'A contractor answering service built around jobs, estimates, and callbacks.',
    calls: ['New estimate requests','Existing customer questions','Urgent service requests','After-hours calls','Scheduling and callback requests'],
    qualification: ['Who is calling','What service they need','Where the job is','How urgent it is','When they want service'],
    useCases: ['HVAC','Plumbing','Roofing','Landscaping','Fencing and exterior services','Other appointment-based home services'],
    faq: [
      ['How is Ava different from voicemail?','Voicemail waits for the caller to leave whatever they remember. Ava actively asks the qualification questions your team needs.'],
      ['How is Ava different from a call center?','Ava uses a consistent business-specific call flow and can cost far less than staffing or outsourced human coverage.'],
      ['Can Ava cover only missed calls?','Yes. Many contractors use AI reception as overflow, after-hours, or unanswered-call coverage rather than replacing every live call.']
    ]
  },
  'missed-call-answering-home-services': {
    title: 'Missed-Call Answering for Home Service Businesses',
    metaTitle: 'Missed Call Answering for Home Services | Ava',
    description: 'Stop sending ready-to-buy home-service leads to voicemail. Ava answers missed and after-hours calls, qualifies the job, and sends the details to your team.',
    eyebrow: 'MISSED-CALL ANSWERING FOR HOME SERVICES',
    audience: 'home-service businesses that lose leads to voicemail',
    pain: 'The highest-intent homeowner is often the one calling right now. If the call rolls to voicemail, the next action is frequently another Google result and another contractor.',
    hero: 'Turn missed calls into ready-to-follow-up leads.',
    calls: ['Calls while crews are working','After-hours inquiries','Busy-line overflow','Weekend calls','Estimate requests during peak season'],
    qualification: ['Contact information','Service requested','Property location','Urgency','Best callback or booking time'],
    useCases: ['Overflow coverage','After-hours coverage','Small teams without office staff','Seasonal demand spikes'],
    faq: [
      ['Do I have to let Ava answer every call?','No. You can use Ava only when you do not answer, after hours, or during busy periods.'],
      ['What happens after Ava answers?','Ava follows your intake rules, captures the job details, and sends a structured lead summary to your team.'],
      ['Is there a setup fee?','Current Ava plans start at $59 per month with no setup fee.']
    ]
  }
};

export function generateStaticParams() {
  return Object.keys(pages).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  const url = `${base}/ava/${slug}`;
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: url },
    keywords: [page.title.toLowerCase(), 'AI receptionist home services', 'AI answering service contractors', '24/7 call answering'],
    openGraph: { title: page.metaTitle, description: page.description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title: page.metaTitle, description: page.description },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  const url = `${base}/ava/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    serviceType: 'AI receptionist and call answering service',
    provider: { '@type': 'Organization', name: 'Workforce AI', url: base },
    audience: { '@type': 'BusinessAudience', audienceType: page.audience },
    url,
    offers: { '@type': 'Offer', price: '59', priceCurrency: 'USD', description: 'Ava Starter begins at $59 per month with no setup fee.' },
  };

  return <main className="ava-sales">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <nav className="ava-nav"><Link className="ava-brand" href="/ava"><span><Sparkles size={17}/></span> Ava</Link><div><Link href="/ava#pricing">Pricing</Link><Link href="/receptionist-demo#live-demo">Live Demo</Link></div><Link className="nav-cta" href="/receptionist-demo#live-demo">Try Ava Live</Link></nav>

    <section className="sales-hero"><div className="hero-copy"><span className="kicker">{page.eyebrow}</span><h1>{page.hero}</h1><p>{page.pain}</p><div className="hero-actions"><Link className="sales-btn" href="/receptionist-demo#live-demo"><PhoneCall size={18}/> Try Ava live</Link><Link className="sales-btn secondary" href="/ava#pricing">See plans from $59 <ArrowRight size={18}/></Link></div><div className="trust-row"><span><Check/> $0 setup fee</span><span><Check/> 24/7 coverage</span><span><Check/> Built for service calls</span></div></div><div className="hero-proof"><div className="proof-phone"><div className="phone-top"><span className="pulse"/><b>Incoming customer call</b><small>After hours</small></div><div className="call-path"><span><PhoneCall/> Ava answers</span><span><ShieldCheck/> Qualifies the job</span><span><Check/> Your team gets the details</span></div></div></div></section>

    <section className="how-section"><div className="section-title"><span className="kicker">CALLS AVA CAN HANDLE</span><h2>Built around the calls that matter to {page.audience}.</h2></div><div className="steps-grid">{page.calls.slice(0,3).map((item,i)=><article key={item}><span>0{i+1}</span><PhoneCall/><h3>{item}</h3><p>Ava follows the call flow and qualification rules you approve.</p></article>)}</div></section>

    <section className="comparison"><div className="section-title"><span className="kicker">WHAT AVA CAPTURES</span><h2>Give your team more than a voicemail.</h2><p>Each call can be turned into a structured lead with the details needed for a useful callback.</p></div><div className="comparison-grid"><article><small>QUALIFICATION</small><h3>Job details your team can use</h3><ul>{page.qualification.map(item=><li key={item}><Check/>{item}</li>)}</ul></article><article><small>BEST FIT</small><h3>Where this works especially well</h3><ul>{page.useCases.map(item=><li key={item}><Check/>{item}</li>)}</ul></article></div></section>

    <section className="pricing"><div className="section-title"><span className="kicker">SIMPLE ENTRY PRICE</span><h2>Start at $59/month with no setup fee.</h2><p>Starter includes 250 voice minutes per month. Growth and Pro add more capacity and deeper call-flow options.</p></div><div className="hero-actions" style={{justifyContent:'center'}}><Link className="sales-btn" href="/ava#pricing">Compare Ava plans <ArrowRight size={18}/></Link><Link className="sales-btn secondary" href="/receptionist-demo#live-demo">Try the live demo</Link></div></section>

    <section className="bad-options"><div className="section-title"><span className="kicker">COMMON QUESTIONS</span><h2>What businesses ask before trying Ava.</h2></div><div className="options-grid">{page.faq.map(([q,a],i)=><article key={q}><span>0{i+1}</span><h3>{q}</h3><p>{a}</p></article>)}</div></section>

    <section className="final-cta"><span className="kicker">TRY IT BEFORE YOU BUY IT</span><h2>Hear how Ava would handle your next call.</h2><p>Use the live demo, then choose a plan only if the call experience makes sense for your business.</p><div><Link className="sales-btn light" href="/receptionist-demo#live-demo"><PhoneCall/> Try Ava Live</Link><Link className="sales-btn outline" href="/ava#pricing">View Pricing</Link></div></section>
  </main>;
}
