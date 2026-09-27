'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Home, Mail, QrCode, Search, Sparkles, Target, WandSparkles } from 'lucide-react';
import { FOUNDING_PAYMENT_LINK } from '@/lib/payments';

const industries = ['Landscaping','Roofing','Pressure Washing','Exterior Painting','Fencing','Tree Service','Hardscaping','Outdoor Lighting'];
const serviceImages: Record<string, string> = {
  Landscaping: '/service-landscaping.png',
  Roofing: '/service-roofing.png',
  'Pressure Washing': '/service-pressure-washing.png',
  'Exterior Painting': '/service-exterior-painting.png',
  Fencing: '/service-fencing.png',
  'Tree Service': '/service-tree-service.png',
  Hardscaping: '/service-hardscaping.png',
  'Outdoor Lighting': '/service-outdoor-lighting.png',
};
const examples: Record<string,string[]> = {
  Landscaping:['6 compact evergreen shrubs','3 flowering hydrangeas','Seasonal color','Fresh mulch + bed edging'],
  Roofing:['Architectural shingles','New ridge cap','Updated roof vents','Matching flashing'],
  'Pressure Washing':['Driveway surface cleaning','Front walk cleaning','Curb treatment','Entry concrete brightening'],
  'Exterior Painting':['Updated body color','Contrasting trim','Front-door accent','Exterior prep + coating'],
  Fencing:['Privacy fence concept','Matching gate','Post + rail layout','Property-line finish'],
  'Tree Service':['Canopy thinning','Dead-limb removal','Crown shaping','Debris cleanup'],
  Hardscaping:['Paver walkway','Defined border','Decorative gravel','Planting accents'],
  'Outdoor Lighting':['Path lights','Facade uplighting','Feature-tree lighting','Entry lighting'],
};

