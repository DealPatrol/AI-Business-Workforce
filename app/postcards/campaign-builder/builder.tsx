'use client';

import { useMemo, useState } from 'react';

type Parcel = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  yearBuilt: number | null;
  lotAcres: number | null;
  ownerOccupied: boolean | null;
  lastSaleDate: string | null;
};

const PRICE = { monthly: 99, '4x6': 1.49, '6x9': 1.79 } as const;

export default function CampaignBuilder() {
  const [mode, setMode] = useState<'zip' | 'radius'>('zip');
  const [form, setForm] = useState({
    zip: '35077',
    lat: '',
    lng: '',
    radiusMiles: '0.5',
    minHomeAge: '',
    maxHomeAge: '',
    minLotAcres: '',
    maxLotAcres: '',
    ownerOccupiedOnly: true,
    soldWithinMonths: '',
    excludePermitYears: '',
  });
  const [size, setSize] = useState<'4x6' | '6x9'>('4x6');
  const [result, setResult] = useState<{ source: string; permitSource: string; count: number; scanned: number; parcels: Parcel[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const search = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = mode === 'zip' ? { ...form, lat: '', lng: '' } : { ...form, zip: '' };
      const res = await fetch('/api/targeting/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const mailCost = useMemo(() => (result ? result.count * PRICE[size] : 0), [result, size]);
  const field: React.CSSProperties = { display: 'grid', gap: 4, fontSize: 14 };
  const input: React.CSSProperties = { padding: 8, border: '1px solid #ccc', borderRadius: 6 };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'grid', gap: 12, background: '#fff', border: '1px solid #e3e3e3', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <label><input type="radio" checked={mode === 'zip'} onChange={() => setMode('zip')} /> By ZIP code</label>
          <label><input type="radio" checked={mode === 'radius'} onChange={() => setMode('radius')} /> Around a finished job</label>
        </div>
        {mode === 'zip' ? (
          <label style={field}>ZIP code<input style={input} value={form.zip} onChange={set('zip')} inputMode="numeric" maxLength={5} /></label>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
            <label style={field}>Job latitude<input style={input} value={form.lat} onChange={set('lat')} placeholder="34.0687" /></label>
            <label style={field}>Job longitude<input style={input} value={form.lng} onChange={set('lng')} placeholder="-86.7672" /></label>
            <label style={field}>Radius (miles)<input style={input} value={form.radiusMiles} onChange={set('radiusMiles')} /></label>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          <label style={field}>Home age at least (yrs)<input style={input} value={form.minHomeAge} onChange={set('minHomeAge')} /></label>
          <label style={field}>Home age at most (yrs)<input style={input} value={form.maxHomeAge} onChange={set('maxHomeAge')} /></label>
          <label style={field}>Lot at least (acres)<input style={input} value={form.minLotAcres} onChange={set('minLotAcres')} /></label>
          <label style={field}>Lot at most (acres)<input style={input} value={form.maxLotAcres} onChange={set('maxLotAcres')} /></label>
          <label style={field}>Sold within (months)<input style={input} value={form.soldWithinMonths} onChange={set('soldWithinMonths')} placeholder="e.g. 12" /></label>
          <label style={field}>Skip homes with a permit in last (yrs)<input style={input} value={form.excludePermitYears} onChange={set('excludePermitYears')} placeholder="optional" /></label>
        </div>
        <label><input type="checkbox" checked={form.ownerOccupiedOnly} onChange={set('ownerOccupiedOnly')} /> Owner-occupied homes only</label>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>Card size:</span>
          <label><input type="radio" checked={size === '4x6'} onChange={() => setSize('4x6')} /> 4×6 (${PRICE['4x6'].toFixed(2)})</label>
          <label><input type="radio" checked={size === '6x9'} onChange={() => setSize('6x9')} /> 6×9 (${PRICE['6x9'].toFixed(2)})</label>
        </div>
        <button type="button" onClick={search} disabled={busy} style={{ padding: '10px 16px', borderRadius: 8, background: '#1f5130', color: '#fff', border: 0, fontWeight: 700 }}>
          {busy ? 'Finding homes…' : 'Find matching homes'}
        </button>
        {error && <p style={{ color: '#b00020' }}>{error}</p>}
      </section>

      {result && (
        <section style={{ display: 'grid', gap: 12 }}>
          {result.source === 'sample' && (
            <p style={{ background: '#fff7d6', padding: 10, borderRadius: 8 }}>
              SAMPLE DATA: these are made-up addresses so you can try the builder. Real property records turn on once the parcel-data connection is live.
            </p>
          )}
          <h3 style={{ margin: 0 }}>
            {result.count} homes match · estimated mailing ${mailCost.toFixed(2)} + ${PRICE.monthly}/mo
          </h3>
          <small>Print and postage included. Nothing mails until you approve the list, photos, and total.</small>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>{['Address', 'ZIP', 'Built', 'Lot (ac)', 'Owner-occupied', 'Last sale'].map((h) => <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {result.parcels.slice(0, 50).map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: 6 }}>{p.address}</td>
                    <td style={{ padding: 6 }}>{p.zip}</td>
                    <td style={{ padding: 6 }}>{p.yearBuilt ?? '—'}</td>
                    <td style={{ padding: 6 }}>{p.lotAcres ?? '—'}</td>
                    <td style={{ padding: 6 }}>{p.ownerOccupied == null ? '—' : p.ownerOccupied ? 'Yes' : 'No'}</td>
                    <td style={{ padding: 6 }}>{p.lastSaleDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
