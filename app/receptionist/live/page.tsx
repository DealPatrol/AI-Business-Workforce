import type { Metadata } from 'next';
import Link from 'next/link';
import { LiveVideoReceptionist } from '@/components/receptionist/live/LiveVideoReceptionist';
import { AVA_PLANS } from '@/lib/ava/pricing';
import styles from './live.module.css';

// Prototype: keep it out of search until it is approved.
export const metadata: Metadata = {
  title: { absolute: 'Talk Face to Face | Executive Receptionist (AI)' },
  description: 'Prototype: talk to the Executive Receptionist AI assistant on screen with your microphone.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/receptionist/live' },
};

export default function LiveReceptionistPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Prototype · AI assistant</p>
          <h1 className={styles.h1}>Put a face on your website that can answer.</h1>
          <p className={styles.lede}>
            Press Start, allow your microphone, and talk. This is the same Executive Receptionist that answers our demo
            phone line, shown as an animated assistant whose lips move with its voice.
          </p>
          <ul className={styles.points}>
            <li>Answers as the demo business “Front Porch Heating &amp; Air”</li>
            <li>Takes the caller’s name, number, and what they need</li>
            <li>Rather use the phone? The call button rings the same AI line</li>
          </ul>
          <p className={styles.pricing}>
            Executive Receptionist plans: {AVA_PLANS.starter.monthlyLabel}, {AVA_PLANS.growth.monthlyLabel}, or{' '}
            {AVA_PLANS.pro.monthlyLabel} per month. <Link href="/receptionist">See plans</Link>
          </p>
        </div>
        <LiveVideoReceptionist />
      </section>
    </main>
  );
}
