import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Leaf, MapPin, Phone } from 'lucide-react';
import { formatRecipientAddress, PUBLIC_TOKEN_PATTERN, PublicRecipient } from '@/lib/campaigns';
import { createAdminClient } from '@/lib/supabase/admin';
import EstimateRequestForm from './estimate-request-form';
import styles from './qr-page.module.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function RecipientPage({ params }: PageProps) {
  const { token } = await params;
  if (!PUBLIC_TOKEN_PATTERN.test(token)) notFound();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('campaign_recipients')
    .select(`
      id,
      public_token,
      homeowner_name,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      concept_image_url,
      concept_summary,
      campaigns!inner (
        business_name,
        business_phone,
        business_email,
        status
      )
    `)
    .eq('public_token', token)
    .eq('campaigns.status', 'active')
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') console.error('Unable to load QR recipient', error);
    notFound();
  }

  const recipient = data as unknown as PublicRecipient;
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent')?.slice(0, 500) ?? null;
  const { error: scanError } = await supabase.from('recipient_scans').insert({
    recipient_id: recipient.id,
    user_agent: userAgent,
  });
  if (scanError && scanError.code !== '23505') {
    console.error('Unable to record QR page view', scanError);
  }

  const address = formatRecipientAddress(recipient);
  const business = recipient.campaigns;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span><Leaf size={18} /></span>
          {business.business_name}
        </Link>
        {business.business_phone && (
          <a className={styles.phone} href={`tel:${business.business_phone}`}>
            <Phone size={15} /> {business.business_phone}
          </a>
        )}
      </nav>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>A PROJECT IDEA FOR YOUR HOME</span>
          <h1>
            {recipient.homeowner_name
              ? `${recipient.homeowner_name}, imagine what’s possible here.`
              : 'Imagine what’s possible here.'}
          </h1>
          <div className={styles.address}>
            <MapPin size={19} />
            <span>{address.map((line) => <span key={line}>{line}</span>)}</span>
          </div>
          <p>
            {recipient.concept_summary ??
              `${business.business_name} prepared this campaign page to make it easy to explore a project and request a no-pressure estimate.`}
          </p>
          <div className={styles.proof}>
            <span><CheckCircle2 /> Local project consultation</span>
            <span><CheckCircle2 /> Estimate request sent directly to the contractor</span>
          </div>
        </div>

        <aside className={styles.card}>
          {recipient.concept_image_url && (
            <div
              className={styles.concept}
              style={{ backgroundImage: `url("${recipient.concept_image_url.replaceAll('"', '%22')}")` }}
              role="img"
              aria-label={`Project concept for ${recipient.address_line_1}`}
            />
          )}
          <EstimateRequestForm token={recipient.public_token} businessName={business.business_name} />
        </aside>
      </section>

      <footer className={styles.footer}>
        <span>Campaign page prepared by {business.business_name}</span>
        <span>Your details are shared only to follow up on this estimate request.</span>
      </footer>
    </main>
  );
}
