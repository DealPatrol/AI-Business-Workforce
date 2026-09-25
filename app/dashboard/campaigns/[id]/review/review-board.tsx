'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronDown,
  LoaderCircle,
  MailWarning,
  RefreshCw,
  Save,
  Shuffle,
} from 'lucide-react';
import {
  CONCEPT_PROFILES,
  getConceptProfile,
  TradeKey,
} from '@/lib/concept-profiles';
import styles from './review.module.css';

export type ReviewCampaign = {
  id: string;
  name: string;
  businessName: string;
  status: string;
  campaignType: string;
  trade: TradeKey;
  isSample: boolean;
  migrationReady: boolean;
  legacyImagery: boolean;
};

export type ReviewRecipient = {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  currentImageUrl: string | null;
  currentImageSource: string | null;
  afterImageUrl: string | null;
  reviewStatus: string;
  reviewNotes: string | null;
  conceptSummary: string | null;
  conceptJson: Record<string, unknown> | null;
};

type Props = {
  campaign: ReviewCampaign;
  initialRecipients: ReviewRecipient[];
};

type ApiResult = {
  error?: string;
  afterImageUrl?: string;
};

function selectedIds(recipient: ReviewRecipient, trade: TradeKey): string[] {
  const selected = recipient.conceptJson?.selectedCatalogItems;
  if (Array.isArray(selected)) {
    const ids = selected
      .map((item) =>
        item && typeof item === 'object' && 'id' in item ? String(item.id) : null,
      )
      .filter((id): id is string => Boolean(id));
    if (ids.length > 0) return ids;
  }

  const legacyItems =
    recipient.conceptJson?.plantPlan &&
    typeof recipient.conceptJson.plantPlan === 'object' &&
    'items' in recipient.conceptJson.plantPlan
      ? (recipient.conceptJson.plantPlan as { items?: unknown }).items
      : null;
  if (Array.isArray(legacyItems)) {
    const ids = legacyItems
      .map((item) =>
        item && typeof item === 'object' && 'id' in item ? String(item.id) : null,
      )
      .filter((id): id is string => Boolean(id));
    if (ids.length > 0) return ids;
  }

  return getConceptProfile(trade).choices.slice(0, 5).map((choice) => choice.id);
}

function scopeBullets(recipient: ReviewRecipient, trade: TradeKey): string[] {
  const value = recipient.conceptJson?.scopeBullets;
  if (Array.isArray(value)) {
    const bullets = value.map(String).filter(Boolean).slice(0, 5);
    if (bullets.length > 0) return bullets;
  }
  return getConceptProfile(trade).scopeTemplates;
}

function address(recipient: ReviewRecipient): string {
  return [
    recipient.addressLine1,
    recipient.addressLine2,
    `${recipient.city}, ${recipient.state} ${recipient.postalCode}`,
  ].filter(Boolean).join(', ');
}

async function postJson(url: string, body: Record<string, unknown>): Promise<ApiResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

