'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { AVA_VOICE_OPTIONS } from '@/lib/ava/voice-options';
import styles from './onboarding.module.css';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

type SubmissionStatus = 'idle' | 'sending' | 'sent' | 'email';

type OnboardingResponse = {
  onboardingId?: string | null;
  provisioning?: {
    status?: string;
    message?: string;
  };
};

type Prefill = {
  businessName: string;
  businessHours: string;
  services: string;
  callHandlingRules: string;
  calendarPreference: string;
  urgentCallRules: string;
  staffName: string;
  staffContact: string;
  plan: string;
};

const emptyPrefill: Prefill = {
  businessName: '',
  businessHours: '',
  services: '',
  callHandlingRules: '',
  calendarPreference: '',
  urgentCallRules: '',
  staffName: '',
  staffContact: '',
  plan: '',
};

function buildEmailFallback(form: HTMLFormElement, result: OnboardingResponse) {
  const data = new FormData(form);
  const subject = encodeURIComponent(
    `Ava paid pilot setup — ${String(data.get('businessName') || 'New business')}`,
  );
  const body = encodeURIComponent(
    [
      `Business: ${data.get('businessName') || ''}`,
      `Business hours: ${data.get('businessHours') || ''}`,
      `Services offered: ${data.get('services') || ''}`,
      '',
      `Call-handling rules:\n${data.get('callHandlingRules') || ''}`,
      '',
      `Staff contact: ${data.get('staffName') || ''}`,
      `Phone or email: ${data.get('staffContact') || ''}`,
      `Calendar preference: ${data.get('calendarPreference') || ''}`,
      '',
      `Urgent-call rules:\n${data.get('urgentCallRules') || ''}`,
      `Preferred Ava voice: ${data.get('preferredVoice') || 'No preference'}`,
      '',
      `Stripe Checkout session: ${data.get('sessionId') || ''}`,
      `Selected plan: ${data.get('plan') || ''}`,
      `Qualification: ${data.get('qualificationId') || ''}`,
      `Onboarding record: ${result.onboardingId || 'Not persisted'}`,
      `Agent status: ${result.provisioning?.status || 'pending_manual'}`,
      `Next provisioning step: ${result.provisioning?.message || 'Cole must complete setup.'}`,
    ].join('\n'),
  );

  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function AvaOnboardingForm() {
  const searchParams = useSearchParams();
  const qualificationId = searchParams.get('qualificationId') || '';
  const prefillToken = searchParams.get('prefillToken') || searchParams.get('token') || '';
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [error, setError] = useState('');
  const [emailFallback, setEmailFallback] = useState('');
  const [prefill, setPrefill] = useState<Prefill>({
    ...emptyPrefill,
    plan: searchParams.get('plan') || '',
  });
  const [prefillNote, setPrefillNote] = useState('');
  const [prefillReady, setPrefillReady] = useState(!qualificationId);

  useEffect(() => {
    if (!qualificationId) {
      setPrefillReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ id: qualificationId });
        if (prefillToken) qs.set('token', prefillToken);
        const res = await fetch(`/api/ava/sales/qualify?${qs.toString()}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || !data.qualification) {
          if (!cancelled) {
            setPrefillNote('Could not load Sales Ava answers — fill the form manually.');
            setPrefillReady(true);
          }
          return;
        }
        const q = data.qualification;
        if (cancelled) return;
        setPrefill({
          businessName: q.businessName || '',
          businessHours: q.businessHours || '',
          services: q.services || '',
          callHandlingRules: q.callHandlingRules || '',
          calendarPreference: q.calendarPreference || '',
          urgentCallRules: q.urgentCallRules || '',
          staffName: q.staffName || '',
          staffContact: q.staffContact || '',
          plan: searchParams.get('plan') || q.planInterest || '',
        });
        setPrefillNote(
          data.access === 'full'
            ? 'Prefilling from your Sales Ava conversation.'
            : 'Prefilling business answers. Re-enter staff contact if blank (token expired or missing).',
        );
        setPrefillReady(true);
      } catch {
        if (!cancelled) {
          setPrefillNote('Could not load Sales Ava answers — fill the form manually.');
          setPrefillReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qualificationId, prefillToken, searchParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    setEmailFallback('');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/ava/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.emailFallback) {
          const fallback = buildEmailFallback(form, result);
          setEmailFallback(fallback);
          setStatus('email');
          window.location.href = fallback;
          return;
        }
        throw new Error(result.error || 'Could not send your setup details.');
      }

      setStatus('sent');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Could not send your setup details.',
      );
      setStatus('idle');
    }
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/ava">
          <ArrowLeft /> Ava
        </Link>
        <b>
          <Sparkles /> YardProof
        </b>
      </nav>

      <div className={styles.content}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>AVA PAID PILOT ONBOARDING</span>
          <h1>You&apos;re in. Let&apos;s get Ava ready.</h1>
          <p>
            Payment is complete. Fill this out, Cole sets up Ava, you test one live call together,
            then Ava launches.
          </p>
          {prefillNote ? <p className={styles.notice}>{prefillNote}</p> : null}
        </header>

        <section className={styles.steps} aria-label="What happens next">
          <article className={styles.step}>
            <span>1</span>
            <b>Fill this out</b>
            <p>Tell us how your calls work.</p>
          </article>
          <article className={styles.step}>
            <span>2</span>
            <b>We set up Ava</b>
            <p>Cole builds your call flow.</p>
          </article>
          <article className={styles.step}>
            <span>3</span>
            <b>Test one live call</b>
            <p>Check the flow with Cole.</p>
          </article>
          <article className={styles.step}>
            <span>4</span>
            <b>Launch</b>
            <p>Go live after the test passes.</p>
          </article>
        </section>

        <section className={styles.sample}>
          <div className={styles.sampleHeader}>
            <div>
              <span className={styles.eyebrow}>HEAR AVA ON A CALL</span>
              <h2>Hear Ava on a call</h2>
              <p>Sample landscaping receptionist call · about 54 seconds</p>
            </div>
            <Link href="/ava#talk-to-ava">Or talk to Sales Ava</Link>
          </div>
          <video className={styles.sampleVideo} controls playsInline preload="metadata">
            <source src="/ava-sample-call.mp4" type="video/mp4" />
            Your browser does not support HTML5 video.
          </video>
        </section>

        {status === 'sent' ? (
          <section className={styles.success} aria-live="polite">
            <CheckCircle2 />
            <h2>Cole has your setup details.</h2>
            <p>
              He&apos;ll set up Ava and contact you to run one live test call before launch.
            </p>
            <Link href="/ava">Return to Ava</Link>
          </section>
        ) : !prefillReady ? (
            <p className={styles.notice}><Loader2 className={styles.spin} /> Loading your Sales Ava answers…</p>
          ) : (
          <form className={styles.form} onSubmit={submit}>
            <header className={styles.formHeader}>
              <h2>How should Ava handle your calls?</h2>
              <p>Short answers are fine. Cole will confirm the details during your live test.</p>
            </header>

            <fieldset className={styles.section}>
              <legend>Business</legend>
              <div className={styles.two}>
                <label>
                  Business name
                  <input
                    name="businessName"
                    required
                    autoComplete="organization"
                    defaultValue={prefill.businessName}
                  />
                </label>
                <label>
                  Hours
                  <input
                    name="businessHours"
                    required
                    placeholder="Mon–Fri, 7am–5pm CT"
                    autoComplete="off"
                    defaultValue={prefill.businessHours}
                  />
                </label>
              </div>
              <label>
                Services
                <textarea
                  name="services"
                  required
                  rows={3}
                  placeholder="HVAC repair and installation in Birmingham"
                  defaultValue={prefill.services}
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Call flow</legend>
              <label>
                What should Ava do?
                <textarea
                  name="callHandlingRules"
                  required
                  rows={4}
                  placeholder="Ask what they need, collect their address, book estimates, and transfer warranty calls."
                  defaultValue={prefill.callHandlingRules}
                />
              </label>
              <label>
                How should bookings work?
                <input
                  name="calendarPreference"
                  required
                  placeholder="Google Calendar, booking link, or phone callback"
                  defaultValue={prefill.calendarPreference}
                />
              </label>
              <label>
                What counts as urgent?
                <textarea
                  name="urgentCallRules"
                  required
                  rows={3}
                  placeholder="No heat is urgent. Call Sam; if no answer, text him and tell the caller we will respond in 15 minutes."
                  defaultValue={prefill.urgentCallRules}
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Staff contact</legend>
              <div className={styles.two}>
                <label>
                  Name
                  <input
                    name="staffName"
                    required
                    autoComplete="name"
                    defaultValue={prefill.staffName}
                  />
                </label>
                <label>
                  Phone or email
                  <input
                    name="staffContact"
                    required
                    placeholder="(205) 555-0123 or sam@example.com"
                    autoComplete="off"
                    defaultValue={prefill.staffContact}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Ava voice (optional)</legend>
              <label>
                Preferred voice
                <select name="preferredVoice" defaultValue="">
                  <option value="">No preference — Cole can recommend one</option>
                  {AVA_VOICE_OPTIONS.map((option) => (
                    <option value={option.key} key={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <input type="hidden" name="sessionId" value={searchParams.get('session_id') || ''} />
            <input type="hidden" name="plan" value={prefill.plan || searchParams.get('plan') || ''} />
            <input type="hidden" name="qualificationId" value={qualificationId} />
            <label className={styles.honeypot} aria-hidden="true">
              Company website
              <input name="companyWebsite" tabIndex={-1} autoComplete="off" />
            </label>

            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <Loader2 className={styles.spin} /> Sending setup details…
                </>
              ) : (
                'Send Setup Details'
              )}
            </button>
            {status === 'email' && (
              <p className={styles.notice}>
                Your email app should open with the setup details filled in. Send that message to
                finish, or <a href={emailFallback}>open it again</a>.
              </p>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <small className={styles.privacy}>
              <Mail /> Sent directly to Cole for setup.
            </small>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AvaOnboardingPage() {
  return (
    <Suspense>
      <AvaOnboardingForm />
    </Suspense>
  );
}
