'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { unlockProspectGate } from '@/app/access/actions';
import styles from './gate.module.css';

export function PasswordGate() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    const result = await unlockProspectGate(password);
    if (!result.ok) {
      setError('That password was not recognized.');
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <p className={styles.eyebrow}>Private</p>
        <h1>This page is not public.</h1>
        <p>Enter the access password to continue.</p>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button type="submit" disabled={pending}>
          {pending ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
