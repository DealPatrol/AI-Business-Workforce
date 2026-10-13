'use client';
import Link from 'next/link';
import { useState } from 'react';

type Place = { name: string; rating: number | null; reviews: number; address: string };
type Result = { you: Place; competitors: Place[]; score: number; ratingPts: number; volumePts: number; bonus: number; competitorAvgReviews: number; category: string; error?: string };

export default function ScoreTool() {
  const [form, setForm] = useState({ business: '', city: '', trade: '' });
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch('/api/reputation/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setResult(await response.json());
    setBusy(false);
  }
  const input: React.CSSProperties = { width: '100%', padding: 10, margin: '4px 0 10px' };
  return (
    <>
      <form onSubmit={run}>
        <input style={input} placeholder="Business name" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} required />
        <input style={input} placeholder="City, state" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <input style={input} placeholder="Trade (optional, e.g. lawn care)" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} />
        <button type="submit" disabled={busy}>{busy ? 'Checking Google…' : 'Get my score'}</button>
      </form>
      {result?.error && <p role="alert">{result.error}</p>}
      {result && !result.error && (
        <section style={{ marginTop: 24 }}>
          <h2>{result.you.name}: {result.score}/100</h2>
          <p>{result.you.rating ?? '–'}★ from {result.you.reviews} Google reviews</p>
          <p><small>Math: rating {result.ratingPts}/50 + review volume vs. competitor average ({result.competitorAvgReviews}) {result.volumePts}/40 + 4.5★ with 20+ reviews bonus {result.bonus}/10.</small></p>
          <h3>Top {result.category} competitors</h3>
          <ul>{result.competitors.map((place) => <li key={place.name}>{place.name}: {place.rating ?? '–'}★, {place.reviews} reviews</li>)}</ul>
          <p><Link href="/login?next=/dashboard/reviews">Start asking every customer for a review — free</Link></p>
          <p><small>Data from Google Maps at the time you ran this. Not affiliated with Google.</small></p>
        </section>
      )}
    </>
  );
}
