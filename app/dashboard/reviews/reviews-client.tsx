'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RfBusiness } from '@/lib/reputation/store';

const box: React.CSSProperties = { border: '1px solid #d9e2dc', borderRadius: 12, padding: 16, marginBottom: 14 };
const full: React.CSSProperties = { width: '100%', margin: '4px 0 10px' };

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: response.ok, data: await response.json().catch(() => ({})) };
}

export default function ReviewsClient({ business, requests, feedback, reviewUrl, qr }: { business: RfBusiness | null; requests: Record<string, unknown>[]; feedback: Record<string, unknown>[]; reviewUrl: string; qr: string }) {
  const router = useRouter();
  const [biz, setBiz] = useState({ name: business?.name || '', googleReviewUrl: business?.google_review_url || '', facebookUrl: business?.facebook_url || '', yelpUrl: business?.yelp_url || '', replyTone: business?.reply_tone || 'friendly' });
  const [req, setReq] = useState({ channel: 'email', customerName: '', customerEmail: '', customerPhone: '', jobNote: '', consent: false });
  const [reply, setReply] = useState({ review: '', stars: 5, reviewer: '', draft: '' });
  const [msg, setMsg] = useState('');

  async function saveBiz(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await post('/api/reputation/business', { ...biz, id: business?.id });
    setMsg(ok ? 'Business saved.' : data.error);
    if (ok) router.refresh();
  }
  async function sendReq(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await post('/api/reputation/requests', { ...req, businessId: business?.id });
    setMsg(ok ? (data.sent ? `Request sent${data.testMode ? ` in TEST MODE to ${data.to}` : ''}.` : `Saved but not sent: ${data.error}`) : data.error);
    if (ok) router.refresh();
  }
  async function draft(event: React.FormEvent) {
    event.preventDefault();
    const { ok, data } = await post('/api/reputation/reply-draft', { ...reply, businessId: business?.id });
    setReply({ ...reply, draft: ok ? data.draft : data.error });
  }
  const sent = requests.filter((row) => row.sent_at).length;
  const opened = requests.filter((row) => row.opened_at).length;

  return (
    <>
      {msg && <p role="status" style={{ background: '#eef6f0', padding: 10, borderRadius: 8 }}>{msg}</p>}
      <section style={box}>
        <h2>{business ? 'Your review links' : 'Set up your business'}</h2>
        <form onSubmit={saveBiz}>
          <label>Business name<input style={full} value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} required /></label>
          <label>Google review link (Business Profile → Ask for reviews)<input style={full} type="url" value={biz.googleReviewUrl} onChange={(e) => setBiz({ ...biz, googleReviewUrl: e.target.value })} placeholder="https://g.page/r/…/review" /></label>
          <label>Facebook reviews link (optional)<input style={full} type="url" value={biz.facebookUrl} onChange={(e) => setBiz({ ...biz, facebookUrl: e.target.value })} /></label>
          <label>Yelp link (optional)<input style={full} type="url" value={biz.yelpUrl} onChange={(e) => setBiz({ ...biz, yelpUrl: e.target.value })} /></label>
          <label>Reply tone<select style={full} value={biz.replyTone} onChange={(e) => setBiz({ ...biz, replyTone: e.target.value })}><option>friendly</option><option>professional</option><option>Southern and warm</option></select></label>
          <button type="submit">Save</button>
        </form>
        {business && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code for your review page" width={140} height={140} />
            <div><b>Your review page:</b><br /><a href={reviewUrl}>{reviewUrl}</a><br /><small>Print the QR on invoices or leave-behinds. Right-click the QR to save it.</small></div>
          </div>
        )}
      </section>
      {business && (
        <>
          <section style={box}>
            <h2>Job done → ask for a review</h2>
            <p><small>{sent} sent · {opened} opened · one automatic reminder after 3 days if unopened.</small></p>
            <form onSubmit={sendReq}>
              <label><input type="radio" checked={req.channel === 'email'} onChange={() => setReq({ ...req, channel: 'email' })} /> Email</label>{' '}
              <label><input type="radio" checked={req.channel === 'sms'} onChange={() => setReq({ ...req, channel: 'sms' })} /> Text</label>
              <input style={full} placeholder="Customer first name" value={req.customerName} onChange={(e) => setReq({ ...req, customerName: e.target.value })} />
              {req.channel === 'email' ? (
                <input style={full} type="email" placeholder="customer@email.com" value={req.customerEmail} onChange={(e) => setReq({ ...req, customerEmail: e.target.value })} required />
              ) : (
                <>
                  <input style={full} placeholder="Customer cell" value={req.customerPhone} onChange={(e) => setReq({ ...req, customerPhone: e.target.value })} required />
                  <label><input type="checkbox" checked={req.consent} onChange={(e) => setReq({ ...req, consent: e.target.checked })} /> This customer is a real customer of mine and agreed to receive texts from my business.</label>
                </>
              )}
              <input style={full} placeholder="Job note (private, optional)" value={req.jobNote} onChange={(e) => setReq({ ...req, jobNote: e.target.value })} />
              <button type="submit">Send review request</button>
            </form>
          </section>
          <section style={box}>
            <h2>AI reply draft</h2>
            <form onSubmit={draft}>
              <input style={full} placeholder="Reviewer name" value={reply.reviewer} onChange={(e) => setReply({ ...reply, reviewer: e.target.value })} />
              <select value={reply.stars} onChange={(e) => setReply({ ...reply, stars: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
              <textarea style={full} rows={4} placeholder="Paste the review" value={reply.review} onChange={(e) => setReply({ ...reply, review: e.target.value })} />
              <button type="submit">Draft a reply</button>
            </form>
            {reply.draft && <textarea style={full} rows={5} value={reply.draft} onChange={(e) => setReply({ ...reply, draft: e.target.value })} />}
            <small>Edit it, then paste it on Google yourself. Nothing is posted for you.</small>
          </section>
          <section style={box}>
            <h2>Private notes</h2>
            {feedback.length === 0 ? <p>None yet.</p> : feedback.map((row) => <p key={String(row.id)}>{row.rating ? `${row.rating}★ ` : ''}{String(row.comment || '')} <small>{new Date(String(row.created_at)).toLocaleDateString()}</small></p>)}
          </section>
          <section style={box}>
            <h2>Requests</h2>
            {requests.map((row) => <p key={String(row.id)}>{String(row.customer_name || row.customer_email || row.customer_phone)} · {String(row.channel)} · {String(row.status)}{row.opened_at ? ' · opened' : ''}{row.reminder_sent_at ? ' · reminded' : ''}</p>)}
          </section>
        </>
      )}
    </>
  );
}
