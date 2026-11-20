import { EXTERNAL_PROVIDER_LABELS, externalCalendarFor } from '@/lib/ava/booking/external-calendars';
import styles from './desk.module.css';

/** Cal.com / Calendly busy-time link for the owner's Ava calendar (server component). */
export async function ExternalCalendarPanel({ calendarId }: { calendarId: string }) {
  const link = await externalCalendarFor(calendarId);
  if (link?.external_calendar_provider) {
    return (
      <div className={styles.googleSync}>
        <p>
          <b>{EXTERNAL_PROVIDER_LABELS[link.external_calendar_provider]} connected.</b> Ava skips times already booked
          there when she offers windows.
        </p>
        <form method="post" action="/api/desk/external-calendar">
          <input type="hidden" name="action" value="disconnect" />
          <button type="submit">Disconnect</button>
        </form>
      </div>
    );
  }
  return (
    <div className={styles.googleSync}>
      <p>
        <b>Use Cal.com or Calendly?</b> Paste a key so Ava skips times already booked there. Cal.com: Settings →
        Developer → API keys. Calendly: Integrations → API &amp; Webhooks → Personal access token. The key is stored
        encrypted and only used to read busy times.
      </p>
      <form method="post" action="/api/desk/external-calendar" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <select name="provider" defaultValue="calcom" aria-label="Calendar app">
          <option value="calcom">Cal.com</option>
          <option value="calendly">Calendly</option>
        </select>
        <input name="token" type="password" autoComplete="off" placeholder="Paste your key" aria-label="API key" required />
        <button type="submit">Connect</button>
      </form>
    </div>
  );
}
