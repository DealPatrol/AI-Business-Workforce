'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { ArrowRight, BellRing, Check, CheckCircle2, Clock3, DollarSign, Headphones, Loader2, MessageSquare, Mic2, Phone, PhoneCall, PhoneOff, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { AVA_PILOT_OFFER, AVA_PILOT_PAYMENT_LINK } from '@/lib/ava-pilot-offer';

type CallState='idle'|'preparing'|'ready'|'connecting'|'connected'|'ending'|'processing';
type TextMessage={from:'ava'|'visitor';text:string};

const textPrompts=[
 'What name and phone number should your receptionist capture?',
 'What property address or service area should she ask for?',
];

const plans=[
 {name:'14-day paid pilot',price:'299',desc:'For HVAC and plumbing teams that lose calls while technicians are working.',minutes:'300 voice minutes / month during pilot',items:['Ava answers missed and after-hours calls','Handles common questions','Captures job details','Sends the owner a qualified lead summary','Cancel anytime'],cta:'Try Ava for 14 days',featured:true},
];

function ReceptionistDemoContent(){
 const [industry,setIndustry]=useState('HVAC');
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
  <nav className="ava-nav"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> Workforce AI</Link><div><a href="#how">How It Works</a><a href="#savings">Savings</a><a href="#pricing">Pricing</a></div><a className="nav-cta" href="#live-demo">{AVA_PILOT_OFFER.ctaCall}</a></nav>

  <section className="sales-hero">
   <div className="hero-copy"><span className="kicker">AI RECEPTIONIST FOR HVAC & PLUMBING</span><h1>Stop losing jobs because <em>nobody answered.</em></h1><p>{AVA_PILOT_OFFER.subheadline}</p><div className="hero-actions"><a className="sales-btn" href="#live-demo"><PhoneCall size={18}/> {AVA_PILOT_OFFER.ctaCall}</a><a className="sales-btn secondary" href="/ava-pilot">See the 14-day pilot <ArrowRight size={18}/></a></div><div className="trust-row"><span><Check/> Missed & after-hours calls</span><span><Check/> Qualified lead summaries</span><span><Check/> Cancel anytime</span></div></div>
   <div className="hero-proof"><div className="proof-phone"><div className="phone-top"><span className="pulse"/><b>Incoming customer call</b><small>7:42 PM</small></div><div className="caller"><UserRound/><div><b>Potential Customer</b><span>Needs an estimate</span></div></div><div className="call-path"><span><Phone/> Ava answers</span><span><Headphones/> Qualifies request</span><span><BellRing/> Sends lead</span></div><div className="proof-result"><CheckCircle2/><div><small>NEW QUALIFIED LEAD</small><b>Estimate requested for Friday</b></div></div></div></div>
  </section>

  <section className="logo-strip"><span>This week:</span><b>HVAC</b><b>Plumbing</b><b>Owner-operated</b><b>3–20 employees</b><b>Emergency / after-hours</b></section>

  <section id="live-demo" className="demo-shell"><div className="demo-copy"><span className="kicker">DON'T TAKE OUR WORD FOR IT</span><h2>Call your AI receptionist before you buy her.</h2><p>Enter your business name and industry. Ava will answer like she's already part of your team.</p><ul><li><Check/> Ask her for an estimate</li><li><Check/> Give her your name, phone and address</li><li><Check/> Interrupt her or change your mind</li><li><Check/> See the lead appear after the call</li></ul><p className="demo-note"><ShieldCheck/> This is the same live voice system a customer would use.</p></div>
   <div className="live-card"><div className="ava-head"><div className="avatar"><UserRound size={38}/><i/></div><div><h3>Ava</h3><p>AI Receptionist · {active?'Live now':textMode?'Text preview':callState==='preparing'?'Preparing':callState==='ready'?'Ready':callState==='connecting'?'Connecting':callState==='processing'?'Saving lead':'Ready'}</p></div></div><label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} disabled={active||callState==='connecting'}/></label><label>Business type<select value={industry} onChange={e=>setIndustry(e.target.value)} disabled={active||callState==='connecting'}><option>Landscaping</option><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Pressure Washing</option><option>Fencing</option></select></label>{textMode?<div className="text-preview"><div className="text-messages" aria-live="polite">{textMessages.map((message,index)=><p className={message.from} key={`${message.from}-${index}`}>{message.text}</p>)}</div>{textStep<=textPrompts.length?<form onSubmit={sendTextMessage}><input aria-label="Reply to Ava" value={textInput} onChange={e=>setTextInput(e.target.value)} placeholder="Type your reply…"/><button type="submit" aria-label="Send reply"><Send/></button></form>:<Link className="text-next" href="/founding?interest=ava">Build Ava for my business <ArrowRight/></Link>}<button className="text-switch" type="button" onClick={()=>setTextMode(false)}><Mic2/> Try voice instead</button><small>Guided text preview — no microphone or account required.</small></div>:<>{active?<button className="talk-btn hangup" onClick={endCall} disabled={ending}>{ending?<><Loader2 className="spin"/> Ending Call...</>:<><PhoneOff/> End Call</>}</button>:<button className="talk-btn" onClick={startCall} disabled={callState==='preparing'||callState==='connecting'||callState==='processing'}>{callState==='preparing'?<><Loader2 className="spin"/> Preparing Ava...</>:callState==='connecting'?<><Loader2 className="spin"/> Connecting...</>:callState==='processing'?<><Loader2 className="spin"/> Saving Lead...</>:<><Mic2/> Talk to Ava Live</>}</button>}<button className="text-fallback" type="button" onClick={startTextPreview}><MessageSquare/> No microphone? Use text</button><small>{active?(conversation.isSpeaking?'Ava is speaking…':'Ava is listening…'):savedMessage||'No credit card. Try a real conversation.'}</small>{error&&<p className="call-error">{error}</p>}</>}</div>
  </section>

  <section id="how" className="how-section"><div className="section-title"><span className="kicker">FROM RING TO READY-TO-CALL LEAD</span><h2>Ava handles the front desk while you handle the work.</h2></div><div className="steps-grid"><article><span>01</span><PhoneCall/><h3>Customer calls</h3><p>Ava answers immediately—even after hours, while you're on a job, or when your team is busy.</p></article><article><span>02</span><Headphones/><h3>Ava qualifies them</h3><p>She learns what they need, where the job is, how urgent it is and what should happen next.</p></article><article><span>03</span><BellRing/><h3>You get the lead</h3><p>The call becomes a structured summary with the customer details delivered to your dashboard and inbox.</p></article><article><span>04</span><DollarSign/><h3>You close the job</h3><p>You follow up with a customer who has already explained what they need—without listening to voicemail.</p></article></div></section>

  <section id="savings" className="savings"><div><span className="kicker">THE BUSINESS CASE</span><h2>Coverage while technicians are on a job — without a call center.</h2><p>Owner-operated HVAC and plumbing shops lose emergency work to whoever answers first. Ava answers missed and after-hours calls so the next job still lands with you.</p><div className="saving-points"><span><Clock3/> Answers while you&apos;re on a job</span><span><DollarSign/> ${AVA_PILOT_OFFER.monthlyFee}/month after a {AVA_PILOT_OFFER.pilotDays}-day pilot</span><span><Phone/> Qualified lead summaries, not voicemail</span></div></div><div className="compare-card"><div className="compare-head"><span>14-day paid pilot</span><b>${AVA_PILOT_OFFER.setupFee} setup</b></div><div className="compare-row"><span>Then</span><b>${AVA_PILOT_OFFER.monthlyFee}/mo</b></div><div className="compare-row highlight"><span>Usage included</span><b>{AVA_PILOT_OFFER.usageLimit}</b></div><div className="compare-save"><small>NO CONTRACT</small><strong>{AVA_PILOT_OFFER.cancelPolicy}</strong><span>Prove it with real missed calls before you keep it.</span></div></div></section>

  <section className="customize"><div className="section-title"><span className="kicker">BUILT AROUND YOUR BUSINESS</span><h2>We set Ava up with you—not hand you another app to figure out.</h2><p>Tell us exactly how you want your receptionist to sound and behave. We configure it, test it with you and make changes as you learn what your customers need.</p></div><div className="custom-grid"><article><Mic2/><h3>Your voice, or a voice you love</h3><p>Choose from different professional voices or explore a voice modeled around your own when the required voice-consent setup is completed.</p></article><article><Sparkles/><h3>Your personality</h3><p>Friendly, direct, Southern, professional, energetic or calm—we tailor the speaking style to fit the business.</p></article><article><PhoneCall/><h3>Your call flow</h3><p>Decide what Ava should ask, which services she should qualify and when a caller needs a human.</p></article><article><CheckCircle2/><h3>Changes included</h3><p>We help refine greetings, questions, knowledge and call behavior instead of making you rebuild it yourself.</p></article></div></section>

  <section id="pricing" className="pricing"><div className="section-title"><span className="kicker">ONE CLEAR OFFER</span><h2>A paid pilot — not a three-tier maze.</h2><p>Test whether HVAC and plumbing owners will pay. Usage limit stated upfront. Cancel anytime.</p></div><div className="plan-grid" style={{gridTemplateColumns:'minmax(0,520px)',justifyContent:'center'}}>{plans.map(p=><article className={p.featured?'plan featured':'plan'} key={p.name}><span className="popular">THIS WEEK</span><h3>{p.name}</h3><p>{p.desc}</p><div className="price"><strong>${AVA_PILOT_OFFER.monthlyFee}</strong><span>/month after {AVA_PILOT_OFFER.pilotDays} days</span></div><small>${AVA_PILOT_OFFER.setupFee} setup · {p.minutes}</small><ul>{p.items.map(i=><li key={i}><Check/>{i}</li>)}</ul><a className="plan-btn" href={AVA_PILOT_PAYMENT_LINK}>{p.cta}</a></article>)}</div><p className="usage-note">{AVA_PILOT_OFFER.usageLimit}. Higher usage quoted separately. {AVA_PILOT_OFFER.cancelPolicy}.</p></section>

  <section className="final-cta"><span className="kicker">YOUR NEXT CUSTOMER MAY CALL AFTER HOURS</span><h2>Let Ava answer before they call somebody else.</h2><p>Call Ava now. If it sounds right, start a 14-day pilot.</p><div><a className="sales-btn light" href="#live-demo"><PhoneCall/> {AVA_PILOT_OFFER.ctaCall}</a><a className="sales-btn outline" href={AVA_PILOT_PAYMENT_LINK}>{AVA_PILOT_OFFER.ctaPrimary} <ArrowRight/></a></div></section>

  <footer className="sales-footer"><Link className="ava-brand" href="/"><span><Sparkles size={17}/></span> Workforce AI</Link><p>Ava for HVAC & plumbing — missed-call coverage, not a feature list.</p><Link href="/ava-pilot">Pilot offer</Link></footer>
 </main>
}

export default function ReceptionistDemo(){return <ConversationProvider><ReceptionistDemoContent/></ConversationProvider>}
