'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Calendar,
  Check,
  Clock3,
  Loader2,
  MapPin,
  MessageSquare,
  Mic2,
  Phone,
  PhoneCall,
  PhoneOff,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { AVA_PILOT_OFFER, AVA_PILOT_PAYMENT_LINK } from '@/lib/ava-pilot-offer';
import type { Prospect } from '@/lib/prospects';

type CallState = 'idle' | 'preparing' | 'ready' | 'connecting' | 'connected' | 'ending' | 'processing';
type TextMessage = { from: 'ava' | 'visitor'; text: string };

const textPrompts = [
  'What name and phone number should I capture for the callback?',
  'What is the service address and how urgent is this?',
];

async function trackEvent(
  slug: string,
  eventType: 'demo_open' | 'call_started' | 'call_ended' | 'pilot_clicked',
  metadata?: Record<string, unknown>,
) {
  try {
    await fetch('/api/sales/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectSlug: slug, eventType, metadata }),
    });
  } catch {
    // Tracking should never block the demo experience.
  }
}

function PersonalizedDemoContent({ prospect }: { prospect: Prospect }) {
  const [error, setError] = useState('');
  const [callState, setCallState] = useState<CallState>('preparing');
  const [savedMessage, setSavedMessage] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textStep, setTextStep] = useState(0);
  const [textMessages, setTextMessages] = useState<TextMessage[]>([
    {
      from: 'ava',
      text: `Hi, thanks for calling ${prospect.companyName}. How can I help you today?`,
    },
  ]);
  const conversationId = useRef<string | null>(null);
  const signedUrl = useRef<string | null>(null);
  const preparedConversationId = useRef<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setError('');
      setCallState('connected');
    },
    onDisconnect: () => {
      setCallState((s) => (s === 'processing' ? s : 'ready'));
    },
    onError: (message: unknown) => {
      setError(typeof message === 'string' ? message : 'Ava could not continue the call.');
      setCallState((s) => (s === 'processing' ? s : 'ready'));
    },
  });

  async function prepareSession() {
    setCallState('preparing');
    setError('');
    try {
      const res = await fetch('/api/ava/elevenlabs', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        throw new Error(data?.error || data?.next || 'Could not prepare Ava.');
      }
      signedUrl.current = data.signedUrl;
      preparedConversationId.current = data.conversationId || null;
      setCallState('ready');
    } catch {
      setError('');
      setTextMode(true);
      setCallState('idle');
    }
  }

  useEffect(() => {
    trackEvent(prospect.slug, 'demo_open');
    prepareSession();
  }, [prospect.slug]);

  const active = callState === 'connected' || conversation.status === 'connected';
  const ending = callState === 'ending';

  async function startCall() {
    if (!['ready', 'idle'].includes(callState)) return;
    setSavedMessage('');
    setError('');
    setCallState('connecting');
    trackEvent(prospect.slug, 'call_started');
    try {
      if (!signedUrl.current) {
        await prepareSession();
        if (!signedUrl.current) throw new Error('Ava is still preparing. Try once more.');
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversationId.current = preparedConversationId.current;
      await conversation.startSession({
        signedUrl: signedUrl.current!,
        dynamicVariables: {
          business_name: prospect.companyName,
          business_type: prospect.industry,
        },
      });
      signedUrl.current = null;
      preparedConversationId.current = null;
      setCallState('connected');
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setError('');
        setTextMode(true);
        setCallState('ready');
        return;
      }
      setError(err?.message || 'Unable to start Ava.');
      setCallState('ready');
    }
  }

  function startTextPreview() {
    setError('');
    setTextMode(true);
    setTextStep(0);
    setTextMessages([
      {
        from: 'ava',
        text: `Hi, thanks for contacting ${prospect.companyName}. How can I help today?`,
      },
    ]);
    trackEvent(prospect.slug, 'call_started', { mode: 'text' });
  }

  function sendTextMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const message = textInput.trim();
    if (!message) return;
    const nextStep = textStep + 1;
    const reply =
      nextStep <= textPrompts.length
        ? textPrompts[nextStep - 1]
        : 'Thanks — I have what I need. In a live setup, this becomes a lead summary sent directly to the owner.';
    setTextMessages((messages) => [
      ...messages,
      { from: 'visitor', text: message },
      { from: 'ava', text: reply },
    ]);
    setTextInput('');
    setTextStep(nextStep);
  }

  async function captureLead() {
    const id = conversationId.current;
    if (!id) return;
    setCallState('processing');
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 1500 : 2500));
      const r = await fetch(`/api/ava/conversation?conversationId=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (r.status === 202) continue;
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not process Ava conversation.');
      const save = await fetch('/api/ava/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: id,
          businessName: prospect.companyName,
          businessType: prospect.industry,
          name: d.lead?.name,
          phone: d.lead?.phone,
          serviceJobType: d.lead?.serviceJobType,
          address: d.lead?.address,
          intentUrgency: d.lead?.intentUrgency,
          summary: d.summary,
          transcript: d.transcript,
        }),
      });
      const s = await save.json();
      if (!save.ok) throw new Error(s.error || 'Could not save lead.');
      setSavedMessage(
        s.notification?.sent ? 'Lead saved and owner notified.' : 'Lead captured for follow-up.',
      );
      conversationId.current = null;
      trackEvent(prospect.slug, 'call_ended', { leadCaptured: true });
      await prepareSession();
      return;
    }
    throw new Error('ElevenLabs is still processing the call. The lead was not saved yet.');
  }

  async function endCall() {
    if (!active || ending) return;
    setCallState('ending');
    setError('');
    try {
      await conversation.endSession();
      await captureLead();
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message || 'Call ended, but lead capture needs attention.');
      trackEvent(prospect.slug, 'call_ended', { leadCaptured: false });
      await prepareSession();
    }
  }

  function handlePilotClick() {
    trackEvent(prospect.slug, 'pilot_clicked');
  }

  const { sampleLead } = prospect;

  return (
    <main
      className="prospect-demo"
      style={
        {
          '--brand': prospect.brandColor,
          '--accent': prospect.accentColor,
        } as React.CSSProperties
      }
    >
      <header className="demo-header">
        <div className="demo-brand">
          <span className="demo-logo">{prospect.logoInitials}</span>
          <div>
            <strong>{prospect.companyName}</strong>
            <small>{prospect.tagline}</small>
          </div>
        </div>
        <span className="demo-badge">Built for {prospect.ownerName}</span>
      </header>

      <section className="demo-hero">
        <div className="demo-hero-copy">
          <span className="demo-kicker">YOUR AI RECEPTIONIST DEMO</span>
          <h1>
            What happens when a customer calls while {prospect.ownerName.split(' ')[0]} is on a
            job?
          </h1>
          <p>
            Ava answers for {prospect.companyName}, handles common {prospect.industry.toLowerCase()}{' '}
            questions, captures the job details, and sends a qualified lead summary — so you never
            lose an emergency call to voicemail.
          </p>
          <div className="demo-tasks">
            <h2>Three things Ava handles for {prospect.companyName}</h2>
            <ul>
              {prospect.tasks.map((task) => (
                <li key={task}>
                  <Check size={16} />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="demo-call-card">
          <div className="ava-head">
            <div className="avatar">
              <UserRound size={34} />
              <i />
            </div>
            <div>
              <h3>Ava</h3>
              <p>
                AI Receptionist for {prospect.companyName} ·{' '}
                {active
                  ? 'Live now'
                  : textMode
                    ? 'Text preview'
                    : callState === 'preparing'
                      ? 'Preparing'
                      : callState === 'connecting'
                        ? 'Connecting'
                        : callState === 'processing'
                          ? 'Saving lead'
                          : 'Ready'}
              </p>
            </div>
          </div>

          {textMode ? (
            <div className="text-preview">
              <div className="text-messages" aria-live="polite">
                {textMessages.map((message, index) => (
                  <p className={message.from} key={`${message.from}-${index}`}>
                    {message.text}
                  </p>
                ))}
              </div>
              {textStep <= textPrompts.length ? (
                <form onSubmit={sendTextMessage}>
                  <input
                    aria-label="Reply to Ava"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your reply…"
                  />
                  <button type="submit" aria-label="Send reply">
                    <Send />
                  </button>
                </form>
              ) : (
                <a
                  className="demo-btn primary full"
                  href={AVA_PILOT_PAYMENT_LINK}
                  onClick={handlePilotClick}
                >
                  {AVA_PILOT_OFFER.ctaPrimary} <ArrowRight size={16} />
                </a>
              )}
              <button className="text-switch" type="button" onClick={() => setTextMode(false)}>
                <Mic2 size={14} /> Try voice instead
              </button>
              <small>Guided text preview — no microphone required.</small>
            </div>
          ) : (
            <>
              {active ? (
                <button className="demo-btn danger full" onClick={endCall} disabled={ending}>
                  {ending ? (
                    <>
                      <Loader2 className="spin" /> Ending call…
                    </>
                  ) : (
                    <>
                      <PhoneOff size={18} /> End call
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="demo-btn primary full"
                  onClick={startCall}
                  disabled={
                    callState === 'preparing' ||
                    callState === 'connecting' ||
                    callState === 'processing'
                  }
                >
                  {callState === 'preparing' ? (
                    <>
                      <Loader2 className="spin" /> Preparing Ava…
                    </>
                  ) : callState === 'connecting' ? (
                    <>
                      <Loader2 className="spin" /> Connecting…
                    </>
                  ) : callState === 'processing' ? (
                    <>
                      <Loader2 className="spin" /> Saving lead…
                    </>
                  ) : (
                    <>
                      <PhoneCall size={18} /> {AVA_PILOT_OFFER.ctaCall}
                    </>
                  )}
                </button>
              )}
              <button className="text-fallback" type="button" onClick={startTextPreview}>
                <MessageSquare size={14} /> No microphone? Use text
              </button>
              <small>
                {active
                  ? conversation.isSpeaking
                    ? 'Ava is speaking…'
                    : 'Ava is listening…'
                  : savedMessage || 'Try a real conversation — no account required.'}
              </small>
              {error && <p className="call-error">{error}</p>}
            </>
          )}
        </div>
      </section>

      <section className="demo-lead">
        <div className="demo-lead-copy">
          <span className="demo-kicker">SAMPLE LEAD SUMMARY</span>
          <h2>This is what {prospect.ownerName.split(' ')[0]} receives after a missed call.</h2>
          <p>
            Every call becomes a structured summary — caller details, job type, urgency, and the
            recommended next step. No listening to voicemail. No guessing what the customer needed.
          </p>
        </div>
        <article className="lead-card">
          <header>
            <BellRing size={18} />
            <div>
              <small>NEW QUALIFIED LEAD</small>
              <strong>{prospect.companyName}</strong>
            </div>
            <span className="lead-time">
              <Clock3 size={12} /> Just now
            </span>
          </header>
          <div className="lead-fields">
            <div>
              <span>Caller</span>
              <b>{sampleLead.callerName}</b>
            </div>
            <div>
              <span>Phone</span>
              <b>{sampleLead.callerPhone}</b>
            </div>
            <div>
              <span>Service</span>
              <b>{sampleLead.serviceType}</b>
            </div>
            <div>
              <span>Address</span>
              <b>
                <MapPin size={12} /> {sampleLead.address}
              </b>
            </div>
            <div>
              <span>Urgency</span>
              <b className="urgent">{sampleLead.urgency}</b>
            </div>
          </div>
          <div className="lead-summary">
            <span>Summary</span>
            <p>{sampleLead.summary}</p>
          </div>
          <div className="lead-next">
            <Phone size={14} />
            <span>
              <b>Recommended:</b> {sampleLead.recommendedNextStep}
            </span>
          </div>
        </article>
      </section>

      <section className="demo-pilot">
        <div>
          <span className="demo-kicker">14-DAY PAID PILOT</span>
          <h2>Try Ava for {prospect.companyName}</h2>
          <p>
            ${AVA_PILOT_OFFER.setupFee} setup · ${AVA_PILOT_OFFER.monthlyFee}/month after{' '}
            {AVA_PILOT_OFFER.pilotDays} days · {AVA_PILOT_OFFER.usageLimit} ·{' '}
            {AVA_PILOT_OFFER.cancelPolicy}
          </p>
          <ul className="pilot-checks">
            <li>
              <Check size={14} /> Customized for {prospect.industry} call flows
            </li>
            <li>
              <Check size={14} /> Lead summaries to your phone and email
            </li>
            <li>
              <ShieldCheck size={14} /> Cancel anytime — no contract
            </li>
          </ul>
        </div>
        <div className="pilot-actions">
          <a
            className="demo-btn primary"
            href={AVA_PILOT_PAYMENT_LINK}
            onClick={handlePilotClick}
          >
            <Calendar size={16} /> {AVA_PILOT_OFFER.ctaPrimary}
          </a>
          <Link className="demo-btn secondary" href="/video">
            Watch the 60-second overview <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="demo-footer">
        <small>
          Demo built for {prospect.ownerName} at {prospect.companyName} · {prospect.serviceArea}
        </small>
      </footer>
    </main>
  );
}

export default function PersonalizedDemo({ prospect }: { prospect: Prospect }) {
  return (
    <ConversationProvider>
      <PersonalizedDemoContent prospect={prospect} />
    </ConversationProvider>
  );
}
