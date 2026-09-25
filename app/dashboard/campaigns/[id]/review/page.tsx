import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Leaf } from 'lucide-react';
import { normalizeTrade } from '@/lib/concept-profiles';
import { createClient } from '@/lib/supabase/server';
import ReviewBoard, { ReviewCampaign, ReviewRecipient } from './review-board';
import styles from './review.module.css';

export const dynamic = 'force-dynamic';

const UNDEFINED_COLUMN = '42703';

const RECIPIENT_BASE_COLUMNS = `
  id,
  address_line_1,
  address_line_2,
  city,
  state,
  postal_code,
  concept_image_url,
  concept_summary,
  created_at
`;

const RECIPIENT_IMAGERY_COLUMNS = `
  ${RECIPIENT_BASE_COLUMNS},
  current_image_url,
  current_image_source,
  after_image_url,
  review_status,
  review_notes,
  concept_json
`;

function normalizeRecipients(rows: Array<Record<string, unknown>>, legacy: boolean): ReviewRecipient[] {
  return rows.map((row) => ({
    id: String(row.id),
    addressLine1: String(row.address_line_1),
    addressLine2: row.address_line_2 ? String(row.address_line_2) : null,
    city: String(row.city),
    state: String(row.state),
    postalCode: String(row.postal_code),
    currentImageUrl: legacy
      ? (row.concept_image_url ? String(row.concept_image_url) : null)
      : (row.current_image_url ? String(row.current_image_url) : null),
    currentImageSource: legacy ? null : (row.current_image_source ? String(row.current_image_source) : null),
    afterImageUrl: legacy
      ? (row.concept_image_url ? String(row.concept_image_url) : null)
      : (row.after_image_url ? String(row.after_image_url) : null),
    reviewStatus: legacy ? 'pending' : String(row.review_status ?? 'pending'),
    reviewNotes: legacy ? null : (row.review_notes ? String(row.review_notes) : null),
    conceptSummary: row.concept_summary ? String(row.concept_summary) : null,
    conceptJson:
      !legacy && row.concept_json && typeof row.concept_json === 'object'
        ? (row.concept_json as Record<string, unknown>)
        : null,
  }));
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=${encodeURIComponent(`/dashboard/campaigns/${id}/review`)}`);

  const full = await supabase
    .from('campaigns')
    .select(`
      id, name, business_name, status, campaign_type, trade, is_sample,
      campaign_recipients (${RECIPIENT_IMAGERY_COLUMNS})
    `)
    .eq('id', id)
    .single();

  let row = full.data as Record<string, unknown> | null;
  let migrationReady = true;
  let legacyImagery = false;

  if (full.error?.code === UNDEFINED_COLUMN) {
    migrationReady = false;
    const existingImagery = await supabase
      .from('campaigns')
      .select(`
        id, name, business_name, status,
        campaign_recipients (${RECIPIENT_IMAGERY_COLUMNS})
      `)
      .eq('id', id)
      .single();

    row = existingImagery.data as Record<string, unknown> | null;
    if (existingImagery.error?.code === UNDEFINED_COLUMN) {
      legacyImagery = true;
      const legacy = await supabase
        .from('campaigns')
        .select(`
          id, name, business_name, status,
          campaign_recipients (${RECIPIENT_BASE_COLUMNS})
        `)
        .eq('id', id)
        .single();
      row = legacy.data as Record<string, unknown> | null;
      if (legacy.error) console.error('Unable to load legacy campaign review', legacy.error);
    } else if (existingImagery.error) {
      console.error('Unable to load campaign review', existingImagery.error);
    }
  } else if (full.error) {
    console.error('Unable to load campaign review', full.error);
  }

  if (!row) notFound();

  const recipients = Array.isArray(row.campaign_recipients)
    ? (row.campaign_recipients as Array<Record<string, unknown>>)
    : [];
  const campaign: ReviewCampaign = {
    id: String(row.id),
    name: String(row.name),
    businessName: String(row.business_name),
    status: String(row.status),
    campaignType: migrationReady ? String(row.campaign_type ?? 'standard') : 'standard',
    trade: normalizeTrade(migrationReady ? String(row.trade ?? 'landscaping') : 'landscaping'),
    isSample: migrationReady ? Boolean(row.is_sample) : false,
    migrationReady,
    legacyImagery,
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span><Leaf size={17} /></span> YardProof
        </Link>
        <Link href="/dashboard/campaigns"><ArrowLeft size={16} /> Campaign inbox</Link>
      </header>
      <ReviewBoard
        campaign={campaign}
        initialRecipients={normalizeRecipients(recipients, legacyImagery).slice(0, 10)}
      />
    </main>
  );
}
