'use client';

import { useState } from 'react';
import type { AerialLeadRow } from '@/lib/aerial-leads/store';
import styles from './aerial-leads.module.css';

type Defaults = {
  areaId: string;
  areaName: string;
  bbox: [number, number, number, number];
  ratePerSqft: number;
  minStainedPct: number;
  minDarkerPct: number;
  imagery: string;
};

type ScanResponse = {
  error?: string;
  scannedParcels?: number;
  mailableParcels?: number;
  flaggedCount?: number;
  nearMisses?: Array<{ owner: string; situs: string; stainedPct: number; darkerPct: number; reasons: string[] }>;
};

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ status }: { status: AerialLeadRow['status'] }) {
  const label = { flagged: 'Needs review', approved: 'Approved', rejected: 'Rejected', test_mailed: 'Test sent' }[status];
  return <span className={`${styles.pill} ${styles[`pill_${status}`]}`}>{label}</span>;
}

function LeadCard({ lead, mail }: { lead: AerialLeadRow; mail: { enabled: boolean; reason?: string } }) {
  const [row, setRow] = useState(lead);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);

  async function review(decision: 'approve' | 'reject' | 'reset') {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/aerial-leads/${row.id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage(json.error || 'Could not save.');
    setRow({ ...row, status: json.status });
  }

  async function sendTest() {
    if (!window.confirm('Send this card to Lob in TEST mode? Test mode is free and never prints or mails anything.')) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/aerial-leads/${row.id}/send-test`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage(json.error || 'Test send failed.');
    setRow({ ...row, status: 'test_mailed', lob_postcard_id: json.lobId, lob_test_url: json.proofUrl });
    setMessage(`Lob test postcard ${json.lobId} created.`);
  }

  const m = row.mailing;
  return (
    <article className={styles.lead}>
      <div className={styles.leadHead}>
        <div>
          <h3>{row.situs_address}</h3>
          <p className={styles.muted}>
            {row.owner_name}
            {m ? ` · mail to ${m.line1}${m.line2 ? `, ${m.line2}` : ''}, ${m.city}, ${m.state} ${m.zip}` : ' · no mailing address'}
          </p>
        </div>
        <StatusPill status={row.status} />
      </div>
      <div className={styles.metrics}>
        <Metric label="Stain score" value={`${row.stain_score}/100`} />
        <Metric label="Darker than prior flight" value={`${row.darker_pct}%`} />
        <Metric label="Driveway" value={`${row.driveway_sqft.toLocaleString('en-US')} sq ft`} />
        <Metric label="Card price" value={money(row.price_dollars)} />
      </div>
      {showCard ? (
        <div className={styles.cardPair}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/aerial-leads/${row.id}/postcard?side=front`} alt="Postcard front" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/aerial-leads/${row.id}/postcard?side=back`} alt="Postcard back" loading="lazy" />
        </div>
      ) : (
        <button type="button" className={styles.linkButton} onClick={() => setShowCard(true)}>Show postcard proof</button>
      )}
      <div className={styles.actions}>
        {row.status !== 'test_mailed' && row.status !== 'approved' && (
          <button type="button" disabled={busy} onClick={() => review('approve')}>Approve card</button>
        )}
        {row.status !== 'test_mailed' && row.status !== 'rejected' && (
          <button type="button" disabled={busy} className={styles.secondary} onClick={() => review('reject')}>Reject</button>
        )}
        {(row.status === 'approved' || row.status === 'rejected') && (
          <button type="button" disabled={busy} className={styles.secondary} onClick={() => review('reset')}>Undo</button>
        )}
        {row.status === 'approved' && (
          <button type="button" disabled={busy || !mail.enabled} title={mail.enabled ? undefined : mail.reason} onClick={sendTest}>
            Send Lob test (free)
          </button>
        )}
        {row.lob_test_url && <a href={row.lob_test_url} target="_blank" rel="noreferrer">Lob test proof</a>}
      </div>
      {row.status === 'approved' && !mail.enabled && <p className={styles.muted}>{mail.reason}</p>}
      {message && <p className={styles.note}>{message}</p>}
    </article>
  );
}

export default function AerialLeadsApp({
  canScan,
  leads,
  aiPreview,
  mail,
  defaults,
}: {
  canScan: boolean;
  leads: AerialLeadRow[];
  aiPreview: boolean;
  mail: { enabled: boolean; reason?: string };
  defaults: Defaults;
}) {
  const [bbox, setBbox] = useState(defaults.bbox.join(', '));
  const [business, setBusiness] = useState({ name: '', phone: '', qrUrl: '', website: '' });
  const [rate, setRate] = useState(String(defaults.ratePerSqft));
  const [minStained, setMinStained] = useState(String(defaults.minStainedPct));
  const [minDarker, setMinDarker] = useState(String(defaults.minDarkerPct));
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  async function scan(event: React.FormEvent) {
    event.preventDefault();
    setScanning(true);
    setResult(null);
    const parts = bbox.split(',').map((v) => Number(v.trim()));
    const res = await fetch('/api/aerial-leads/scan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        areaId: defaults.areaId,
        bbox: parts,
        business,
        price: { ratePerSqft: Number(rate) },
        thresholds: { minStainedPct: Number(minStained), minDarkerPct: Number(minDarker) },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as ScanResponse;
    setScanning(false);
    setResult(res.ok ? json : { error: json.error || 'Scan failed.' });
    if (res.ok && (json.flaggedCount ?? 0) > 0) window.location.reload();
  }

  return (
    <>
      <section className={styles.panel}>
        <h2>Scan a neighborhood</h2>
        <p className={styles.muted}>
          Area: {defaults.areaName} · imagery {defaults.imagery} (free USDA NAIP) · parcels from the Cullman County Revenue Commission GIS.
          One neighborhood at a time (under 900 m a side).
        </p>
        <form className={styles.form} onSubmit={scan}>
          <label>
            Bounding box (west, south, east, north)
            <input value={bbox} onChange={(e) => setBbox(e.target.value)} />
          </label>
          <label>
            Client business name
            <input required value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} placeholder="Cullman Pressure Pros" />
          </label>
          <label>
            Phone on the card
            <input required value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="(256) 555-0142" />
          </label>
          <label>
            QR link (booking page)
            <input required type="url" value={business.qrUrl} onChange={(e) => setBusiness({ ...business, qrUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label>
            Website (optional)
            <input value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} />
          </label>
          <label>
            Price per sq ft ($)
            <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label>
            Flag when stained at least (%)
            <input inputMode="numeric" value={minStained} onChange={(e) => setMinStained(e.target.value)} />
          </label>
          <label>
            ...and darker than prior flight by (%)
            <input inputMode="numeric" value={minDarker} onChange={(e) => setMinDarker(e.target.value)} />
          </label>
          <button type="submit" disabled={!canScan || scanning}>{scanning ? 'Scanning (about 15 s)...' : 'Scan for dirty driveways'}</button>
        </form>
        {!canScan && <p className={styles.muted}>Scanning needs Supabase and the aerial leads migration.</p>}
        {result?.error && <p className={styles.alert}>{result.error}</p>}
        {result && !result.error && (
          <div className={styles.note}>
            Checked {result.mailableParcels} homeowner parcels ({result.scannedParcels} parcels total): {result.flaggedCount} flagged.
            {result.flaggedCount === 0 && result.nearMisses?.length ? (
              <ul>
                {result.nearMisses.map((n) => (
                  <li key={n.situs}>{n.situs}: {n.stainedPct}% stained, {n.darkerPct}% darker</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Flagged homes ({leads.length})</h2>
        {leads.length === 0 ? (
          <p className={styles.muted}>No saved leads yet. Run a scan above; homes that pass both thresholds show up here for your review.</p>
        ) : (
          <div className={styles.leadList}>{leads.map((l) => <LeadCard key={l.id} lead={l} mail={mail} />)}</div>
        )}
      </section>

      <section className={styles.panel}>
        <h2>How it works</h2>
        <ol className={styles.steps}>
          <li>Pick one neighborhood (under 900 m a side). The scan compares the latest public aerial flight with the one about two years earlier.</li>
          <li>Each homeowner&apos;s driveway gets a stain score. A home is flagged when it is at least {defaults.minStainedPct}% stained and {defaults.minDarkerPct}% darker than the prior flight (both adjustable above).</li>
          <li>Owner name and mailing address come from public county parcel records; businesses and incomplete addresses are skipped.</li>
          <li>
            Each card shows the real aerial on the front and a cleaned preview on the back
            {aiPreview ? ' (AI-cleaned, made once per card, then reused)' : ' (free digital preview)'}, with your price, phone, and QR code.
          </li>
          <li>Nothing mails until you approve the card, and sending is Lob test mode only: free, never printed or posted.</li>
        </ol>
      </section>
    </>
  );
}
