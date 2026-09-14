'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './campaigns.module.css';

export default function LogoutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <button className={styles.logout} type="button" onClick={signOut}>
      <LogOut size={15} /> Sign out
    </button>
  );
}
