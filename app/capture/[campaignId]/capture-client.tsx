'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { Camera, CheckCircle2, LocateFixed, Upload } from 'lucide-react';
import { nearestCaptureCandidate } from '@/lib/capture';
import styles from './capture.module.css';

export type CaptureRecipient = {
  id: string;
  homeowner_name: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  do_not_photograph: boolean;
  current_image_source: string | null;
  privacy_redaction_status: string | null;
};

type Position = {
  latitude: number;
  longitude: number;
  heading: number | null;
  capturedAt: string;
};

function address(recipient: CaptureRecipient): string {
  return [
    recipient.address_line_1,
    recipient.address_line_2,
    `${recipient.city}, ${recipient.state} ${recipient.postal_code}`,
  ]
    .filter(Boolean)
    .join(', ');
}

function currentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: Number.isFinite(coords.heading) ? coords.heading : null,
          capturedAt: new Date(timestamp).toISOString(),
        }),
      () => reject(new Error('Allow precise location to match this photo to an address.')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 },
    );
  });
}

export default function CaptureClient(props: {
  campaignId: string;
  recipients: CaptureRecipient[];
}) {
  const eligible = useMemo(
    () => props.recipients.filter((recipient) => !recipient.do_not_photograph),
    [props.recipients],
  );
  const [photographer, setPhotographer] = useState('');
  const [recipientId, setRecipientId] = useState(eligible[0]?.id ?? '');
  const [position, setPosition] = useState<Position | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);

  async function locate() {
    const next = await currentPosition();
    setPosition(next);
    const nearest = nearestCaptureCandidate(
      next,
      eligible.map((recipient) => ({
        id: recipient.id,
        latitude: recipient.latitude,
        longitude: recipient.longitude,
        doNotPhotograph: recipient.do_not_photograph,
      })),
    );
    if (nearest) {
      setRecipientId(nearest.candidate.id);
      setDistance(nearest.distanceMeters);
    } else {
      setDistance(null);
      setMessage('No geocoded address was nearby. Choose the address manually.');
    }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile) {
      void locate().catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'Could not read GPS.');
      });
    }
  }

  async function upload() {
    if (!file || !recipientId || !photographer.trim()) {
      setMessage('Photographer, address, and photo are required.');
      return;
    }
    setBusy(true);
    setMessage('Running privacy redaction and uploading…');
    try {
      const latestPosition = position ?? (await currentPosition());
      const form = new FormData();
      form.set('recipientId', recipientId);
      form.set('source', 'crew_photo');
      form.set('rightsBasis', 'crew_owned');
      form.set('capturedBy', photographer.trim());
      form.set('capturedAt', latestPosition.capturedAt);
      form.set('captureLat', String(latestPosition.latitude));
      form.set('captureLng', String(latestPosition.longitude));
      if (latestPosition.heading != null) {
        form.set('captureHeading', String(latestPosition.heading));
      }
      form.set('file', file);
      const response = await fetch('/api/imagery/crew-photo', { method: 'POST', body: form });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Upload failed.');
      setCompleted((current) => [...current, recipientId]);
      setFile(null);
      setMessage('Captured, privacy-redacted, and matched. Ready for the next property.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.captureCard}>
      <label>
        Photographer
        <input
          value={photographer}
          onChange={(event) => setPhotographer(event.target.value)}
          autoComplete="name"
          placeholder="Crew member name"
          maxLength={200}
        />
      </label>

      <div className={styles.cameraInput}>
        <Camera />
        <b>Take property photo</b>
        <span>Use the rear camera from the public right-of-way.</span>
        <input type="file" accept="image/*" capture="environment" onChange={choosePhoto} />
      </div>

      <button className={styles.locate} type="button" onClick={() => void locate()} disabled={busy}>
        <LocateFixed size={17} /> Refresh GPS match
      </button>

      <label>
        Matched address
        <select value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
          {eligible.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {completed.includes(recipient.id) ? '✓ ' : ''}
              {address(recipient)}
            </option>
          ))}
        </select>
      </label>
      {distance != null && <small>Nearest queued address: {Math.round(distance)} meters away. Confirm before upload.</small>}

      <button
        className={styles.upload}
        type="button"
        disabled={busy || !file || !recipientId || !photographer.trim()}
        onClick={() => void upload()}
      >
        {busy ? <Upload size={18} /> : <CheckCircle2 size={18} />}
        {busy ? 'Processing…' : 'Confirm match & upload'}
      </button>
      {message && <p role="status">{message}</p>}
      <footer>
        {eligible.length} eligible · {props.recipients.length - eligible.length} suppressed ·{' '}
        {completed.length} captured this session
      </footer>
    </section>
  );
}
