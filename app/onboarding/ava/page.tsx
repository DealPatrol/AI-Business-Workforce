'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import styles from './onboarding.module.css';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

type SubmissionStatus = 'idle' | 'sending' | 'sent' | 'email';

function buildEmailFallback(form: HTMLFormElement) {
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
      `Staff phone: ${data.get('staffPhone') || ''}`,
      `Staff email: ${data.get('staffEmail') || ''}`,
      `Calendar preference: ${data.get('calendarPreference') || ''}`,
      '',
      `Urgent-call rules:\n${data.get('urgentCallRules') || ''}`,
      '',
      `Timezone: ${data.get('timezone') || ''}`,
      `Website: ${data.get('websiteUrl') || ''}`,
      `Voice / greeting notes: ${data.get('greetingNotes') || ''}`,
      `Stripe Checkout session: ${data.get('sessionId') || ''}`,
      `Selected plan: ${data.get('plan') || ''}`,
    ].join('\n'),
  );

  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function AvaOnboardingForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [error, setError] = useState('');
  const [emailFallback, setEmailFallback] = useState('');

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
          const fallback = buildEmailFallback(form);
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
          <Sparkles /> Workforce AI
        </b>
      </nav>

      <div className={styles.content}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>AVA PAID PILOT ONBOARDING</span>
          <h1>You&apos;re in. Let&apos;s get Ava ready.</h1>
          <p>
            Payment is complete. Tell us how your business handles calls so Cole can configure Ava
            around the way your team actually works.
          </p>
        </header>

        <section className={styles.steps} aria-label="What happens next">
          <article className={styles.step}>
            <span>1</span>
            <b>Fill out this form</b>
            <p>Share your hours, services, booking preferences, and handoff rules.</p>
          </article>
          <article className={styles.step}>
            <span>2</span>
            <b>We configure Ava</b>
            <p>Cole manually builds your call flow from the answers you provide.</p>
          </article>
          <article className={styles.step}>
            <span>3</span>
            <b>Run one live test call</b>
            <p>You and Cole test the greeting, questions, routing, and urgent-call handling.</p>
          </article>
          <article className={styles.step}>
            <span>4</span>
            <b>Then go live</b>
            <p>Ava launches only after the test call confirms the workflow is ready.</p>
          </article>
        </section>

        {status === 'sent' ? (
          <section className={styles.success} aria-live="polite">
            <CheckCircle2 />
            <h2>Cole has your Ava setup details.</h2>
            <p>
              He&apos;ll configure Ava from your answers and contact you to schedule one live test
              call. Ava will go live after you&apos;ve tested the workflow together.
            </p>
            <Link href="/ava">Return to Ava</Link>
          </section>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <header className={styles.formHeader}>
              <h2>Tell us how Ava should answer.</h2>
              <p>
                Specific answers help Cole build a useful first version. You can refine the details
                together during the live test.
              </p>
            </header>

            <fieldset className={styles.section}>
              <legend>Your business</legend>
              <div className={styles.two}>
                <label>
                  Business name
                  <input name="businessName" required autoComplete="organization" />
                </label>
                <label>
                  Timezone <span className={styles.optional}>(optional)</span>
                  <input name="timezone" placeholder="Central Time" autoComplete="off" />
                </label>
              </div>
              <label>
                Business hours
                <textarea
                  name="businessHours"
                  required
                  rows={3}
                  placeholder="Mon–Fri 7am–5pm; emergency calls accepted after hours"
                />
              </label>
              <label>
                Services offered
                <textarea
                  name="services"
                  required
                  rows={4}
                  placeholder="List your main services, service area, and anything Ava should know about what you do not offer."
                />
              </label>
              <label>
                Website URL <span className={styles.optional}>(optional)</span>
                <input
                  name="websiteUrl"
                  type="url"
                  placeholder="https://yourbusiness.com"
                  autoComplete="url"
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>How Ava should handle calls</legend>
              <label>
                Call-handling rules
                <textarea
                  name="callHandlingRules"
                  required
                  rows={6}
                  placeholder="What should Ava say, ask, book, transfer, or avoid? Include the information every new caller should provide."
                />
              </label>
              <label>
                Calendar preference
                <textarea
                  name="calendarPreference"
                  required
                  rows={3}
                  placeholder="Google Calendar, your booking link, collect details for a phone callback, or another process."
                />
              </label>
              <label>
                Urgent-call rules
                <textarea
                  name="urgentCallRules"
                  required
                  rows={5}
                  placeholder="What counts as urgent, who should Ava contact, and what should she tell the caller if nobody answers?"
                />
              </label>
              <label>
                Preferred voice or greeting notes{' '}
                <span className={styles.optional}>(optional)</span>
                <textarea
                  name="greetingNotes"
                  rows={3}
                  placeholder="Example greeting, tone, pronunciation, or voice preference."
                />
              </label>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Staff handoff contact</legend>
              <div className={styles.two}>
                <label>
                  Contact name
                  <input name="staffName" required autoComplete="name" />
                </label>
                <label>
                  Phone
                  <input name="staffPhone" type="tel" autoComplete="tel" />
                </label>
              </div>
              <label>
                Email
                <input name="staffEmail" type="email" autoComplete="email" />
              </label>
              <small>Add at least one phone number or email for call handoffs.</small>
            </fieldset>

            <input type="hidden" name="sessionId" value={searchParams.get('session_id') || ''} />
            <input type="hidden" name="plan" value={searchParams.get('plan') || ''} />
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
                'Send My Ava Setup Details to Cole'
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
              <Mail /> Your answers go directly to Cole for manual Ava setup.
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
