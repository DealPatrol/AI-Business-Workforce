import type { Metadata } from 'next';
import { applyUnsubscribe } from '@/lib/prospector/apply-unsubscribe';
import styles from './unsubscribe.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
  alternates: { canonical: '/prospector/unsubscribe' },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await applyUnsubscribe(token);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>{result.saved ? 'You are unsubscribed' : 'Unsubscribe link not completed'}</h1>
        {result.saved ? (
          <p>
            {result.email} will not receive more Lead Finder email from this sender. The address is on the do-not-contact list,
            and it is checked before every send.
          </p>
        ) : (
          <p>This unsubscribe link is invalid or could not be saved. Reply to the message you received and ask to be removed.</p>
        )}
      </section>
    </main>
  );
}
