import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { suppressionAddressKey } from '@/lib/suppression';
import CaptureClient, { CaptureRecipient } from './capture-client';
import styles from './capture.module.css';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ campaignId: string }> };

export default async function CapturePage({ params }: PageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/capture/${encodeURIComponent(campaignId)}`);

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      id, name,
      campaign_recipients (
        id, homeowner_name, address_line_1, address_line_2, city, state, postal_code,
        latitude, longitude, do_not_photograph, current_image_source, privacy_redaction_status
      )
    `)
    .eq('id', campaignId)
    .single();
  if (error || !campaign) notFound();
  const { data: suppressions } = await supabase
    .from('campaign_opt_outs')
    .select('address_key')
    .eq('do_not_photograph', true);
  const suppressedKeys = new Set((suppressions ?? []).map((row) => row.address_key));
  const recipients = (campaign.campaign_recipients as unknown as CaptureRecipient[]).map(
    (recipient) => ({
      ...recipient,
      do_not_photograph:
        recipient.do_not_photograph || suppressedKeys.has(suppressionAddressKey(recipient)),
    }),
  );

  return (
    <main className={styles.page}>
      <header>
        <span>YARDPROOF CREW CAPTURE</span>
        <h1>{campaign.name}</h1>
        <p>Photograph only from a public street or sidewalk. Suppressed addresses are excluded.</p>
      </header>
      <CaptureClient
        campaignId={campaign.id}
        recipients={recipients}
      />
    </main>
  );
}
