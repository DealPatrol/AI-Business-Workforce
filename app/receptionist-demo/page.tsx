'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  DollarSign,
  Headphones,
  Loader2,
  MessageSquare,
  Mic2,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Voicemail,
  Wrench,
} from 'lucide-react';
import { FOUNDING_PAYMENT_LINK } from '@/lib/payments';

type CallState='idle'|'preparing'|'ready'|'connecting'|'connected'|'ending'|'processing';
type TextMessage={from:'ava'|'visitor';text:string};

const textPrompts=[
 'What name and phone number should your receptionist capture?',
 'What property address or service area should she ask for?',
];

const plans=[
 {name:'Starter',price:'99',desc:'A simple 24/7 receptionist for smaller service businesses.',minutes:'150 voice minutes / month',items:['One Ava receptionist','Lead capture + summaries','Email lead notifications','Business-specific greeting & FAQs'],cta:'Start Starter'},
 {name:'Growth',price:'249',desc:'For businesses that rely on the phone for steady new jobs.',minutes:'500 voice minutes / month',items:['Everything in Starter','More custom call flows','Multiple service types','Priority setup changes','Advanced lead qualification'],cta:'Choose Growth',featured:true},
 {name:'Pro',price:'499',desc:'For higher-volume teams that want a deeply customized front desk.',minutes:'1,200 voice minutes / month',items:['Everything in Growth','Multiple call experiences','Advanced routing logic','Priority support','Deeper business customization'],cta:'Choose Pro'}
];

