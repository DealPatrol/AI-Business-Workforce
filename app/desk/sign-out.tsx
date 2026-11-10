'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './desk.module.css';

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className={styles.signOut}
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace('/login?next=/desk');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
