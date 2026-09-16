'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import {
  ArrowRight,
  Calendar,
  Check,
  Loader2,
  Mic2,
  PhoneCall,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

type CallState = 'idle' | 'preparing' | 'ready' | 'connecting' | 'connected' | 'ending' | 'processing';

type QualificationResult = {
  id: string;
  prefillToken?: string | null;
  businessName?: string;
  planInterest?: string | null;
  summary?: string;
};

const BOOKING_URL = process.env.NEXT_PUBLIC_AVA_SETUP_BOOKING_URL || '';

function valueOf(item: unknown) {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  return record.value ?? record.result ?? record.data ?? record.extracted_value ?? null;
}

function pickCollected(collected: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const direct = valueOf(collected[key]);
    if (direct) return String(direct);
    const found = Object.entries(collected).find(([k]) =>
      k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(key.toLowerCase().replace(/[^a-z0-9]/g, '')),
    );
    const v = valueOf(found?.[1]);
    if (v) return String(v);
  }
  return '';
}

function SalesAvaQualifyContent() {
  const [error, setError] = useState('');
  const [callState, setCallState] = useState<CallState>('preparing');
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
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
      const res = await fetch('/api/ava/elevenlabs?mode=sales', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.signedUrl) {
        throw new Error(data?.error || data?.next || 'Sales Ava is not configured yet.');
      }
      signedUrl.current = data.signedUrl;
      preparedConversationId.current = data.conversationId || null;
      setCallState('ready');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message || 'Sales Ava is not ready yet.');
      setCallState('idle');
    }
  }

  useEffect(() => {
    prepareSession();
  }, []);

  const active = callState === 'connected' || conversation.status === 'connected';
  const ending = callState === 'ending';

  async function startCall() {
    if (!['ready', 'idle'].includes(callState)) return;
    setQualification(null);
    setError('');
    setCallState('connecting');
    try {
      if (!signedUrl.current) {
        await prepareSession();
        if (!signedUrl.current) throw new Error('Ava is still preparing. Try once more.');
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversationId.current = preparedConversationId.current;
      await conversation.startSession({ signedUrl: signedUrl.current! });
      signedUrl.current = null;
      preparedConversationId.current = null;
      setCallState('connected');
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      setError(err?.message || 'Unable to start Sales Ava.');
      setCallState('ready');
    }
  }

  async function saveQualificationFromConversation(id: string) {
    setCallState('processing');
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 1500 : 2500));
      const r = await fetch(`/api/ava/conversation?conversationId=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (r.status === 202) continue;
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not process the Sales Ava conversation.');

      const collected = (d.collected || {}) as Record<string, unknown>;
      const q = (d.qualification || {}) as Record<string, string | null>;
      const payload = {
        conversationId: id,
        businessName:
          q.businessName ||
          pickCollected(collected, 'businessName', 'business_name') ||
          'Prospect business',
        businessType:
          q.businessType ||
          pickCollected(collected, 'businessType', 'business_type', 'industry') ||
          'Home services',
        businessHours:
          q.businessHours ||
          pickCollected(collected, 'businessHours', 'business_hours') ||
          'To confirm on setup call',
        services:
          q.services ||
          pickCollected(collected, 'services') ||
          d.summary ||
          'To confirm on setup call',
        callHandlingRules:
          q.callHandlingRules ||
          pickCollected(collected, 'callHandlingRules', 'call_handling_rules') ||
          'Notify staff with lead summary; escalate per urgent rules.',
        urgentCallRules:
          q.urgentCallRules ||
          pickCollected(collected, 'urgentCallRules', 'urgent_call_rules') ||
          'Confirm urgent criteria during setup.',
        staffName:
          q.staffName ||
          pickCollected(collected, 'staffName', 'staff_name', 'caller_name', 'name') ||
          'Owner',
        staffContact:
          q.staffContact ||
          pickCollected(collected, 'staffContact', 'staff_contact', 'caller_phone', 'phone') ||
          'To confirm on setup call',
        calendarPreference:
          q.calendarPreference ||
          pickCollected(collected, 'calendarPreference', 'calendar_preference') ||
          'Lead notify only until calendar is connected',
        companyWebsite:
          q.companyWebsite ||
          pickCollected(collected, 'companyWebsite', 'company_website') ||
          null,
        planInterest:
          q.planInterest ||
          pickCollected(collected, 'planInterest', 'plan_interest', 'plan') ||
          null,
        summary: d.summary || 'Sales Ava qualification conversation completed.',
      };

      const save = await fetch('/api/ava/sales/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const s = await save.json();
      if (!save.ok) throw new Error(s.error || 'Could not save qualification.');

      setQualification({
        id: s.qualificationId,
        prefillToken: s.prefillToken || null,
        businessName: s.qualification?.businessName,
        planInterest: s.qualification?.planInterest,
        summary: s.qualification?.summary,
      });
      conversationId.current = null;
      await prepareSession();
      return;
    }
    throw new Error('ElevenLabs is still processing the call. Qualification was not saved yet.');
  }

  async function endCall() {
    if (!active || ending) return;
    setCallState('ending');
    setError('');
    try {
      await conversation.endSession();
      const id = conversationId.current;
      if (id) await saveQualificationFromConversation(id);
      else setCallState('ready');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message || 'Call ended, but qualification save needs attention.');
      await prepareSession();
    }
  }

  const planKey = (qualification?.planInterest || 'growth').toLowerCase().includes('starter')
    ? 'starter'
    : (qualification?.planInterest || '').toLowerCase().includes('pro')
      ? 'pro'
      : 'growth';
  const planLabel =
    planKey === 'starter' ? 'Starter $59' : planKey === 'pro' ? 'Pro $249' : 'Growth $129';
  const prefillQs = qualification
    ? [
        `qualificationId=${encodeURIComponent(qualification.id)}`,
        planKey ? `plan=${planKey}` : '',
        qualification.prefillToken
          ? `prefillToken=${encodeURIComponent(qualification.prefillToken)}`
          : '',
      ]
        .filter(Boolean)
        .join('&')
    : '';
  const onboardingHref = qualification ? `/onboarding/ava?${prefillQs}` : '/onboarding/ava';
  const checkoutHref = qualification
    ? `/api/checkout?plan=${planKey}&qualificationId=${encodeURIComponent(qualification.id)}${
        qualification.prefillToken
          ? `&prefillToken=${encodeURIComponent(qualification.prefillToken)}`
          : ''
      }`
    : `/api/checkout?plan=${planKey}`;

  return (
    <section id="talk-to-ava" className="demo-shell">
      <div className="demo-copy">
        <span className="kicker">TALK TO AVA · SALES QUALIFY</span>
        <h2>Talk to Ava — she&apos;ll set up your receptionist</h2>
        <p>
          Call Ava like your customers will. She&apos;ll ask the setup questions, then you can start a
          plan or continue to onboarding with answers prefilled.
        </p>
        <ul>
          <li>
            <Check /> Business name, hours, and services
          </li>
          <li>
            <Check /> Call handling + urgent rules
          </li>
          <li>
            <Check /> Staff contact and calendar preference
          </li>
          <li>
            <Check /> Prefill onboarding after the call
          </li>
        </ul>
        <p className="demo-note">
          <ShieldCheck /> Ava is AI. She&apos;ll disclose that to your callers too. No dial-in number —
          browser mic only.
        </p>
      </div>

      <div className="live-card">
        <div className="ai-disclosure">
          <Sparkles /> Sales Ava · qualify your shop
        </div>
        <div className="ava-head">
          <div className="avatar">
            <UserRound size={38} />
            <i />
          </div>
          <div>
            <h3>Ava</h3>
            <p>
              Workforce AI ·{' '}
              {active
                ? 'Live now'
                : callState === 'preparing'
                  ? 'Preparing'
                  : callState === 'connecting'
                    ? 'Connecting'
                    : callState === 'processing'
                      ? 'Saving setup answers'
                      : callState === 'ready'
                        ? 'Ready'
                        : 'Standby'}
            </p>
          </div>
        </div>

        {qualification ? (
          <div className="text-preview" style={{ gap: 12 }}>
            <div className="text-messages" aria-live="polite">
              <p className="ava">
                Got it
                {qualification.businessName ? ` for ${qualification.businessName}` : ''}. I saved
                your setup answers
                {qualification.summary ? ` — ${qualification.summary.slice(0, 180)}` : ''}.
              </p>
            </div>
            <a className="talk-btn" href={checkoutHref}>
              Start {planLabel} — $0 setup <ArrowRight size={16} />
            </a>
            <Link className="text-next" href={onboardingHref}>
              Continue to onboarding (prefilled) <ArrowRight size={14} />
            </Link>
            {BOOKING_URL ? (
              <a className="text-fallback" href={BOOKING_URL} target="_blank" rel="noreferrer">
                <Calendar size={14} /> Book a setup call with Cole
              </a>
            ) : null}
            <button className="text-switch" type="button" onClick={() => setQualification(null)}>
              <Mic2 size={14} /> Talk again
            </button>
          </div>
        ) : (
          <>
            {active ? (
              <button className="talk-btn hangup" onClick={endCall} disabled={ending}>
                {ending ? (
                  <>
                    <Loader2 className="spin" /> Ending call…
                  </>
                ) : (
                  <>
                    <PhoneOff /> End call &amp; save answers
                  </>
                )}
              </button>
            ) : (
              <button
                className="talk-btn"
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
                    <Loader2 className="spin" /> Saving setup answers…
                  </>
                ) : (
                  <>
                    <PhoneCall /> Talk to Ava — she&apos;ll set up your receptionist
                  </>
                )}
              </button>
            )}
            <small>
              {active
                ? conversation.isSpeaking
                  ? 'Ava is speaking…'
                  : 'Ava is listening…'
                : 'Plans: Starter $59 · Growth $129 · Pro $249 · $0 setup'}
            </small>
            {error && <p className="call-error">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}

export default function SalesAvaQualify() {
  return (
    <ConversationProvider>
      <SalesAvaQualifyContent />
    </ConversationProvider>
  );
}