export default function ReviewBoard({ campaign, initialRecipients }: Props) {
  const router = useRouter();
  const profile = CONCEPT_PROFILES[campaign.trade];
  const [recipients, setRecipients] = useState(initialRecipients);
  const [campaignStatus, setCampaignStatus] = useState(campaign.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(initialRecipients.map((recipient) => [recipient.id, recipient.reviewNotes ?? ''])),
  );
  const [selections, setSelections] = useState<Record<string, string[]>>(
    Object.fromEntries(
      initialRecipients.map((recipient) => [
        recipient.id,
        selectedIds(recipient, campaign.trade),
      ]),
    ),
  );

  const approvedCount = useMemo(
    () => recipients.filter((recipient) => recipient.reviewStatus === 'approved').length,
    [recipients],
  );
  const allReady = useMemo(
    () =>
      recipients.length > 0 &&
      recipients.every(
        (recipient) =>
          Boolean(
            recipient.currentImageUrl &&
            recipient.afterImageUrl &&
            recipient.currentImageSource,
          ) &&
          ['pending_review', 'approved'].includes(recipient.reviewStatus),
      ),
    [recipients],
  );

  const updateRecipient = (id: string, patch: Partial<ReviewRecipient>) => {
    setRecipients((current) =>
      current.map((recipient) => recipient.id === id ? { ...recipient, ...patch } : recipient),
    );
  };

  const review = async (recipient: ReviewRecipient, status: string) => {
    const recipientBusy = `${recipient.id}:${status}`;
    setBusy(recipientBusy);
    setMessage(null);
    try {
      await postJson('/api/imagery/review', {
        recipientId: recipient.id,
        status,
        notes: notes[recipient.id] || null,
        catalogSelections: selections[recipient.id],
      });
      updateRecipient(recipient.id, {
        reviewStatus: status,
        reviewNotes: notes[recipient.id] || null,
      });
      setMessage(status === 'approved' ? 'Card approved.' : 'Change request saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review failed.');
    } finally {
      setBusy(null);
    }
  };

  const saveSelections = async (recipient: ReviewRecipient) => {
    const recipientBusy = `${recipient.id}:swap`;
    setBusy(recipientBusy);
    setMessage(null);
    try {
      await postJson('/api/imagery/review', {
        recipientId: recipient.id,
        status: 'pending_review',
        notes: notes[recipient.id] || null,
        catalogSelections: selections[recipient.id],
      });
      updateRecipient(recipient.id, { reviewStatus: 'pending_review' });
      setMessage('Curated selections saved. Regenerate when ready.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save selections.');
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async (recipient: ReviewRecipient) => {
    const recipientBusy = `${recipient.id}:regenerate`;
    setBusy(recipientBusy);
    setMessage(null);
    try {
      const result = await postJson('/api/imagery/after-render', {
        recipientId: recipient.id,
        catalogSkus: selections[recipient.id],
      });
      updateRecipient(recipient.id, {
        afterImageUrl: result.afterImageUrl ?? recipient.afterImageUrl,
        reviewStatus: 'pending_review',
      });
      setMessage('A new After concept is ready for review.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Regeneration failed.');
    } finally {
      setBusy(null);
    }
  };

  const approveAll = async () => {
    setBusy('campaign:approve');
    setMessage(null);
    try {
      await postJson('/api/campaigns/approve-ready', { campaignId: campaign.id });
      setRecipients((current) =>
        current.map((recipient) => ({ ...recipient, reviewStatus: 'approved' })),
      );
      setCampaignStatus('ready_to_mail');
      setMessage('All ready cards are approved. Status: ready to mail for manual ops confirmation.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Campaign approval failed.');
    } finally {
      setBusy(null);
    }
  };

  const toggleSelection = (recipientId: string, choiceId: string) => {
    setSelections((current) => {
      const selected = new Set(current[recipientId] ?? []);
      if (selected.has(choiceId)) selected.delete(choiceId);
      else if (selected.size < 12) selected.add(choiceId);
      return { ...current, [recipientId]: [...selected] };
    });
  };

  return (
    <section className={styles.board}>
      <div className={styles.titleRow}>
        <div>
          <span>DEMO BLAST 10 · {profile.label.toUpperCase()}</span>
          <h1>{campaign.name}</h1>
          <p>{campaign.businessName} · {approvedCount}/{recipients.length} cards approved</p>
        </div>
        <div className={styles.campaignActions}>
          <span className={styles.status}>{campaignStatus.replaceAll('_', ' ')}</span>
          <button
            type="button"
            onClick={approveAll}
            disabled={busy !== null || !allReady || campaign.legacyImagery}
          >
            {busy === 'campaign:approve' ? <LoaderCircle className={styles.spin} /> : <CheckCheck />}
            Approve all ready
          </button>
        </div>
      </div>

      <div className={styles.notice}>
        <MailWarning />
        <div>
          <b>Approval does not send mail.</b>
          <p>Cards move to <code>ready_to_mail</code>; Cole/ops must confirm printing and mailing manually.</p>
        </div>
      </div>

      {(campaign.isSample || campaign.legacyImagery) && (
        <div className={styles.sampleNotice}>
          <b>SAMPLE / PLACEHOLDER CAMPAIGN</b>
          <span>Imagery and addresses are illustrative unless a card explicitly identifies an authorized live source.</span>
        </div>
      )}

      {!campaign.migrationReady && (
        <div className={styles.migrationNotice}>
          Demo 10 metadata is not applied yet. Existing card review remains available; apply the
          Demo Blast 10 migration before setting <code>ready_to_mail</code>.
        </div>
      )}

      {message && <div className={styles.feedback} role="status">{message}</div>}

      <div className={styles.grid}>
        {recipients.map((recipient, index) => {
          const canApprove = Boolean(
            recipient.currentImageUrl &&
            recipient.afterImageUrl &&
            recipient.currentImageSource,
          );
          const currentSelections = selections[recipient.id] ?? [];
          return (
            <article className={styles.card} key={recipient.id}>
              <div className={styles.cardTop}>
                <span>CARD {String(index + 1).padStart(2, '0')}</span>
                <b className={`${styles.cardStatus} ${styles[recipient.reviewStatus] ?? ''}`}>
                  {recipient.reviewStatus.replaceAll('_', ' ')}
                </b>
              </div>

              <div className={styles.images}>
                <div>
                  <small>CURRENT {campaign.isSample ? '· SAMPLE' : ''}</small>
                  {recipient.currentImageUrl ? (
                    <Image
                      src={recipient.currentImageUrl}
                      alt={`Current property view for ${recipient.addressLine1}`}
                      width={560}
                      height={390}
                      unoptimized
                    />
                  ) : <span className={styles.imageMissing}>Current image needed</span>}
                </div>
                <div>
                  <small>AFTER · CONCEPT {campaign.isSample ? '· SAMPLE' : ''}</small>
                  {recipient.afterImageUrl ? (
                    <Image
                      src={recipient.afterImageUrl}
                      alt={`After concept for ${recipient.addressLine1}`}
                      width={560}
                      height={390}
                      unoptimized
                    />
                  ) : <span className={styles.imageMissing}>After concept needed</span>}
                </div>
              </div>

              <div className={styles.cardBody}>
                <h2>{recipient.addressLine1}</h2>
                <p className={styles.address}>{address(recipient)}</p>
                <ul>
                  {scopeBullets(recipient, campaign.trade).map((bullet) => (
                    <li key={bullet}><Check /> {bullet}</li>
                  ))}
                </ul>

                <details className={styles.swaps}>
                  <summary><Shuffle /> Swap plants/materials <ChevronDown /></summary>
                  <p>{profile.catalogLabel}</p>
                  <small>{profile.catalogDisclosure}</small>
                  <div className={styles.choiceList}>
                    {profile.choices.map((choice) => (
                      <label key={choice.id}>
                        <input
                          type="checkbox"
                          checked={currentSelections.includes(choice.id)}
                          onChange={() => toggleSelection(recipient.id, choice.id)}
                        />
                        <span><b>{choice.name}</b><small>{choice.category} · {choice.note}</small></span>
                      </label>
                    ))}
                  </div>
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => saveSelections(recipient)}
                    disabled={busy !== null || currentSelections.length === 0}
                  >
                    {busy === `${recipient.id}:swap` ? <LoaderCircle className={styles.spin} /> : <Save />}
                    Save swaps
                  </button>
                </details>

                <label className={styles.notes}>
                  Requested changes
                  <textarea
                    value={notes[recipient.id] ?? ''}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [recipient.id]: event.target.value }))
                    }
                    maxLength={2000}
                    placeholder="Example: use fewer shrubs and swap the red flowers for white."
                  />
                </label>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    onClick={() => review(recipient, 'approved')}
                    disabled={busy !== null || !canApprove}
                  >
                    {busy === `${recipient.id}:approved` ? <LoaderCircle className={styles.spin} /> : <Check />}
                    Approve
                  </button>
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => review(recipient, 'changes_requested')}
                    disabled={busy !== null || !(notes[recipient.id] ?? '').trim()}
                  >
                    Request changes
                  </button>
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={() => regenerate(recipient)}
                    disabled={busy !== null || !recipient.currentImageUrl}
                  >
                    {busy === `${recipient.id}:regenerate` ? <LoaderCircle className={styles.spin} /> : <RefreshCw />}
                    Regenerate After
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {recipients.length === 0 && (
        <div className={styles.empty}>No cards yet. Add up to 10 recipients, then fetch or upload Current imagery.</div>
      )}
    </section>
  );
}
