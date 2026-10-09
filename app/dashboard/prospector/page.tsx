import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prospectorConfig } from '@/lib/prospector/config';
import { defaultSettings } from '@/lib/prospector/rows';
import { listCampaigns, getSettings } from '@/lib/prospector/store';
import { createClient } from '@/lib/supabase/server';
import ProspectorApp from './prospector-app';
import ProspectorShell from './shell';
import styles from './prospector.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lead Finder',
  robots: { index: false, follow: false },
};

export default async function ProspectorPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!configured) {
    return (
      <ProspectorShell active="finder">
        <h1>Lead Finder</h1>
        <p className={styles.alert}>
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then apply supabase/migrations/007_prospector.sql.
        </p>
      </ProspectorShell>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login?next=/dashboard/prospector');

  let settings = defaultSettings();
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];
  let dbError: string | null = null;
  try {
    [settings, campaigns] = await Promise.all([
      getSettings(supabase, data.user.id),
      listCampaigns(supabase, data.user.id),
    ]);
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Lead Finder data could not be loaded.';
  }

  return (
    <ProspectorShell active="finder">
      <ProspectorApp config={prospectorConfig()} settings={settings} campaigns={campaigns} dbError={dbError} />
    </ProspectorShell>
  );
}
