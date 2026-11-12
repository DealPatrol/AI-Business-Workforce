'use client';

import { useEffect, useState } from 'react';
import styles from './desk.module.css';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the Desk service worker and offers "Add to home screen" where the browser allows it. */
export function InstallDesk() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/desk-sw.js', { scope: '/desk' }).catch(() => undefined);
    }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    try {
      if (window.localStorage.getItem('ava-desk-install-dismissed') === '1') {
        setDismissed(true);
        return;
      }
    } catch {
      // Private mode: show the hint anyway.
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) setIosHint(true);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem('ava-desk-install-dismissed', '1');
    } catch {
      // ignore
    }
  }

  if (dismissed || (!prompt && !iosHint)) return null;

  return (
    <div className={styles.install} role="region" aria-label="Install the Desk app">
      <p>
        <b>Put Ava on your home screen.</b>{' '}
        {prompt ? 'One tap opens your calls and leads like an app.' : 'Tap Share, then “Add to Home Screen”.'}
      </p>
      {prompt ? (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice.catch(() => undefined);
            setPrompt(null);
          }}
        >
          Install
        </button>
      ) : null}
      <button type="button" className={styles.installClose} onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
