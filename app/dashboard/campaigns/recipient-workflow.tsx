'use client';

import { ChangeEvent, useState } from 'react';
import styles from './campaigns.module.css';

type Props = {
  recipientId: string;
  initialCurrentUrl: string | null;
  initialCurrentSource: string | null;
  initialAfterUrl: string | null;
  initialReviewStatus: string;
  streetViewAvailable: boolean | null;
  mailStatus: string;
};

async function responseJson(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    [key: string]: unknown;
  };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

export default function RecipientWorkflow(props: Props) {
  const [currentUrl, setCurrentUrl] = useState(props.initialCurrentUrl);
  const [currentSource, setCurrentSource] = useState(props.initialCurrentSource);
  const [afterUrl, setAfterUrl] = useState(props.initialAfterUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState(props.initialReviewStatus);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  function fetchStreetView() {
    void run(async () => {
      const payload = await responseJson(
        await fetch('/api/imagery/streetview-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: props.recipientId }),
        }),
      );
      setPreviewUrl(String(payload.previewUrl));
      if (payload.currentImageUrl) {
        setCurrentUrl(String(payload.currentImageUrl));
        setCurrentSource('street_view');
      }
      setMessage(String(payload.note || 'Street View lookup complete.'));
    });
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    void run(async () => {
      const form = new FormData();
      form.set('recipientId', props.recipientId);
      form.set('source', 'owner_upload');
      form.set('file', file);
      const payload = await responseJson(
        await fetch('/api/imagery/crew-photo', { method: 'POST', body: form }),
      );
      setCurrentUrl(String(payload.currentImageUrl));
      setCurrentSource('owner_upload');
      setAfterUrl(null);
      setReviewStatus('pending');
      setMessage('Owner photo uploaded. Generate a fresh after concept before approval.');
    });
  }

  function renderAfter() {
    void run(async () => {
      const payload = await responseJson(
        await fetch('/api/imagery/after-render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: props.recipientId, trade: 'landscaping' }),
        }),
      );
      setAfterUrl(String(payload.afterImageUrl));
      setReviewStatus('pending_review');
      setMessage('After concept generated. Review both images before approval.');
    });
  }

  function approve() {
    void run(async () => {
      await responseJson(
        await fetch('/api/imagery/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientId: props.recipientId, status: 'approved' }),
        }),
      );
      setReviewStatus('approved');
      setMessage('Creative approved. Campaign approval is still required before mailing.');
    });
  }

  const displayedCurrent = currentUrl || previewUrl;
  return (
    <div className={styles.workflow}>
      <div className={styles.workflowImages}>
        {displayedCurrent ? <img src={displayedCurrent} alt="Property before preview" /> : <span>No before image</span>}
        {afterUrl ? <img src={afterUrl} alt="Illustrative after concept" /> : <span>No after concept</span>}
      </div>
      <div className={styles.workflowStatus}>
        <span>Before: {currentSource || (previewUrl ? 'Street View preview only' : 'pending')}</span>
        <span>Review: {reviewStatus}</span>
        <span>Mail: {props.mailStatus}</span>
      </div>
      <div className={styles.workflowActions}>
        <button type="button" disabled={busy} onClick={fetchStreetView}>
          {props.streetViewAvailable === false ? 'Retry Street View' : 'Fetch Street View'}
        </button>
        <label>
          Upload owner photo
          <input type="file" accept="image/*" disabled={busy} onChange={upload} />
        </label>
        <button type="button" disabled={busy || !currentUrl} onClick={renderAfter}>
          Generate after
        </button>
        <button type="button" disabled={busy || !currentUrl || !afterUrl} onClick={approve}>
          Approve creative
        </button>
      </div>
      {message && <p className={styles.workflowMessage}>{message}</p>}
    </div>
  );
}
