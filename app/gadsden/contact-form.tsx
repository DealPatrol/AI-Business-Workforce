'use client';

import { FormEvent, useState } from 'react';
import { GET_FOUND_TIERS, GET_FOUND_TRADES } from '@/lib/ava/get-found';

const CONTACT_EMAIL = 'colecollins763@gmail.com';
const CALL_LINE = 'Could not send. Call Cole at (256) 595-3354.';

function mailtoFallback(data: FormData) {
  const subject = encodeURIComponent(`Never Miss + Get Found: ${String(data.get('business') || 'New shop')}`);
  const body = encodeURIComponent(
    [
      `Shop: ${data.get('business') || ''}`,
      `Name: ${data.get('contact') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      `Trade: ${data.get('trade') || ''}`,
      `Service area: ${data.get('serviceArea') || ''}`,
      `Plan: ${data.get('interest') || ''}`,
      '',
      String(data.get('notes') || ''),
    ].join('\n'),
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function GadsdenContactForm() {
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
        body: JSON.stringify({ ...Object.fromEntries(data.entries()), industry: String(data.get('trade') || 'Trade') }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.emailFallback) {
          window.location.href = mailtoFallback(data);
          setStatus('idle');
          return;
        }
        throw new Error(result.error || CALL_LINE);
      }
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : CALL_LINE);
      setStatus('idle');
    }
  }

  if (status === 'sent') {
    return (
      <div className="hvac-form hvac-form-done">
        <h3>Got it, thank you.</h3>
        <p>Cole will call you back, usually the same day, and send your free Google profile before-and-after.</p>
      </div>
    );
  }

  return (
    <form className="hvac-form" onSubmit={submit}>
      <label>
        Shop name
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
        Trade
        <select name="trade" defaultValue="HVAC">
          {GET_FOUND_TRADES.map((trade) => (
            <option key={trade} value={trade}>
              {trade}
            </option>
          ))}
        </select>
      </label>
      <label>
        Towns you serve
        <input name="serviceArea" placeholder="Gadsden, Rainbow City..." maxLength={200} />
      </label>
      <label>
        Plan you&apos;re interested in
        <select name="interest" defaultValue={`${GET_FOUND_TIERS[1].name} (${GET_FOUND_TIERS[1].monthlyLabel}/mo)`} required>
          {GET_FOUND_TIERS.map((tier) => (
            <option key={tier.key} value={`${tier.name} (${tier.monthlyLabel}/mo)`}>
              {tier.name}: {tier.monthlyLabel}/mo, {tier.setupLabel.toLowerCase()}
            </option>
          ))}
          <option value="Free Google profile before-and-after only">Just the free before-and-after for now</option>
        </select>
      </label>
      <label>
        Anything I should know?
        <textarea name="notes" rows={3} maxLength={2000} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hvac-hp" aria-hidden="true" />
      {error && <p className="hvac-error">{error}</p>}
      <button className="hvac-btn hvac-btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Get my free before-and-after'}
      </button>
    </form>
  );
}
