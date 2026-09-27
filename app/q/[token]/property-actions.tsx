'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import styles from './qr-page.module.css';

export default function PropertyActions({ token }: { token: string }) {
  const [photoMessage, setPhotoMessage] = useState('');
  const [optOutMessage, setOptOutMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setPhotoMessage('');
    try {
      const form = new FormData(event.currentTarget);
      form.set('licenseAccepted', form.get('licenseAccepted') === 'on' ? 'true' : 'false');
      const response = await fetch(`/api/q/${encodeURIComponent(token)}/photo`, {
        method: 'POST',
        body: form,
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || 'Photo upload failed.');
      event.currentTarget.reset();
      setPhotoMessage(payload.message || 'Photo received.');
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'Photo upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function optOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setOptOutMessage('');
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/q/${encodeURIComponent(token)}/opt-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doNotPhotograph: form.get('doNotPhotograph') === 'on',
          doNotMail: form.get('doNotMail') === 'on',
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not save opt-out.');
      setOptOutMessage(payload.message || 'Opt-out saved.');
    } catch (error) {
      setOptOutMessage(error instanceof Error ? error.message : 'Could not save opt-out.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.propertyActions}>
      <details>
        <summary>Send us a better photo</summary>
        <form onSubmit={uploadPhoto}>
          <p>Upload a clear yard photo for a revised design concept.</p>
          <input name="file" type="file" accept="image/*" capture="environment" required />
          <label className={styles.license}>
            <input name="licenseAccepted" type="checkbox" required />
            <span>
              I confirm I own or took this photo and grant the contractor and YardProof a
              non-exclusive license to store, privacy-redact, edit with AI, display, and print it
              solely for this property’s estimate and campaign materials.{' '}
              <Link href="/terms#photo-upload-license" target="_blank">Read the photo terms.</Link>
            </span>
          </label>
          <button type="submit" disabled={busy}>Upload photo</button>
          {photoMessage && <small role="status">{photoMessage}</small>}
        </form>
      </details>

      <details>
        <summary>Don’t photograph or mail my home</summary>
        <form onSubmit={optOut}>
          <label className={styles.license}>
            <input name="doNotPhotograph" type="checkbox" defaultChecked />
            <span>Do not photograph this property.</span>
          </label>
          <label className={styles.license}>
            <input name="doNotMail" type="checkbox" defaultChecked />
            <span>Do not send future YardProof mail to this address.</span>
          </label>
          <button type="submit" disabled={busy}>Save opt-out</button>
          {optOutMessage && <small role="status">{optOutMessage}</small>}
        </form>
      </details>
    </section>
  );
}
