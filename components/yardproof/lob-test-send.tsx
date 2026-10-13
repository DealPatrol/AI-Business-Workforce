'use client';

import { useState } from 'react';

/** Sends approved cards through Lob TEST mode (nothing prints or mails). */
export default function LobTestSend({ campaignId }: { campaignId: string }) {
  const [from, setFrom] = useState({ address_line1: '', address_city: '', address_state: 'AL', address_zip: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/campaigns/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, from }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
      setMsg(`Test send done: ${data.sent} sent, ${data.failed} failed. Test mode: nothing was printed or mailed.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };
  const inp: React.CSSProperties = { padding: 8, border: '1px solid #ccc', borderRadius: 6 };
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, margin: '24px 0', display: 'grid', gap: 8 }}>
      <h3 style={{ margin: 0 }}>Send approved cards (Lob test mode)</h3>
      <small>Sends every approved card that has both a BEFORE and AFTER photo. Test mode only: nothing prints or mails.</small>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
        <input style={inp} placeholder="Return street" value={from.address_line1} onChange={(e) => setFrom({ ...from, address_line1: e.target.value })} />
        <input style={inp} placeholder="City" value={from.address_city} onChange={(e) => setFrom({ ...from, address_city: e.target.value })} />
        <input style={inp} placeholder="State" maxLength={2} value={from.address_state} onChange={(e) => setFrom({ ...from, address_state: e.target.value })} />
        <input style={inp} placeholder="ZIP" value={from.address_zip} onChange={(e) => setFrom({ ...from, address_zip: e.target.value })} />
      </div>
      <button type="button" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send test batch'}</button>
      {msg && <small>{msg}</small>}
    </section>
  );
}
