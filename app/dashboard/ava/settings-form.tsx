'use client';
import { useState } from 'react';
import type { AvaClientSettings } from '@/lib/ava/client-settings';

export default function SettingsForm({ onboardingId, hasAgent, initial }: { onboardingId: string; hasAgent: boolean; initial: AvaClientSettings }) {
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus('Saving…');
    const response = await fetch('/api/ava/client/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboardingId,
        missedCallTextback: s.missed_call_textback,
        textbackMessage: s.textback_message,
        bookingUrl: s.booking_url,
        transferEnabled: s.transfer_enabled,
        transferNumber: s.transfer_number,
        transferRule: s.transfer_rule,
        emailSummaries: s.email_summaries,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return setStatus(result.error || 'Save failed');
    setStatus(result.transfer && !result.transfer.ok ? `Saved. Transfer not applied to Ava yet: ${result.transfer.error}` : 'Saved.');
  }
  const row: React.CSSProperties = { display: 'block', margin: '10px 0' };
  return (
    <form onSubmit={save}>
      <label style={row}><input type="checkbox" checked={s.email_summaries} onChange={(e) => setS({ ...s, email_summaries: e.target.checked })} /> Email me a summary + transcript after every call (you also get the lead text)</label>
      <label style={row}><input type="checkbox" checked={s.missed_call_textback} onChange={(e) => setS({ ...s, missed_call_textback: e.target.checked })} /> Missed-call text-back: if a caller hangs up before leaving details, text them back once</label>
      <label style={row}>Text-back message (optional)<br /><input style={{ width: '100%' }} maxLength={300} value={s.textback_message || ''} onChange={(e) => setS({ ...s, textback_message: e.target.value })} placeholder="Sorry we missed you — reply with what you need." /></label>
      <label style={row}>Booking link (Google Calendar appointment page, Calendly, Jobber request form…). Callers who leave a lead get it by text.<br /><input style={{ width: '100%' }} type="url" value={s.booking_url || ''} onChange={(e) => setS({ ...s, booking_url: e.target.value })} placeholder="https://calendar.app.google/…" /></label>
      <fieldset style={{ border: '1px solid #d9e2dc', borderRadius: 8 }}>
        <legend>Live transfer</legend>
        <label style={row}><input type="checkbox" checked={s.transfer_enabled} onChange={(e) => setS({ ...s, transfer_enabled: e.target.checked })} /> Let Ava transfer calls to me</label>
        <label style={row}>Transfer to (your cell)<br /><input value={s.transfer_number || ''} onChange={(e) => setS({ ...s, transfer_number: e.target.value })} placeholder="(256) 555-0100" /></label>
        <label style={row}>When to transfer<br /><input style={{ width: '100%' }} value={s.transfer_rule || ''} onChange={(e) => setS({ ...s, transfer_rule: e.target.value })} placeholder="Caller asks for a person, or water is actively leaking" /></label>
        {!hasAgent && <small>Your Ava agent is not attached yet; the transfer setting is saved and applied when it is.</small>}
      </fieldset>
      <button type="submit" style={{ marginTop: 12, padding: '8px 16px' }}>Save settings</button> <span>{status}</span>
      <p><small>Texts include “Reply STOP to opt out.” Ava only texts people who called you.</small></p>
    </form>
  );
}
