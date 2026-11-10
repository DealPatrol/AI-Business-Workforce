'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './login.module.css';

type Mode = 'link' | 'password';

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('link');
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function requestLink(email: string) {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, next: returnTo }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!response.ok) {
      setError(data.error || 'We could not send a link right now. Try again in a minute.');
      return;
    }
    setSent(data.message || 'If that email belongs to a customer, a sign-in link is on its way.');
  }

  async function signInWithPassword(email: string, password: string) {
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Email or password was not recognized.');
      return;
    }
    router.replace(returnTo);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSent('');
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    try {
      if (mode === 'link') await requestLink(email);
      else await signInWithPassword(email, password);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {mode === 'password' ? (
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
      ) : null}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {sent && <p className={styles.sent} role="status">{sent}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Working…' : mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}
      </button>
      <span className={styles.divider}>OR</span>
      <button
        type="button"
        className={styles.ghost}
        onClick={() => {
          setError('');
          setSent('');
          setMode(mode === 'link' ? 'password' : 'link');
        }}
      >
        {mode === 'link' ? 'Use a password instead' : 'Email me a link instead'}
      </button>
    </form>
  );
}
