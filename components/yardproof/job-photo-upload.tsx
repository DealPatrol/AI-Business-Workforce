'use client';

import { useState } from 'react';

type Props = {
  recipientId: string;
  onUploaded?: (slot: 'before' | 'after', url: string) => void;
};

/**
 * Client's own BEFORE + AFTER job photos for a postcard. These are the only
 * printable images (no Google Street View / Static Maps, no AI renders).
 */
export default function JobPhotoUpload({ recipientId, onUploaded }: Props) {
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const upload = async () => {
    setBusy(true);
    setMsg(null);
    try {
      for (const [slot, file] of [['before', before], ['after', after]] as const) {
        if (!file) continue;
        const form = new FormData();
        form.set('recipientId', recipientId);
        form.set('source', 'crew_photo');
        form.set('slot', slot);
        form.set('rightsConfirmed', confirmed ? 'true' : 'false');
        form.set('file', file);
        const res = await fetch('/api/imagery/crew-photo', { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
        onUploaded?.(slot, data.imageUrl);
      }
      setMsg('Photos uploaded. Review and approve the card.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
      <legend>Your job photos</legend>
      <label>
        BEFORE photo{' '}
        <input type="file" accept="image/*" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} />
      </label>
      <label>
        AFTER photo{' '}
        <input type="file" accept="image/*" onChange={(e) => setAfter(e.target.files?.[0] ?? null)} />
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span>
          I took these photos (or own the rights to them), and the homeowner said it&rsquo;s OK to show
          their property on a postcard.
        </span>
      </label>
      <button type="button" onClick={upload} disabled={busy || !confirmed || (!before && !after)}>
        {busy ? 'Uploading…' : 'Upload photos'}
      </button>
      {msg && <small>{msg}</small>}
    </fieldset>
  );
}
