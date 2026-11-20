import { webhookForOnboarding, WEBHOOK_SIGNATURE_HEADER } from '@/lib/ava/integrations/webhook';
import styles from './desk.module.css';

export const WEBHOOK_STATUS: Record<string, string> = {
  saved: 'Webhook saved. Every finished call is sent there.',
  removed: 'Webhook removed.',
  invalid: 'Use a full https:// address on the public internet.',
  test_ok: 'Test event delivered.',
  test_failed: 'The test event did not get a 2xx answer. Check the URL and try again.',
  none: 'Save a webhook URL first.',
  busy: 'Too many tries. Wait a few minutes.',
  setup: 'Finish setup first.',
  signin: 'Sign in again.',
  failed: 'That did not save. Try again in a minute.',
};

/** Zapier / Make / custom webhook for every finished call (server component, owner-only page). */
export async function WebhookPanel({ onboardingId, status }: { onboardingId: string; status: string }) {
  const hook = await webhookForOnboarding(onboardingId);
  return (
    <section id="integrations" className={styles.panel} aria-labelledby="integrations-title">
      <div className={styles.panelHead}>
        <h2 id="integrations-title">Send calls to your other tools</h2>
      </div>
      <p className={styles.help}>
        After every call, Ava can POST the caller’s name, number, address, need, urgency, summary, and any booking to a
        webhook. In Zapier use <b>Webhooks by Zapier → Catch Hook</b> and paste its URL here, then send it on to your CRM,
        Jobber, Housecall Pro, a Google Sheet, or anything else Zapier connects to. Make and n8n work the same way.
      </p>
      {status ? <p className={styles.googleNote} role="status">{status}</p> : null}
      <form method="post" action="/api/desk/webhook" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input type="hidden" name="action" value="save" />
        <input
          name="url"
          type="url"
          required
          placeholder="https://hooks.zapier.com/hooks/catch/…"
          defaultValue={hook?.url || ''}
          aria-label="Webhook URL"
          style={{ flex: '1 1 320px' }}
        />
        <button type="submit">{hook ? 'Update' : 'Save'}</button>
      </form>
      {hook ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <form method="post" action="/api/desk/webhook">
              <input type="hidden" name="action" value="test" />
              <button type="submit">Send a test event</button>
            </form>
            <form method="post" action="/api/desk/webhook">
              <input type="hidden" name="action" value="remove" />
              <button type="submit">Remove</button>
            </form>
          </div>
          <details className={styles.help}>
            <summary>Signing secret (optional, for developers)</summary>
            <p>
              Each request carries <code>{WEBHOOK_SIGNATURE_HEADER}: t=…,v1=…</code>, an HMAC-SHA256 of
              <code> t.body</code> with this secret: <code>{hook.secret}</code>
            </p>
          </details>
        </>
      ) : null}
    </section>
  );
}
