'use client';

import { useEffect, useState } from 'react';
import styles from './campaigns.module.css';

type Preview = {
  mode: 'test' | 'live';
  configured: boolean;
  liveEnabled: boolean;
  postcardSize: string;
  pricePerCardCents: number | null;
  eligibleCount: number;
  totalRecipients: number;
  estimatedTotalCents: number | null;
  streetViewPostcardEnabled: boolean;
};

function money(cents: number | null): string {
  return cents == null ? 'Not configured' : new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function CampaignMailPanel(props: { campaignId: string; campaignName: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/mail/campaigns/${props.campaignId}`, { cache: 'no-store' });
    const payload = (await response.json()) as Preview & { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Could not load mailing preview.');
    setPreview(payload);
  }

  useEffect(() => {
    void load().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Could not load mailing preview.');
    });
  }, [props.campaignId]);

  async function approveAndSend() {
    if (!preview) return;
    const confirmed = window.confirm(
      `Approve ${preview.eligibleCount} ${preview.postcardSize} postcard(s) for ${money(preview.estimatedTotalCents)} in ${preview.mode.toUpperCase()} mode?`,
    );
    if (!confirmed) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/mail/campaigns/${props.campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalConfirmed: true }),
      });
      const payload = (await response.json()) as {
        error?: string;
        sentCount?: number;
        failedCount?: number;
        mode?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Mail request failed.');
      setMessage(
        `${payload.sentCount} postcard job(s) created in ${payload.mode} mode; ${payload.failedCount} failed.`,
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Mail request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.mailPanel}>
      <div>
        <span>PRINT &amp; MAIL</span>
        <h2>{props.campaignName}</h2>
        {!preview ? <p>Loading cost preview…</p> : (
          <>
            <p>
              {preview.eligibleCount} of {preview.totalRecipients} recipients eligible ·{' '}
              {preview.postcardSize} · {preview.mode.toUpperCase()} mode
            </p>
            <strong>{money(preview.estimatedTotalCents)} estimated</strong>
            <small>
              {money(preview.pricePerCardCents)} configured per card. Vendor invoices may differ.
            </small>
            {!preview.streetViewPostcardEnabled && (
              <small>Street View printing is OFF; approved owner/crew imagery remains eligible.</small>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        disabled={
          busy ||
          !preview?.configured ||
          preview.eligibleCount === 0 ||
          preview.estimatedTotalCents == null
        }
        onClick={approveAndSend}
      >
        {busy ? 'Sending…' : 'Approve & send'}
      </button>
      {message && <p className={styles.workflowMessage}>{message}</p>}
    </section>
  );
}
