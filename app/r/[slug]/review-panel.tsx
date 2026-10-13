'use client';
import { useEffect, useState } from 'react';

export default function ReviewPanel({ slug, requestId }: { slug: string; requestId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    fetch('/api/reputation/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, requestId, kind: 'open' }) }).catch(() => {});
  }, [slug, requestId]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    await fetch('/api/reputation/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, requestId, rating, comment }) });
    setDone(true);
  }
  if (done) return <p>Thanks — the owner got your note.</p>;
  return (
    <details style={{ marginTop: 24, textAlign: 'left' }}>
      <summary>Optional: send a private note to the owner too</summary>
      <form onSubmit={send}>
        <p>
          {[1, 2, 3, 4, 5].map((star) => (
            <button type="button" key={star} onClick={() => setRating(star)} aria-label={`${star} stars`} style={{ fontSize: 24, background: 'none', border: 0, cursor: 'pointer' }}>
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} style={{ width: '100%' }} maxLength={2000} />
        <button type="submit">Send private note</button>
        <p style={{ fontSize: 12 }}>This does not replace or hide the public review links above.</p>
      </form>
    </details>
  );
}
