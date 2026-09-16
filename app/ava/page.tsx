import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Headphones, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import SalesAvaQualify from '@/components/SalesAvaQualify';

const plans = [
  { key:'starter', name:'Starter', price:'$59', minutes:'250 voice minutes / month', overage:'$0.25/min after included usage', description:'For smaller service businesses that want affordable 24/7 call coverage.', features:['Ava AI receptionist','24/7 answering','Lead qualification + summaries','Email lead notifications','Business-specific greeting & FAQs','Appointment booking'] },
  { key:'growth', name:'Growth', price:'$129', minutes:'650 voice minutes / month', overage:'$0.22/min after included usage', description:'For businesses that depend on steady inbound calls and estimates.', features:['Everything in Starter','More custom call flows','Multiple service types','Advanced lead qualification','Advanced routing'], featured:true },
  { key:'pro', name:'Pro', price:'$249', minutes:'1,300 voice minutes / month', overage:'$0.20/min after included usage', description:'For higher-volume teams that want a deeply customized front desk.', features:['Everything in Growth','Multiple call experiences','Advanced routing logic','Priority customization','Deeper business configuration'] },
];

const industryPages = [
  ['HVAC','/ava/ai-receptionist-hvac-companies','No-cool, no-heat, maintenance, replacement and after-hours calls.'],
  ['Plumbing','/ava/ai-receptionist-plumbers','Leaks, drains, water heaters and urgent plumbing intake.'],
  ['Roofing','/ava/ai-receptionist-roofers','Storm, leak, inspection and replacement estimate calls.'],
  ['Landscaping','/ava/ai-receptionist-landscapers','Mowing, cleanup and landscape project estimate leads.'],
  ['Contractors','/ava/ai-answering-service-contractors','General home-service answering and qualification.'],
  ['Missed Calls','/ava/missed-call-answering-home-services','Overflow and after-hours coverage for home-service teams.'],
];

export default function AvaPage() {
 return <main className="ava-sales">
  <nav className="ava-nav"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> Workforce AI</Link><div><a href="#talk-to-ava">Talk to Ava</a><a href="#how">How It Works</a><a href="#industries">Industries</a><a href="#pricing">Pricing</a></div><a className="nav-cta" href="#talk-to-ava">Talk to Ava</a></nav>
  <section className="sales-hero"><div className="hero-copy"><span className="kicker">OPTIONAL AI RECEPTIONIST ADD-ON</span><h1>Turn the calls your marketing creates into <em>qualified leads.</em></h1><p>Call Ava like your customers will. She&apos;ll ask the setup questions, then book a short call with Cole — or send you to checkout.</p><div className="hero-actions"><a className="sales-btn" href="#talk-to-ava"><PhoneCall size={18}/> Talk to Ava — she&apos;ll set up your receptionist</a><a className="sales-btn secondary" href="#pricing">See plans ($59 / $129 / $249) <ArrowRight size={18}/></a></div><div className="trust-row"><span><Check/> $0 setup fee</span><span><Check/> No long-term contract</span><span><Check/> Configured for your business</span></div></div><div className="hero-proof"><div className="proof-phone"><div className="phone-top"><span className="pulse"/><b>Incoming customer call</b><small>7:42 PM</small></div><div className="call-path"><span><PhoneCall/> Ava answers</span><span><Headphones/> Qualifies the request</span><span><ShieldCheck/> Sends the lead</span></div></div></div></section>

  <SalesAvaQualify />

  <section id="how" className="how-section"><div className="section-title"><span className="kicker">FROM MISSED CALL TO READY-TO-CALL LEAD</span><h2>Ava handles the front desk while you handle the work.</h2></div><div className="steps-grid"><article><span>01</span><PhoneCall/><h3>Customer calls</h3><p>Ava can cover after-hours, overflow, or broader call coverage.</p></article><article><span>02</span><Headphones/><h3>Ava qualifies them</h3><p>She captures the job, address, callback number, timing, and urgency.</p></article><article><span>03</span><ShieldCheck/><h3>You get the lead</h3><p>The conversation becomes a structured summary for your team to follow up.</p></article></div></section>
  <section id="industries" className="bad-options"><div className="section-title"><span className="kicker">BUILT AROUND YOUR TRADE</span><h2>See how Ava handles calls in your industry.</h2><p>Each trade has different urgency, intake questions, and booking needs. These guides show the specific call flow Ava can support.</p></div><div className="options-grid">{industryPages.map(([name,href,desc],i)=><article key={href}><span>0{i+1}</span><PhoneCall/><h3>{name}</h3><p>{desc}</p><Link href={href}>See {name} call flow <ArrowRight/></Link></article>)}</div></section>
  <section id="pricing" className="pricing"><div className="section-title"><span className="kicker">AVA PRICING · $0 SETUP</span><h2>Choose the call coverage that fits your business.</h2><p>Start without a setup charge. Each plan includes Ava configured for your business, with transparent included minutes and overage pricing.</p></div><div className="plan-grid">{plans.map(plan=><article className={plan.featured?'plan featured':'plan'} key={plan.key}>{plan.featured&&<span className="popular">MOST POPULAR</span>}<h3>{plan.name}</h3><p>{plan.description}</p><div className="price"><strong>{plan.price}</strong><span>/month</span></div><small>{plan.minutes}</small><small>{plan.overage}</small><ul>{plan.features.map(feature=><li key={feature}><Check/>{feature}</li>)}</ul><a className="plan-btn" href={`/api/checkout?plan=${plan.key}`}>Start {plan.name} — $0 setup</a></article>)}</div><p className="usage-note">Included minutes reset monthly. Usage above the included allowance is billed at the plan&apos;s published per-minute overage rate. Special telephony or integration requirements are quoted before launch.</p></section>
  <section className="final-cta"><span className="kicker">POSTCARDS STAY THE CORE OFFER</span><h2>Need more leads first?</h2><p>Go back to the main postcard campaign. Ava is available when you want someone answering the calls those campaigns create.</p><div><Link className="sales-btn light" href="/"><ArrowLeft/> Postcard Campaign</Link><a className="sales-btn outline" href="#talk-to-ava">Talk to Ava</a></div></section>
 </main>;
}
