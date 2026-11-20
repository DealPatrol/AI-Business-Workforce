'use client';

import { FormEvent, useState } from 'react';
import type { SiteProfile } from '@/lib/ava/onboarding/site-profile';
import styles from './onboarding-tools.module.css';

export type WebsiteDraft = { profile: SiteProfile; servicesDraft: string };

/** "Paste your website": drafts the onboarding answers from the owner's own site. */
export function WebsiteImport({ onDraft }: { onDraft: (draft: WebsiteDraft) => void }) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<SiteProfile | null>(null);

  async function scan(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    setState('loading');
    setMessage('');
    try {
      const res = await fetch('/api/ava/onboarding/scan-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.profile) throw new Error(data.error || 'Could not read that website.');
      setProfile(data.profile);
      onDraft(data as WebsiteDraft);
      setState('done');
      setMessage('Drafted from your website. Check every answer below before you submit.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not read that website.');
    }
  }

  return (
    <form className={styles.box} onSubmit={scan} aria-label="Fill from your website">
      <h3>Start from your website</h3>
      <p>Paste your website and we will draft your business name, hours, services, and common answers for Ava. You can edit everything.</p>
      <div className={styles.row}>
        <input
          type="text"
          inputMode="url"
          placeholder="yourshop.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Your website"
        />
        <button className={styles.btn} type="submit" disabled={state === 'loading'}>
          {state === 'loading' ? 'Reading your site…' : 'Fill from my website'}
        </button>
      </div>
      {message ? <p className={state === 'error' ? styles.err : styles.ok}>{message}</p> : null}
      {profile ? (
        <ul className={styles.found}>
          <li><b>Name</b> {profile.businessName || 'Not found'}</li>
          <li><b>Hours</b> {profile.hours || 'Not found, add them below'}</li>
          <li><b>Phone</b> {profile.phone || 'Not found'}</li>
          <li><b>Services</b> {profile.services.length ? profile.services.slice(0, 6).join(', ') : 'Not found'}</li>
          <li><b>Answers</b> {profile.faqs.length} FAQ{profile.faqs.length === 1 ? '' : 's'} found</li>
        </ul>
      ) : null}
    </form>
  );
}
