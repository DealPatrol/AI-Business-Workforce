'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { ArrowRight, BellRing, Check, CheckCircle2, Clock3, DollarSign, Headphones, Loader2, MessageSquare, Mic2, Phone, PhoneCall, PhoneOff, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
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
  <nav className="ava-nav"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> Workforce AI</Link><div><a href="#how">How It Works</a><a href="#savings">Savings</a><a href="#pricing">Pricing</a></div><a className="nav-cta" href="#live-demo">Try Ava Live</a></nav>

  <section className="sales-hero">
   <div className="hero-copy"><span className="kicker">AI RECEPTIONIST FOR SERVICE BUSINESSES</span><h1>Stop losing jobs because <em>nobody answered.</em></h1><p>Ava answers calls 24/7, sounds natural, qualifies the customer, captures the job details and sends you the lead—without adding another full-time employee to payroll.</p><div className="hero-actions"><a className="sales-btn" href="#live-demo"><PhoneCall size={18}/> Test Ava Right Now</a><a className="sales-btn secondary" href="#how">See How It Works <ArrowRight size={18}/></a></div><div className="trust-row"><span><Check/> 24/7 coverage</span><span><Check/> Custom voice & personality</span><span><Check/> Lead summaries by email</span></div></div>
   <div className="hero-proof"><div className="proof-phone"><div className="phone-top"><span className="pulse"/><b>Incoming customer call</b><small>7:42 PM</small></div><div className="caller"><UserRound/><div><b>Potential Customer</b><span>Needs an estimate</span></div></div><div className="call-path"><span><Phone/> Ava answers</span><span><Headphones/> Qualifies request</span><span><BellRing/> Sends lead</span></div><div className="proof-result"><CheckCircle2/><div><small>NEW QUALIFIED LEAD</small><b>Estimate requested for Friday</b></div></div></div></div>
  </section>

  <section className="logo-strip"><span>Built for:</span><b>Landscaping</b><b>Roofing</b><b>HVAC</b><b>Plumbing</b><b>Fencing</b><b>Home Services</b></section>

  <section id="live-demo" className="demo-shell"><div className="demo-copy"><span className="kicker">DON'T TAKE OUR WORD FOR IT</span><h2>Call your AI receptionist before you buy her.</h2><p>Enter your business name and industry. Ava will answer like she's already part of your team.</p><ul><li><Check/> Ask her for an estimate</li><li><Check/> Give her your name, phone and address</li><li><Check/> Interrupt her or change your mind</li><li><Check/> See the lead appear after the call</li></ul><p className="demo-note"><ShieldCheck/> This is the same live voice system a customer would use.</p></div>
   <div className="live-card"><div className="ava-head"><div className="avatar"><UserRound size={38}/><i/></div><div><h3>Ava</h3><p>AI Receptionist · {active?'Live now':textMode?'Text preview':callState==='preparing'?'Preparing':callState==='ready'?'Ready':callState==='connecting'?'Connecting':callState==='processing'?'Saving lead':'Ready'}</p></div></div><label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} disabled={active||callState==='connecting'}/></label><label>Business type<select value={industry} onChange={e=>setIndustry(e.target.value)} disabled={active||callState==='connecting'}><option>Landscaping</option><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Pressure Washing</option><option>Fencing</option></select></label>{textMode?<div className="text-preview"><div className="text-messages" aria-live="polite">{textMessages.map((message,index)=><p className={message.from} key={`${message.from}-${index}`}>{message.text}</p>)}</div>{textStep<=textPrompts.length?<form onSubmit={sendTextMessage}><input aria-label="Reply to Ava" value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Type your reply…"/><button type="submit" aria-label="Send reply"><Send/></button></form>:<Link className="text-next" href="/founding?interest=ava">Build Ava for my business <ArrowRight/></Link>}<button className="text-switch" type="button" onClick={()=>setTextMode(false)}><Mic2/> Try voice instead</button><small>Guided text preview — no microphone or account required.</small></div>:<>{active?<button className="talk-btn hangup" onClick={endCall} disabled={ending}>{ending?<><Loader2 className="spin"/> Ending Call...</>:<><PhoneOff/> End Call</>}</button>:<button className="talk-btn" onClick={startCall} disabled={callState==='preparing'||callState==='connecting'||callState==='processing'}>{callState==='preparing'?<><Loader2 className="spin"/> Preparing Ava...</>:callState==='connecting'?<><Loader2 className="spin"/> Connecting...</>:callState==='processing'?<><Loader2 className="spin"/> Saving Lead...</>:<><Mic2/> Talk to Ava Live</>}</button>}<button className="text-fallback" type="button" onClick={startTextPreview}><MessageSquare/> No microphone? Use text</button><small>{active?(conversation.isSpeaking?'Ava is speaking…':'Ava is listening…'):savedMessage||'No credit card. Try a real conversation.'}</small>{error&&<p className="call-error">{error}</p>}</>}</div>
  </section>

  <section id="how" className="how-section"><div className="section-title"><span className="kicker">FROM RING TO READY-TO-CALL LEAD</span><h2>Ava handles the front desk while you handle the work.</h2></div><div className="steps-grid"><article><span>01</span><PhoneCall/><h3>Customer calls</h3><p>Ava answers immediately—even after hours, while you're on a job, or when your team is busy.</p></article><article><span>02</span><Headphones/><h3>Ava qualifies them</h3><p>She learns what they need, where the job is, how urgent it is and what should happen next.</p></article><article><span>03</span><BellRing/><h3>You get the lead</h3><p>The call becomes a structured summary with the customer details delivered to your dashboard and inbox.</p></article><article><span>04</span><DollarSign/><h3>You close the job</h3><p>You follow up with a customer who has already explained what they need—without listening to voicemail.</p></article></div></section>

  <section id="savings" className="savings"><div><span className="kicker">THE BUSINESS CASE</span><h2>Receptionist coverage without another full-time payroll.</h2><p>The U.S. median wage for receptionists and information clerks was about <strong>$39,460/year</strong> in May 2025—before employer payroll taxes, benefits, recruiting, training or coverage outside normal hours.</p><div className="saving-points"><span><Clock3/> Ava can answer 24/7</span><span><DollarSign/> Plans start at $99/month</span><span><Phone/> No missed calls during jobs</span></div><small>Wage comparison uses U.S. Bureau of Labor Statistics national wage data. Ava is a software service, not a replacement for every task a human receptionist performs.</small></div><div className="compare-card"><div className="compare-head"><span>Typical full-time receptionist wage</span><b>$39,460/yr</b></div><div className="compare-row"><span>Monthly wage equivalent</span><b>≈ $3,288</b></div><div className="compare-row highlight"><span>Ava Starter</span><b>$99/mo</b></div><div className="compare-save"><small>WAGE-ONLY DIFFERENCE</small><strong>≈ $3,189/month</strong><span>before taxes, benefits and other employee costs</span></div></div></section>

  <section className="customize"><div className="section-title"><span className="kicker">BUILT AROUND YOUR BUSINESS</span><h2>We set Ava up with you—not hand you another app to figure out.</h2><p>Tell us exactly how you want your receptionist to sound and behave. We configure it, test it with you and make changes as you learn what your customers need.</p></div><div className="custom-grid"><article><Mic2/><h3>Your voice, or a voice you love</h3><p>Choose from different professional voices or explore a voice modeled around your own when the required voice-consent setup is completed.</p></article><article><Sparkles/><h3>Your personality</h3><p>Friendly, direct, Southern, professional, energetic or calm—we tailor the speaking style to fit the business.</p></article><article><PhoneCall/><h3>Your call flow</h3><p>Decide what Ava should ask, which services she should qualify and when a caller needs a human.</p></article><article><CheckCircle2/><h3>Changes included</h3><p>We help refine greetings, questions, knowledge and call behavior instead of making you rebuild it yourself.</p></article></div></section>

  <section id="pricing" className="pricing"><div className="section-title"><span className="kicker">SIMPLE PRICING</span><h2>Start small. Upgrade when Ava proves herself.</h2><p>No need to hire a full front-office team just to find out whether missed calls are costing you jobs.</p></div><div className="plan-grid">{plans.map(p=><article className={p.featured?'plan featured':'plan'} key={p.name}>{p.featured&&<span className="popular">MOST POPULAR</span>}<h3>{p.name}</h3><p>{p.desc}</p><div className="price"><strong>${p.price}</strong><span>/month</span></div><small>{p.minutes}</small><ul>{p.items.map(i=><li key={i}><Check/>{i}</li>)}</ul><Link className="plan-btn" href="/founding?interest=ava">{p.cta}</Link></article>)}</div><div className="setup-offer"><div><small>ONE-TIME FOUNDING LAUNCH</small><h3>$299 Founding Setup</h3><p>We configure Ava with your business information, customize the voice and call flow, test it with you and get it ready for customers.</p></div><a className="sales-btn" href={FOUNDING_PAYMENT_LINK}>Pay $299 — Reserve My Setup <ArrowRight/></a></div><p className="usage-note">Voice-minute allowances are starting plan targets and should be finalized against live telephony/ElevenLabs costs before public checkout is enabled. Higher usage can be quoted separately.</p></section>

  <section className="final-cta"><span className="kicker">YOUR NEXT CUSTOMER MAY CALL AFTER HOURS</span><h2>Let Ava answer before they call somebody else.</h2><p>Test the receptionist now. If you like what you hear, we'll customize one around your business.</p><div><a className="sales-btn light" href="#live-demo"><PhoneCall/> Talk to Ava Live</a><Link className="sales-btn outline" href="/founding?interest=ava">Build Ava for My Business <ArrowRight/></Link></div></section>

  <footer className="sales-footer"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> Workforce AI</Link><p>AI receptionists and automation built around business outcomes.</p><Link href="/founding?interest=ava">Contact Cole</Link></footer>
 </main>
}

export default function ReceptionistDemo(){return <ConversationProvider><ReceptionistDemoContent/></ConversationProvider>}
