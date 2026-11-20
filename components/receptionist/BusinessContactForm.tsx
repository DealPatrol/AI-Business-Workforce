'use client';

import { FormEvent, useState } from 'react';
import { AVA_OFFER } from '@/lib/ava/pricing';

const FALLBACK_ERROR = `Could not send. Call ${AVA_OFFER.contactPhoneDisplay}.`;

function mailtoFallback(data: FormData, industry: string) {
  const subject = encodeURIComponent(`Executive Receptionist (${industry}): ${String(data.get('business') || 'New business')}`);
  const body = encodeURIComponent(
    [
      `Business: ${data.get('business') || ''}`,
      `Type of business: ${industry}`,
      `Name: ${data.get('contact') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      `City: ${data.get('serviceArea') || ''}`,
      `Plan: ${data.get('interest') || ''}`,
      '',
      String(data.get('notes') || ''),
    ].join('\n'),
  );
  return `mailto:${AVA_OFFER.contactEmail}?subject=${subject}&body=${body}`;
}

/** Callback request for the all-business pages. Posts to the same endpoint as the HVAC page form. */
export function BusinessContactForm({ industry }: { industry: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/founding-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(data.entries()), industry }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.emailFallback) {
          window.location.href = mailtoFallback(data, industry);
          setStatus('idle');
          return;
        }
        throw new Error(result.error || FALLBACK_ERROR);
      }
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="hvac-form hvac-form-done">
        <h3>Got it, thank you.</h3>
        <p>Cole will call you back, usually the same day.</p>
      </div>
    );
  }

  return (
    <form className="hvac-form" onSubmit={submit}>
      <label>
        Business name
        <input name="business" required maxLength={200} />
      </label>
      <label>
        Your name
        <input name="contact" required maxLength={200} />
      </label>
      <label>
        Email
        <input name="email" type="email" required maxLength={200} />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" maxLength={50} />
      </label>
      <label>
        City
        <input name="serviceArea" placeholder="Huntsville, Birmingham..." maxLength={200} />
      </label>
      <label>
        Plan you&apos;re interested in
        <select name="interest" defaultValue="Executive Receptionist Starter ($79/mo, $1 for month #1)" required>
          <option value="Executive Receptionist Starter ($79/mo, $1 for month #1)">Starter: $1 for month #1, then $79/mo, 100 minutes</option>
          <option value="Executive Receptionist Growth ($197/mo, $1 for month #1)">Growth: $1 for month #1, then $197/mo, 300 minutes</option>
          <option value="Executive Receptionist Pro ($397/mo, $1 for month #1)">Pro: $1 for month #1, then $397/mo, 1,200 minutes (best value)</option>
          <option value="Executive Receptionist Elite ($789/mo, $1 for month #1)">Elite: $1 for month #1, then $789/mo, 2,000 minutes</option>
          <option value="Not sure yet">Not sure yet</option>
        </select>
      </label>
      <label>
        Anything I should know?
        <textarea name="notes" rows={3} maxLength={2000} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hvac-hp" aria-hidden="true" />
      {error && <p className="hvac-error">{error}</p>}
      <button className="hvac-btn hvac-btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Request a callback'}
      </button>
    </form>
  );
}
