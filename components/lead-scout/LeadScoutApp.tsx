'use client';

import { useState, type FormEvent } from 'react';
import { LEAD_SCOUT_TRADES } from '@/lib/lead-scout/input';
import styles from '@/components/suite/suite.module.css';

type Place = {
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
};

export function LeadScoutApp() {
  const [trade, setTrade] = useState<string>(LEAD_SCOUT_TRADES[0]);
  const [city, setCity] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNote('');
    setPlaces([]);
    try {
      const response = await fetch('/api/lead-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade, city }),
      });
      const payload = (await response.json().catch(() => null)) as { places?: Place[]; note?: string; error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || 'The search could not be completed.');
        return;
      }
      setPlaces(payload?.places || []);
      setNote(payload?.note || '');
    } catch {
      setError('The search could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'grid', gap: 6, margin: '14px 0', fontWeight: 700 }}>
          Trade
          <select value={trade} onChange={(event) => setTrade(event.target.value)} style={{ font: 'inherit', padding: 12 }}>
            {LEAD_SCOUT_TRADES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6, margin: '14px 0', fontWeight: 700 }}>
          City
          <input value={city} onChange={(event) => setCity(event.target.value)} required minLength={2} maxLength={80} placeholder="Hanceville, AL" style={{ font: 'inherit', padding: 12 }} />
        </label>
        <button className={styles.button} type="submit" disabled={busy} style={{ border: 0, cursor: 'pointer' }}>
          {busy ? 'Searching…' : 'Search public listings'}
        </button>
      </form>
      {error ? (
        <p role="alert" className={styles.bad}>
          {error}
        </p>
      ) : null}
      {note ? <p>{note}</p> : null}
      {places.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Site</th>
              </tr>
            </thead>
            <tbody>
              {places.map((place) => (
                <tr key={`${place.name}-${place.address}`}>
                  <td>
                    {place.name}
                    <div className={styles.quiet}>
                      {place.category}
                      {place.rating != null ? ` · ${place.rating}` : ''}
                      {place.reviewCount != null ? ` (${place.reviewCount})` : ''}
                    </div>
                  </td>
                  <td>{place.address}</td>
                  <td>{place.phone || '—'}</td>
                  <td>
                    {place.mapsUrl ? (
                      <a href={place.mapsUrl} rel="noreferrer">
                        Map
                      </a>
                    ) : null}{' '}
                    {place.website ? (
                      <a href={place.website} rel="noreferrer">
                        Site
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
