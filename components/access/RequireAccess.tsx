import type { ReactNode } from 'react';
import { gateProspectPage } from '@/lib/prospect-gate';
import { PasswordGate } from './PasswordGate';
import styles from './gate.module.css';

function PrivateNotice() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Private</p>
        <h1>This page is not public.</h1>
        <p>Sign-in is not configured for this environment.</p>
      </section>
    </main>
  );
}

export async function RequireAccess({
  nextPath,
  children,
}: {
  nextPath: string;
  children: ReactNode;
}) {
  const decision = await gateProspectPage(nextPath);
  switch (decision) {
    case 'allow':
      return children;
    case 'password':
      return <PasswordGate />;
    case 'locked':
      return <PrivateNotice />;
    default: {
      const unreachable: never = decision;
      return unreachable;
    }
  }
}
