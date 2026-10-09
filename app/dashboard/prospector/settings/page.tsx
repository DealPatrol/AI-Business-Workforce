import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prospectorConfig } from '@/lib/prospector/config';
import { defaultSettings } from '@/lib/prospector/rows';
import { getSettings } from '@/lib/prospector/store';
import { createClient } from '@/lib/supabase/server';
import ProspectorShell from '../shell';
import styles from '../prospector.module.css';
import SettingsForm from './settings-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lead Finder settings',
  robots: { index: false, follow: false },
};

export default async function ProspectorSettingsPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!configured) {
    return (
      <ProspectorShell active="settings">
        <p className={styles.alert}>Supabase is not configured, so Lead Finder settings cannot be saved yet.</p>
      </ProspectorShell>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login?next=/dashboard/prospector/settings');

  let settings = defaultSettings();
  let dbError: string | null = null;
  try {
    settings = await getSettings(supabase, data.user.id);
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Settings could not be loaded.';
  }

  return (
    <ProspectorShell active="settings">
      <header>
        <div>
          <div className={styles.eyebrow}>LEAD FINDER</div>
          <h1>Settings</h1>
          <p className={styles.lede}>Sender identity, mailing address, booking link, and how fast mail can leave your domain.</p>
        </div>
      </header>
      {dbError && <p className={styles.alert}>{dbError}</p>}
      <SettingsForm initial={settings} config={prospectorConfig()} />
    </ProspectorShell>
  );
}
