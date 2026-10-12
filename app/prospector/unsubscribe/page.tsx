import type { Metadata } from 'next';
import { normalizeEmail } from '@/lib/prospector/gates';
import { unsubscribeSecret, verifyUnsubscribeToken } from '@/lib/prospector/unsubscribe-token';
import { createAdminClient } from '@/lib/supabase/admin';
import styles from './unsubscribe.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const secret = unsubscribeSecret();
  const verified = token && secret ? verifyUnsubscribeToken(token, secret) : null;
  let saved = false;
  let setupError = false;

  if (token && !secret) {
    console.error('unsubscribe: no PROSPECTOR_UNSUBSCRIBE_SECRET / SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY configured');
    setupError = true;
  }

  if (verified) {
    try {
      const admin = createAdminClient();
      const email = normalizeEmail(verified.email);
      const { error } = await admin.from('prospector_suppressions').upsert(
        { owner_id: verified.ownerId, email, reason: 'unsubscribe' },
        { onConflict: 'owner_id,email' },
      );
      if (error) {
        console.error('unsubscribe: suppression upsert failed', error);
        setupError = true;
      } else {
        saved = true;
        const { error: leadError } = await admin
          .from('prospector_leads')
          .update({ status: 'do_not_contact', updated_at: new Date().toISOString() })
          .eq('owner_id', verified.ownerId)
          .contains('emails', [email]);
        if (leadError) console.error('unsubscribe: lead status update failed', leadError);
      }
    } catch (error) {
      console.error('unsubscribe failed', error);
      saved = false;
      setupError = true;
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{saved ? 'You are unsubscribed' : 'Unsubscribe link not completed'}</h1>
        {saved ? (
          <p>
            {verified?.email} will not receive more Lead Finder email from this sender. The address is on the do-not-contact list,
            and it is checked before every send.
          </p>
        ) : (
          <p>
            {setupError
              ? 'We could not save your unsubscribe request because of a server error. Reply to the message you received and ask to be removed, and we will remove you manually.'
              : 'This unsubscribe link is invalid or expired. Reply to the message you received and ask to be removed.'}
          </p>
        )}
      </section>
    </main>
  );
}
