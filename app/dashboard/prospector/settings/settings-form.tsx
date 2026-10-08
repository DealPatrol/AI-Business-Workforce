'use client';

import { FormEvent, useState } from 'react';
import type { ProspectorConfig, ProspectorSettings } from '@/lib/prospector/types';
import { prospectorRequest } from '../api';
import styles from '../prospector.module.css';

export default function SettingsForm({
  initial,
  config,
}: {
  initial: ProspectorSettings;
  config: ProspectorConfig;
}) {
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function update<K extends keyof ProspectorSettings>(key: K, value: ProspectorSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await prospectorRequest<{ settings: ProspectorSettings }>('/api/prospector/settings', settings, 'PUT');
      setSettings(result.settings);
      setNotice('Settings saved.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={save}>
      <div className={styles.eyebrow}>YOUR DOMAIN</div>
      <h2>Sending settings</h2>
      <p className={styles.quiet}>
        Mail goes out from the address you enter here, through Resend on a domain you have verified. Nothing is sent until you approve a draft.
      </p>
      {!config.resend && (
        <p className={styles.info}>RESEND_API_KEY is not set. Saving these settings still works. Sending stays off until the key and a verified domain are in place.</p>
      )}
      {error && <p className={styles.alert} role="alert">{error}</p>}
      {notice && <p className={styles.info}>{notice}</p>}
      <label>
        Sender name
        <input value={settings.senderName} onChange={(event) => update('senderName', event.target.value)} />
      </label>
      <label>
        Sender email
        <input value={settings.senderEmail} type="email" placeholder="you@yourdomain.com" onChange={(event) => update('senderEmail', event.target.value)} />
      </label>
      <label>
        Physical mailing address
        <textarea
          value={settings.mailingAddress}
          placeholder="Street, city, state, postal code"
          onChange={(event) => update('mailingAddress', event.target.value)}
        />
      </label>
      <p className={styles.quiet}>Required before any send. It is printed in the footer. The app does not ship with an address filled in.</p>
      <label>
        Booking link
        <input value={settings.bookingUrl} type="url" placeholder="https://cal.com/your-name" onChange={(event) => update('bookingUrl', event.target.value)} />
      </label>
      <label>
        Daily send cap
        <input
          value={settings.dailyCap}
          type="number"
          min={1}
          max={200}
          onChange={(event) => update('dailyCap', Number(event.target.value))}
        />
      </label>
      <p className={styles.quiet}>Default 25. The counter resets at 00:00 UTC and only counts successful sends.</p>
      <label>
        Seconds between sends
        <input
          value={settings.sendSpacingSeconds}
          type="number"
          min={30}
          max={3600}
          onChange={(event) => update('sendSpacingSeconds', Number(event.target.value))}
        />
      </label>
      <label>
        Default location
        <input value={settings.defaultLocation} placeholder="Austin, TX" onChange={(event) => update('defaultLocation', event.target.value)} />
      </label>
      <button className={styles.primary} type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
    </form>
  );
}
