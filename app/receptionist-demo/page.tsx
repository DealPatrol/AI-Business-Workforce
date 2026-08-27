'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Phone, PhoneOff, Sparkles, UserRound, CheckCircle2, Loader2 } from 'lucide-react';

type CallState='idle'|'connecting'|'connected'|'ending';

function ReceptionistDemoContent(){
 const [industry,setIndustry]=useState('Landscaping');
 const [business,setBusiness]=useState('Your Business');
 const [error,setError]=useState('');
 const [callState,setCallState]=useState<CallState>('idle');
 const conversation=useConversation({
  onConnect:()=>{setError('');setCallState('connected')},
  onDisconnect:()=>setCallState('idle'),
  onError:(message:any)=>{setError(typeof message==='string'?message:'Ava could not continue the call.');setCallState('idle')}
 });
 const active=callState==='connected'||conversation.status==='connected';
 const connecting=callState==='connecting';
 const ending=callState==='ending';
 async function startCall(){
  if(callState!=='idle') return;
  setError('');setCallState('connecting');
  try{
   await navigator.mediaDevices.getUserMedia({audio:true});
   const res=await fetch('/api/ava/elevenlabs',{cache:'no-store'});
   const data=await res.json();
   if(!res.ok||!data.signedUrl) throw new Error(data?.error||data?.next||'Could not create Ava voice session.');
   await conversation.startSession({signedUrl:data.signedUrl,dynamicVariables:{business_name:business||'Your Business',business_type:industry}});
   setCallState('connected');
  }catch(e:any){setError(e?.message||'Unable to start Ava. Check microphone permission and try again.');setCallState('idle')}
 }
 async function endCall(){
  if(callState==='idle'||callState==='ending') return;
  setCallState('ending');setError('');
  try{await conversation.endSession()}
  catch(e:any){setError(e?.message||'The call ended locally, but Ava reported a hang-up error.')}
  finally{setCallState('idle')}
 }
 return <main className="ava-page"><nav className="nav"><Link className="brand" href="/"><span className="logo"><Sparkles size={18}/></span> Workforce<span>AI</span></Link><Link className="ghost" href="/visual-canvasser">Visual Canvasser</Link></nav>
 <section className="ava-hero wrap"><div><div className="eyebrow">MEET YOUR FIRST AI EMPLOYEE</div><h1>Meet <em>Ava.</em><br/>She never misses a call.</h1><p className="lede">Ava is our AI receptionist for local service businesses. She answers customers, learns why they're calling, qualifies opportunities, captures job details and prepares the lead for your team.</p><div className="ava-pills"><span>24/7 answering</span><span>Lead qualification</span><span>Call summaries</span><span>Human escalation</span></div></div>
 <div className="ava-card"><div className="ava-avatar"><UserRound size={52}/><i></i></div><h2>Ava</h2><p>AI Receptionist · {active?'Live now':connecting?'Connecting':'Demo'}</p><label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} disabled={callState!=='idle'}/></label><label>Business type<select value={industry} onChange={e=>setIndustry(e.target.value)} disabled={callState!=='idle'}><option>Landscaping</option><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Electrical</option><option>Pressure Washing</option><option>Fencing</option></select></label>{active?<button className="ava-call active" onClick={endCall} disabled={ending}>{ending?<><Loader2 className="spin"/> Ending Call...</>:<><PhoneOff/> End Call</>}</button>:<button className="ava-call" onClick={startCall} disabled={connecting}>{connecting?<><Loader2 className="spin"/> Connecting Ava...</>:<><Phone/> Talk to Ava</>}</button>}<small>{active?(conversation.isSpeaking?'Ava is speaking… click End Call to hang up.':'Ava is listening… click End Call to hang up.'):connecting?'Opening a secure voice session…':'Configure the business, then allow microphone access.'}</small>{error&&<p style={{color:'#a83232',fontSize:12,marginTop:10}}>{error}</p>}</div></section>
 <section className="ava-stage"><div className="wrap"><div className="sectionhead"><span>WHAT AVA DOES</span><h2>More than answer the phone.</h2></div><div className="ava-flow"><article><b>01</b><h3>Answer naturally</h3><p>“Thanks for calling {business || 'your business'}, this is Ava. How can I help you today?”</p></article><article><b>02</b><h3>Understand the job</h3><p>She asks one useful question at a time and adapts to {industry.toLowerCase()} callers instead of reading a rigid script.</p></article><article><b>03</b><h3>Qualify & capture</h3><p>Name, phone, address, requested service, urgency, preferred timing and other business-specific details.</p></article><article><b>04</b><h3>Take the next action</h3><p>Request an appointment, transfer urgent calls, answer approved FAQs or send the lead into follow-up.</p></article></div></div></section>
 <section className="section wrap ava-result"><div><div className="eyebrow">AFTER EVERY CALL</div><h2>Your team gets the useful part.</h2><p>No listening through voicemail. Ava turns the conversation into a structured lead record.</p></div><div className="ava-lead"><div className="ava-lead-head"><span><CheckCircle2/> NEW QUALIFIED LEAD</span><b>High intent</b></div><h3>Landscape renovation request</h3><dl><div><dt>Customer</dt><dd>Sarah M.</dd></div><div><dt>Service</dt><dd>Front-yard redesign</dd></div><div><dt>Timing</dt><dd>Within 2–3 weeks</dd></div><div><dt>Next step</dt><dd>Estimate requested</dd></div></dl><p>Caller wants a cleaner front-yard design with new beds and low-maintenance plants. Homeowner is available Thursday afternoon for an estimate.</p></div></section>
 <section className="vc-final"><div className="wrap"><h2>Talk to the receptionist before you buy it.</h2><p>Ava uses a secure realtime ElevenLabs voice session. Use End Call to close the session cleanly before starting another call.</p></div></section></main>
}

export default function ReceptionistDemo(){
 return <ConversationProvider><ReceptionistDemoContent /></ConversationProvider>;
}