export default function VisualCanvasserSales(){
 const [industry,setIndustry]=useState('Landscaping');
 return <main className="vc-page">
  <nav className="nav"><Link className="brand" href="/"><span className="logo"><Sparkles size={18}/></span> YardProof</Link><div className="navlinks"><a href="#how">How it works</a><a href="#example">Example</a><Link href="/property-demo">Project demo</Link><a href="#offer">Founding offer</a></div><a className="button small" href="#offer">Get My First Campaign</a></nav>
  <section className="vc-hero wrap"><div><div className="eyebrow">VISUAL CANVASSER FOR HOME-SERVICE BUSINESSES</div><h1>Don't just tell homeowners what you can do. <em>Show them.</em></h1><p className="lede">A managed, human-assisted service: Cole works with you to pick streets and properties, prepares a clearly labeled before-and-after project concept for each one, and helps turn it into a postcard with a QR code that sends the homeowner to a trackable estimate page.</p><div className="actions left-actions"><a className="button" href="#offer">Become a Founding Customer <ArrowRight size={18}/></a><a className="ghost" href="#example">See a campaign example</a></div><div className="proof vc-proof"><span><Check/> Personalized to the property</span><span><Check/> Built around your service</span><span><Check/> QR response tracking</span></div></div><div className="vc-mailer"><div className="vc-mail-photo"><span>AFTER CONCEPT</span><Image src={serviceImages.Landscaping} alt="Landscaped suburban front yard concept" width={700} height={520}/><b>Imagine this at your home.</b></div><div className="vc-mail-copy"><small>EXAMPLE · CREATED FOR ONE PROPERTY</small><h3>We had an idea for your front yard.</h3><p>Scan to see the concept, what's included, and request an estimate.</p><div className="vc-qr"><QrCode size={56}/><span>YOUR<br/>PROJECT</span></div></div></div></section>

  <section id="how" className="section vc-soft"><div className="wrap"><div className="sectionhead"><span>FROM PROSPECT TO ESTIMATE</span><h2>A smarter version of neighborhood canvassing.</h2><p>Instead of sending the same advertisement to everyone, the managed founding campaign builds outreach around the work you actually want to sell.</p></div><div className="vc-steps">{[[Search,'1','Target','Choose service areas and the kinds of jobs you want.'],[Home,'2','Concept','Prepare a clearly labeled yard project idea for campaign review.'],[WandSparkles,'3','Explain','Show the improvements, materials and project scope represented.'],[Mail,'4','Approve','Review the postcard before anything is sent.'],[QrCode,'5','Track','A unique QR page captures interest and estimate requests.'],[Target,'6','Follow up','Estimate requests land in your inbox so you can follow up.']].map(([Icon,n,t,d]:any)=><article key={n}><span>{n}</span><Icon size={22}/><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>

  <section id="example" className="section wrap"><div className="sectionhead"><span>INTERACTIVE EXAMPLE</span><h2>One approach. Different home-service businesses.</h2><p>Choose a service to see an illustrative before-and-after example. Founding campaigns are prepared and reviewed with you; this is not a live address lookup.</p></div><div className="vc-tabs">{industries.map(x=><button type="button" key={x} onClick={()=>setIndustry(x)} className={industry===x?'active':''}>{x}</button>)}</div><div className="vc-demo"><div className="vc-before"><small>PROPERTY TODAY · EXAMPLE</small><div className="vc-service-image-frame"><Image className="vc-service-image" src={serviceImages[industry]} alt={`Illustrative current property view for ${industry.toLowerCase()}`} width={1200} height={700} priority={industry === 'Landscaping'} sizes="(max-width: 800px) 100vw, 25vw"/></div><b>Current property view</b><p>Authorized/current imagery is used when available. We do not represent unavailable property imagery as live.</p></div><div className="vc-arrow"><ArrowRight/></div><div className="vc-after"><small>{industry.toUpperCase()} CONCEPT · EXAMPLE</small><div className="vc-service-image-frame"><Image className="vc-service-image" src={serviceImages[industry]} alt={`Illustrative proposed ${industry.toLowerCase()} improvement`} width={1200} height={700} sizes="(max-width: 800px) 100vw, 25vw"/></div><b>Realistic proposed improvement</b><ul>{examples[industry].map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul></div><div className="vc-scope"><small>WHAT THE HOMEOWNER SEES</small><h3>Your personalized project idea</h3><p>A concise explanation of the visible changes, plus a QR code to explore the project and request an estimate.</p><div className="vc-qr big"><QrCode size={70}/></div><Link className="button" href="/property/35077">Preview Estimate Page</Link></div></div></section>

  <section className="dark vc-difference"><div className="wrap split"><div><div className="tag">WHY THIS IS DIFFERENT</div><h2>Generic postcards advertise.<br/><em>This starts a conversation.</em></h2><p>The homeowner receives a project idea tied to the campaign you approved. When they scan, the QR page gives them a direct way to request an estimate.</p></div><div className="vc-stack"><div><b>1</b><span>Campaign-specific creative</span></div><div><b>2</b><span>Service-specific scope</span></div><div><b>3</b><span>Personalized QR destination</span></div><div><b>4</b><span>Estimate-request inbox</span></div></div></div></section>

  <section id="offer" className="section wrap vc-offer"><div><span className="eyebrow">FOUNDING CUSTOMER CAMPAIGN</span><h2>Be one of the first businesses we build this for.</h2><p>We're onboarding a small number of home-service businesses while we finish automating the complete workflow. Your first campaign is delivered as a managed service and helps shape the production product.</p><div className="vc-honesty"><b>What “founding customer” means</b><p>Live today: unique QR pages, scan tracking and your estimate-request inbox. Choosing properties, property photos, “after” concept images and printing/mailing are done by hand with you (sometimes with AI-assisted drafts that a person reviews). We will not claim an external data source, supplier catalog, mailing integration, or property-image source is automated until it is actually connected and tested.</p></div></div><div className="vc-price"><small>FIRST CAMPAIGN</small><h3>$299</h3><p>Founding-customer launch package</p><ul><li><Check/> Target campaign setup</li><li><Check/> Up to 25 property concepts*</li><li><Check/> Personalized postcard creative</li><li><Check/> Unique QR project-page structure</li><li><Check/> QR scan tracking + estimate-request inbox</li><li><Check/> Campaign review before launch</li></ul><a className="button full" href={FOUNDING_PAYMENT_LINK}>Pay $299 — Start My Founding Campaign <ArrowRight size={18}/></a><small className="vc-note">*Final mailed quantity and any printing/postage/property-data costs are confirmed before campaign launch. No unapproved pass-through costs.</small></div></section>

  <section className="vc-final"><div className="wrap"><h2>Your next customer may already be driving past the project you could have sold them.</h2><p>Show the right homeowner what their property could become.</p><a className="button" href={FOUNDING_PAYMENT_LINK}>Start a Visual Canvasser Campaign <ArrowRight size={18}/></a></div></section>
 </main>
}
