'use client';

import { FormEvent, useState } from 'react';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

function mailtoFallback(data: FormData) {
  const subject = encodeURIComponent(`HVAC Ava trial: ${String(data.get('business') || 'New shop')}`);
  const body = encodeURIComponent(
    [
      `Shop: ${data.get('business') || ''}`,
      `Name: ${data.get('contact') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      `Service area: ${data.get('serviceArea') || ''}`,
      `Plan: ${data.get('interest') || ''}`,
      '',
      String(data.get('notes') || ''),
    ].join('\n'),
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function HvacContactForm() {
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
        body: JSON.stringify({ ...Object.fromEntries(data.entries()), industry: 'HVAC' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.emailFallback) {
          window.location.href = mailtoFallback(data);
          setStatus('idle');
          return;
        }
        throw new Error(result.error || 'Could not send. Call or text 256-595-3354.');
      }
      setStatus('sent');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Call or text 256-595-3354.');
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
        Service area
        <input name="serviceArea" placeholder="Cullman, Huntsville..." maxLength={200} />
      </label>
      <label>
        Plan you&apos;re interested in
        <select name="interest" defaultValue="Ava HVAC: Booked & Reviewed" required>
          <option>Ava HVAC: Never Miss a Call</option>
          <option>Ava HVAC: Booked &amp; Reviewed</option>
          <option>Ava HVAC: Front Porch Complete</option>
          <option>Ava HVAC: Not sure yet</option>
        </select>
      </label>
      <label>
        Anything I should know?
        <textarea name="notes" rows={3} maxLength={2000} />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hvac-hp" aria-hidden="true" />
      {error && <p className="hvac-error">{error}</p>}
      <button className="hvac-btn hvac-btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Start my free trial'}
      </button>
    </form>
  );
}