function ReceptionistDemoContent(){
 const [industry,setIndustry]=useState('Landscaping');
 const [business,setBusiness]=useState('Your Business');
 const [error,setError]=useState('');
 const [callState,setCallState]=useState<CallState>('preparing');
 const [savedMessage,setSavedMessage]=useState('');
 const [textMode,setTextMode]=useState(false);
 const [textInput,setTextInput]=useState('');
 const [textStep,setTextStep]=useState(0);
 const [textMessages,setTextMessages]=useState<TextMessage[]>([{from:'ava',text:`Hi, thanks for calling ${business}. How can I help today?`}]);
 const conversationId=useRef<string|null>(null);
 const signedUrl=useRef<string|null>(null);
 const preparedConversationId=useRef<string|null>(null);

 const conversation=useConversation({
  onConnect:()=>{setError('');setCallState('connected')},
  onDisconnect:()=>{setCallState(s=>s==='processing'?s:'ready')},
  onError:(m:any)=>{setError(typeof m==='string'?m:'Ava could not continue the call.');setCallState(s=>s==='processing'?s:'ready')}
 });

 async function prepareSession(){
  setCallState('preparing'); setError('');
  try{
   const started=performance.now();
   const res=await fetch('/api/ava/elevenlabs',{cache:'no-store'});
   const data=await res.json();
   console.info('[Ava timing] signed session',Math.round(performance.now()-started),'ms');
   if(!res.ok||!data.signedUrl) throw new Error(data?.error||data?.next||'Could not prepare Ava.');
   signedUrl.current=data.signedUrl;
   preparedConversationId.current=data.conversationId||null;
   setCallState('ready');
  }catch{
   setError('');
   setTextMode(true);
   setCallState('idle');
  }
 }
 useEffect(()=>{prepareSession()},[]);

 const active=callState==='connected'||conversation.status==='connected';
 const ending=callState==='ending';

 async function startCall(){
  if(!['ready','idle'].includes(callState)) return;
  setSavedMessage(''); setError(''); setCallState('connecting');
  const clickStart=performance.now();
  try{
   if(!signedUrl.current){await prepareSession(); if(!signedUrl.current)throw new Error('Ava is still preparing. Try once more.')}
   const micStart=performance.now();
   await navigator.mediaDevices.getUserMedia({audio:true});
   console.info('[Ava timing] mic permission',Math.round(performance.now()-micStart),'ms');
   conversationId.current=preparedConversationId.current;
   const sessionStart=performance.now();
   await conversation.startSession({signedUrl:signedUrl.current!,dynamicVariables:{business_name:business||'Your Business',business_type:industry}});
   console.info('[Ava timing] ElevenLabs connect',Math.round(performance.now()-sessionStart),'ms','total click',Math.round(performance.now()-clickStart),'ms');
   signedUrl.current=null; preparedConversationId.current=null; setCallState('connected');
  }catch(e:any){
   if(e?.name==='NotFoundError'||e?.name==='DevicesNotFoundError'){
    setError('');setTextMode(true);setCallState('ready');return;
   }
   setError(e?.message||'Unable to start Ava.');setCallState('ready')
  }
 }
 function startTextPreview(){
  setError('');
  setTextMode(true);
  setTextStep(0);
  setTextMessages([{from:'ava',text:`Hi, thanks for contacting ${business||'your business'}. How can I help today?`}]);
 }
 function sendTextMessage(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  const message=textInput.trim();
  if(!message)return;
  const nextStep=textStep+1;
  const reply=nextStep<=textPrompts.length
   ?textPrompts[nextStep-1]
   :'Thanks — I have the details a receptionist would capture. In a configured Ava workflow, this summary is reviewed and routed to your team.';
  setTextMessages(messages=>[...messages,{from:'visitor',text:message},{from:'ava',text:reply}]);
  setTextInput('');
  setTextStep(nextStep);
 }
 async function captureLead(){
  const id=conversationId.current;if(!id)return;setCallState('processing');
  for(let i=0;i<8;i++){
   await new Promise(r=>setTimeout(r,i===0?1500:2500));
   const r=await fetch(`/api/ava/conversation?conversationId=${encodeURIComponent(id)}`,{cache:'no-store'});
   if(r.status===202)continue;
   const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not process Ava conversation.');
   const save=await fetch('/api/ava/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:id,businessName:business,businessType:industry,name:d.lead?.name,phone:d.lead?.phone,serviceJobType:d.lead?.serviceJobType,address:d.lead?.address,intentUrgency:d.lead?.intentUrgency,summary:d.summary,transcript:d.transcript})});
   const s=await save.json();if(!save.ok)throw new Error(s.error||'Could not save lead.');
   setSavedMessage(s.notification?.sent?'Lead saved and email notification sent.':'Lead saved for follow-up.');conversationId.current=null;await prepareSession();return;
  }
  throw new Error('ElevenLabs is still processing the call. The lead was not saved yet.')
 }
 async function endCall(){
  if(!active||ending)return;setCallState('ending');setError('');
  try{await conversation.endSession();await captureLead()}
  catch(e:any){setError(e?.message||'Call ended, but lead capture needs attention.');await prepareSession()}
 }

 return <main className="ava-sales">
  <nav className="ava-nav">
   <Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> YardProof</Link>
   <div><a href="#hear-ava">Hear Ava</a><a href="#how">How It Works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
   <a className="nav-cta" href="#live-demo">Try Ava Live</a>
  </nav>

  <section className="sales-hero">
   <div className="hero-copy">
    <span className="kicker">MANAGED AI RECEPTIONIST · ALABAMA + THE SOUTHEAST</span>
    <h1>Stop losing jobs because <em>nobody answered.</em></h1>
    <p>Ava answers 24/7 for Alabama and Southeast home-service teams—qualifies the job, captures the address and urgency, then sends a clean lead. We set her up with you. Not another DIY app.</p>
    <div className="hero-actions">
     <a className="sales-btn" href="#live-demo"><PhoneCall size={18}/> Try Ava live</a>
     <a className="sales-btn secondary" href="#hear-ava"><Play size={18}/> Hear sample call</a>
     <a className="sales-btn text-link" href={FOUNDING_PAYMENT_LINK}>Book founding setup <ArrowRight size={18}/></a>
    </div>
    <div className="trust-row"><span><Check/> Human-led setup</span><span><Check/> Trade-specific qualification</span><span><Check/> Plans published below</span></div>
   </div>
   <div className="hero-proof"><div className="proof-phone"><div className="phone-top"><span className="pulse"/><b>Incoming customer call</b><small>7:42 PM</small></div><div className="caller"><UserRound/><div><b>Potential Customer</b><span>Needs an estimate</span></div></div><div className="call-path"><span><Phone/> Ava answers</span><span><Headphones/> Captures address + urgency</span><span><BellRing/> Sends a clean lead</span></div><div className="proof-result"><CheckCircle2/><div><small>NEW QUALIFIED LEAD</small><b>Estimate requested for Friday</b></div></div></div></div>
  </section>

  <section className="logo-strip"><span>Built for Southeast trades:</span><b>Landscaping</b><b>Roofing</b><b>HVAC</b><b>Plumbing</b><b>Fencing</b><b>Home Services</b></section>

  <section id="hear-ava" className="sample-section">
   <div className="sample-copy"><span className="kicker">HEAR THE ACTUAL EXPERIENCE</span><h2>Sample landscaping estimate call</h2><p>Hear how Ava greets a homeowner, asks useful qualification questions, and keeps the conversation moving. No stock voice montage or invented customer story.</p><div className="sample-tags"><span><Check/> Estimate intent</span><span><Check/> Property details</span><span><Check/> Clear next step</span></div></div>
   <div className="audio-card"><div className="audio-icon"><Headphones/></div><div><b>Ava sample call</b><span>Landscaping estimate · prerecorded example</span></div><audio controls preload="metadata"><source src="/ava-sample-call.mp4" type="audio/mp4"/>Your browser does not support audio playback.</audio></div>
  </section>

  <section className="bad-options">
   <div className="section-title"><span className="kicker">THE CALL STILL HAS TO GO SOMEWHERE</span><h2>Three bad options—and a better fourth path.</h2><p>When you are driving, quoting, or on the tools, every ring forces the same choice.</p></div>
   <div className="options-grid">
    <article><span>01</span><Wrench/><h3>Answer it yourself</h3><p>Stop the job, miss the details, and split your attention every time the phone rings.</p></article>
    <article><span>02</span><Voicemail/><h3>Send it to voicemail</h3><p>Make a ready-to-buy homeowner leave a message while they call the next company.</p></article>
    <article><span>03</span><DollarSign/><h3>Pay for a call center</h3><p>Buy costly coverage without a transparent, trade-specific setup you can test first.</p></article>
    <article className="better-option"><span>04</span><Sparkles/><h3>Put Ava on the line</h3><p>We build and test a receptionist around your services, questions, and handoff rules.</p><a href="#live-demo">Try the fourth path <ArrowRight/></a></article>
   </div>
  </section>

  <section id="live-demo" className="demo-shell">
   <div className="demo-copy"><span className="kicker">DON&apos;T TAKE OUR WORD FOR IT</span><h2>Call your AI receptionist before you buy her.</h2><p>Enter your business name and industry. Ava will answer like she&apos;s already part of your team.</p><ul><li><Check/> Ask her for an estimate</li><li><Check/> Give her your name, phone and address</li><li><Check/> Interrupt her or change your mind</li><li><Check/> See the lead appear after the call</li></ul><p className="demo-note"><ShieldCheck/> Live AI voice demo. Ava identifies herself as an AI receptionist during the call.</p></div>
   <div className="live-card">
    <div className="ai-disclosure"><Sparkles/> Live AI receptionist demo</div>
    <div className="ava-head"><div className="avatar"><UserRound size={38}/><i/></div><div><h3>Ava</h3><p>AI Receptionist · {active?'Live now':textMode?'Text preview':callState==='preparing'?'Preparing':callState==='ready'?'Ready':callState==='connecting'?'Connecting':callState==='processing'?'Saving lead':'Ready'}</p></div></div>
    <label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} disabled={active||callState==='connecting'}/></label>
    <label>Business type<select value={industry} onChange={e=>setIndustry(e.target.value)} disabled={active||callState==='connecting'}><option>Landscaping</option><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Pressure Washing</option><option>Fencing</option></select></label>
    {textMode?<div className="text-preview"><div className="text-messages" aria-live="polite">{textMessages.map((message,index)=><p className={message.from} key={`${message.from}-${index}`}>{message.text}</p>)}</div>{textStep<=textPrompts.length?<form onSubmit={sendTextMessage}><input aria-label="Reply to Ava" value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Type your reply…"/><button type="submit" aria-label="Send reply"><Send/></button></form>:<Link className="text-next" href="/founding?interest=ava">Build Ava for my business <ArrowRight/></Link>}<button className="text-switch" type="button" onClick={()=>setTextMode(false)}><Mic2/> Try voice instead</button><small>Guided AI text preview — no microphone or account required.</small></div>:<>{active?<button className="talk-btn hangup" onClick={endCall} disabled={ending}>{ending?<><Loader2 className="spin"/> Ending Call...</>:<><PhoneOff/> End Call</>}</button>:<button className="talk-btn" onClick={startCall} disabled={callState==='preparing'||callState==='connecting'||callState==='processing'}>{callState==='preparing'?<><Loader2 className="spin"/> Preparing Ava...</>:callState==='connecting'?<><Loader2 className="spin"/> Connecting...</>:callState==='processing'?<><Loader2 className="spin"/> Saving Lead...</>:<><Mic2/> Talk to Ava Live</>}</button>}<button className="text-fallback" type="button" onClick={startTextPreview}><MessageSquare/> No microphone? Use text</button><small>{active?(conversation.isSpeaking?'Ava is speaking…':'Ava is listening…'):savedMessage||'No credit card. Try a real AI conversation.'}</small>{error&&<p className="call-error">{error}</p>}</>}
   </div>
  </section>

  <section className="comparison">
   <div className="section-title"><span className="kicker">KNOW WHAT YOU&apos;RE BUYING</span><h2>Not bargain DIY software. Not a black-box call center.</h2><p>You can buy a $49 tool and configure it yourself. Or we stand up Ava for your trucks, test her with you, and you stay on the tools.</p></div>
   <div className="comparison-grid"><article><small>$10–$49 DIY AI APPS</small><h3>You build and babysit it</h3><p>Lower sticker price, but you write the prompts, map every call flow, test edge cases, and troubleshoot changes.</p></article><article className="ava-choice"><small>AVA · MANAGED + PUBLISHED PLANS</small><h3>We build it with you</h3><p>Trade-specific qualification, human setup, a live test before launch, and clear monthly plans starting at $99.</p></article><article><small>HUMAN ANSWERING SERVICES</small><h3>Higher cost, less control</h3><p>Useful human coverage, often at $300+ per month, but service details and pricing can be harder to evaluate before buying.</p></article></div>
  </section>

  <section id="how" className="how-section"><div className="section-title"><span className="kicker">FROM RING TO READY-TO-CALL LEAD</span><h2>Ava handles the front desk while you handle the work.</h2></div><div className="steps-grid"><article><span>01</span><PhoneCall/><h3>Customer calls</h3><p>Ava answers immediately—even after hours, while you're on a job, or when your team is busy.</p></article><article><span>02</span><Headphones/><h3>Ava qualifies them</h3><p>She learns what they need, where the job is, how urgent it is and what should happen next.</p></article><article><span>03</span><BellRing/><h3>You get the lead</h3><p>The call becomes a structured summary with the customer details delivered to your dashboard and inbox.</p></article><article><span>04</span><DollarSign/><h3>You close the job</h3><p>You follow up with a customer who has already explained what they need—without listening to voicemail.</p></article></div></section>

  <section className="playbooks"><div className="section-title"><span className="kicker">ALABAMA HOME-SERVICE PLAYBOOKS</span><h2>Qualification that sounds like your kind of business.</h2><p>The questions and escalation rules are configured for your services—not copied from a generic software template.</p></div><div className="playbook-grid"><article><AlertTriangle/><small>HVAC EMERGENCY</small><h3>Find out what cannot wait</h3><p>Capture cooling or heating status, system symptoms, address, callback number, and urgency before following your escalation rule.</p></article><article><Wrench/><small>LANDSCAPING ESTIMATE</small><h3>Make the walkthrough productive</h3><p>Ask about the property, requested work, service area, timing, and estimate expectations so your callback starts with context.</p></article><article><Clock3/><small>AFTER-HOURS CALL</small><h3>Separate urgent from tomorrow</h3><p>Collect a clean lead at 7:42 PM, flag emergencies using your rules, and set an honest expectation for what happens next.</p></article></div></section>

  <section id="savings" className="savings"><div><span className="kicker">THE BUSINESS CASE</span><h2>Receptionist coverage without another full-time payroll.</h2><p>The U.S. median wage for receptionists and information clerks was about <strong>$39,460/year</strong> in May 2025—before employer payroll taxes, benefits, recruiting, training or coverage outside normal hours.</p><div className="saving-points"><span><Clock3/> Ava can answer 24/7</span><span><DollarSign/> Plans start at $99/month</span><span><Phone/> No missed calls during jobs</span></div><small>Wage comparison uses U.S. Bureau of Labor Statistics national wage data. Ava is a software service, not a replacement for every task a human receptionist performs.</small></div><div className="compare-card"><div className="compare-head"><span>Typical full-time receptionist wage</span><b>$39,460/yr</b></div><div className="compare-row"><span>Monthly wage equivalent</span><b>≈ $3,288</b></div><div className="compare-row highlight"><span>Ava Starter</span><b>$99/mo</b></div><div className="compare-save"><small>WAGE-ONLY DIFFERENCE</small><strong>≈ $3,189/month</strong><span>before taxes, benefits and other employee costs</span></div></div></section>

  <section className="customize"><div className="section-title"><span className="kicker">DONE-FOR-YOU MEANS DONE WITH YOU</span><h2>We stand Ava up for your trucks—not hand you another app.</h2><p>You bring the way your business actually handles calls. We turn it into a working receptionist, test realistic scenarios together, and tune the rough edges before customers hear it.</p></div><div className="setup-steps"><article><b>1</b><div><h3>45-minute setup conversation</h3><p>We map services, service area, common questions, urgency rules, transfer preferences, and the lead details your team needs.</p></div></article><article><b>2</b><div><h3>We configure the receptionist</h3><p>We write the greeting and qualification flow, add your business knowledge, and choose a voice and speaking style that fit.</p></div></article><article><b>3</b><div><h3>You pressure-test Ava with us</h3><p>Run normal calls, awkward questions, emergencies, and transfer scenarios. We make the changes—not you.</p></div></article><article><b>4</b><div><h3>Launch, review, and refine</h3><p>Use Ava after hours or for broader coverage, review lead quality, and send us script or routing updates as the business changes.</p></div></article></div></section>

  <section id="pricing" className="pricing"><div className="section-title"><span className="kicker">PUBLISHED PRICING · HUMAN SETUP INCLUDED</span><h2>Managed service without call-center mystery pricing.</h2><p>Ava is not a $10–$49 set-and-forget app. Every plan includes a configured receptionist and help improving her—not a blank dashboard and a tutorial.</p></div><div className="plan-grid">{plans.map(p=><article className={p.featured?'plan featured':'plan'} key={p.name}>{p.featured&&<span className="popular">MOST POPULAR</span>}<h3>{p.name}</h3><p>{p.desc}</p><div className="price"><strong>${p.price}</strong><span>/month</span></div><small>{p.minutes}</small><ul>{p.items.map(i=><li key={i}><Check/>{i}</li>)}</ul><Link className="plan-btn" href="/founding?interest=ava">{p.cta}</Link></article>)}</div><div className="setup-offer"><div><small>ONE-TIME FOUNDING LAUNCH</small><h3>$299 Founding Setup</h3><p>We map your calls, configure Ava with your business information, customize the voice and call flow, test it with you, and prepare launch.</p></div><a className="sales-btn" href={FOUNDING_PAYMENT_LINK}>Pay $299 — Reserve My Setup <ArrowRight/></a></div><p className="usage-note">Plan minute allowances are included usage targets; unusual call volume or telephony needs may require a clearly quoted adjustment before launch.</p></section>

  <section id="faq" className="faq"><div className="section-title"><span className="kicker">STRAIGHT ANSWERS BEFORE YOU LAUNCH</span><h2>Ava FAQ</h2></div><div className="faq-grid"><details open><summary>Is Ava AI?</summary><p>Yes. Ava is an AI receptionist, not a person. The live demo labels her clearly, and we configure an appropriate disclosure in your call experience.</p></details><details><summary>Can I keep my current phone number?</summary><p>Usually. Ava can be introduced through call forwarding or a configured number depending on your carrier and call flow. We confirm the routing plan during setup.</p></details><details><summary>Can I use Ava after hours only?</summary><p>Yes. After-hours, overflow, or broader coverage can be configured around how your team already answers calls.</p></details><details><summary>What if Ava gives a wrong answer or a caller needs a person?</summary><p>We limit Ava to approved business knowledge, test difficult scenarios, and configure transfer or escalation rules. No AI is perfect, so call review and clear fallback behavior are part of setup.</p></details><details><summary>How does Ava handle spam?</summary><p>Ava can use conversation rules to avoid treating obvious spam or solicitations as qualified leads. Edge cases are reviewed and the flow can be refined.</p></details><details><summary>Can I change scripts and questions later?</summary><p>Yes. Managed updates are part of the service. Tell us what changed and we help revise greetings, questions, business knowledge, or routing.</p></details><details><summary>How long does setup take?</summary><p>Timing depends on your call flow and routing. After the setup conversation, we configure and test Ava with you before agreeing on a launch date.</p></details><details><summary>Can I test Ava before paying?</summary><p>Yes. Use the live AI demo on this page or play the sample call. No public phone number is required.</p></details></div></section>

  <section className="final-cta"><span className="kicker">YOUR NEXT CUSTOMER MAY CALL AFTER HOURS</span><h2>Let Ava answer before they call somebody else.</h2><p>Try the live AI receptionist. Then book a founding setup and we&apos;ll build the call flow around your trade, service area, and team.</p><div><a className="sales-btn light" href="#live-demo"><PhoneCall/> Try Ava Live</a><a className="sales-btn outline" href={FOUNDING_PAYMENT_LINK}>Book $299 Founding Setup <ArrowRight/></a></div></section>

  <footer className="sales-footer"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> YardProof</Link><p>AI receptionists and automation built around business outcomes.</p><Link href="/founding?interest=ava">Contact Cole</Link></footer>
 </main>
}

export default function ReceptionistDemo(){return <ConversationProvider><ReceptionistDemoContent/></ConversationProvider>}
