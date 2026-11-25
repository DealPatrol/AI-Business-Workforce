import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import sample from '@/lib/aerial-leads/fixtures/cullman-pilot.json';
import { mailStatus } from '@/lib/aerial-leads/mail';
import { DEFAULT_PRICE_CONFIG } from '@/lib/aerial-leads/pricing';
import { DEFAULT_THRESHOLDS } from '@/lib/aerial-leads/scoring';
import { CULLMAN_COUNTY_AL } from '@/lib/aerial-leads/sources';
import { listLeads, type AerialLeadRow } from '@/lib/aerial-leads/store';
import { metadataTitle, pageSeo } from '@/lib/seo/pages';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import AerialLeadsApp, { type SampleFixture } from './aerial-leads-app';
import styles from './aerial-leads.module.css';

export const dynamic = 'force-dynamic';

const seo = pageSeo('/dashboard/aerial-leads');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
};

export default async function AerialLeadsPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let leads: AerialLeadRow[] = [];
  let loadError: string | null = null;

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect('/login?next=/dashboard/aerial-leads');
    try {
      leads = await listLeads(createAdminClient(), data.user.id);
    } catch (error) {
      loadError = `Could not load saved leads (${(error as Error).message}). Apply supabase/migrations/20261125120000_aerial_leads.sql.`;
    }
  }

  const mail = mailStatus();
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Front Porch Growth · Executive Receptionist add-on</p>
          <h1>Aerial postcard leads</h1>
          <p className={styles.lede}>
            Finds homes whose driveway got noticeably dirtier between the last two public aerial flights, looks up the owner&apos;s
            mailing address in county records, prices the wash, and drafts a before-and-after postcard. Every card waits for your
            approval, and mail runs in Lob test mode only.
          </p>
        </div>
        <nav className={styles.nav}>
          <Link href="/desk">Desk</Link>
          <Link href="/dashboard/campaigns">QR lead inbox</Link>
          <Link href="/dashboard/prospector">Lead Finder</Link>
        </nav>
      </header>
      {!configured && <p className={styles.alert}>Supabase is not configured here, so scans can&apos;t be saved. Showing the Cullman pilot sample.</p>}
      {loadError && <p className={styles.alert}>{loadError}</p>}
      <AerialLeadsApp
        canScan={configured && !loadError}
        leads={leads}
        sample={sample as SampleFixture}
        mail={mail.enabled ? { enabled: true } : { enabled: false, reason: mail.reason }}
        defaults={{
          areaId: CULLMAN_COUNTY_AL.id,
          areaName: CULLMAN_COUNTY_AL.name,
          bbox: [-86.8199, 34.1613, -86.8129, 34.1669],
          ratePerSqft: DEFAULT_PRICE_CONFIG.ratePerSqft,
          minStainedPct: DEFAULT_THRESHOLDS.minStainedPct,
          minDarkerPct: DEFAULT_THRESHOLDS.minDarkerPct,
          imagery: `${CULLMAN_COUNTY_AL.current.label} vs ${CULLMAN_COUNTY_AL.prior.label}`,
        }}
      />
    </main>
  );
}
