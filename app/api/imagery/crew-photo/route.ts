import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  imageryBucket,
  requireCampaignOwner,
} from '@/lib/imagery/auth';
import { redactPrivateDetails } from '@/lib/imagery/privacy-redaction';
import { suppressionAddressKey } from '@/lib/suppression';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const SOURCE_RIGHTS = {
  crew_photo: 'crew_owned',
  owner_upload: 'homeowner_upload',
  licensed: 'licensed',
} as const;

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  let ownedRecipientId: string | null = null;

  try {
    const form = await request.formData();
    const recipientId = String(form.get('recipientId') ?? '').trim();
    const sourceRaw = String(form.get('source') ?? 'crew_photo').trim();
    const source =
      sourceRaw in SOURCE_RIGHTS ? (sourceRaw as keyof typeof SOURCE_RIGHTS) : null;
    if (!source) {
      return NextResponse.json(
        { error: 'source must be crew_photo, owner_upload, or licensed.' },
        { status: 400 },
      );
    }
    const expectedRights = SOURCE_RIGHTS[source];
    const rightsBasis = String(form.get('rightsBasis') ?? expectedRights).trim();
    if (rightsBasis !== expectedRights) {
      return NextResponse.json({ error: 'Photo source and rights basis do not match.' }, { status: 400 });
    }
    if (
      source !== 'crew_photo' &&
      String(form.get('rightsLicenseAccepted') ?? '') !== 'true'
    ) {
      return NextResponse.json(
        { error: 'Documented owner/license permission is required.' },
        { status: 400 },
      );
    }

    const owned = await assertRecipientOwned(auth.ctx, recipientId);
    if (!owned.ok) return owned.response;
    ownedRecipientId = owned.recipient.id;
    const { data: suppression } = await auth.ctx.admin
      .from('campaign_opt_outs')
      .select('id')
      .eq('owner_id', auth.ctx.userId)
      .eq('address_key', suppressionAddressKey(owned.recipient))
      .eq('do_not_photograph', true)
      .maybeSingle();
    if (owned.recipient.do_not_photograph || suppression) {
      return NextResponse.json(
        { error: 'This address is on the do-not-photograph list.' },
        { status: 409 },
      );
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'A valid image between 1 byte and 8MB is required.' },
        { status: 400 },
      );
    }
    const capturedBy = String(form.get('capturedBy') ?? '').trim().slice(0, 200);
    if (source === 'crew_photo' && !capturedBy) {
      return NextResponse.json({ error: 'Photographer name is required.' }, { status: 400 });
    }

    await auth.ctx.admin
      .from('campaign_recipients')
      .update({ privacy_redaction_status: 'processing', imagery_error: null })
      .eq('id', owned.recipient.id);

    const redacted = await redactPrivateDetails(Buffer.from(await file.arrayBuffer()));
    const bucket = imageryBucket();
    const path = `${owned.recipient.id}/current-redacted-${Date.now()}.png`;
    const { error: uploadError } = await auth.ctx.admin.storage
      .from(bucket)
      .upload(path, redacted.bytes, {
        contentType: redacted.mimeType,
        upsert: false,
      });
    if (uploadError) {
      throw new Error(
        `Storage upload failed (${uploadError.message}). Ensure bucket "${bucket}" exists (private).`,
      );
    }
    const { data: signed, error: signError } = await auth.ctx.admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      await auth.ctx.admin.storage.from(bucket).remove([path]);
      throw new Error('Redacted upload succeeded but signed URL creation failed.');
    }

    const capturedAtRaw = String(form.get('capturedAt') ?? '').trim();
    const capturedAt =
      capturedAtRaw && !Number.isNaN(Date.parse(capturedAtRaw))
        ? new Date(capturedAtRaw).toISOString()
        : new Date().toISOString();
    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update({
        current_image_url: signed.signedUrl,
        current_image_source: source,
        current_storage_path: path,
        current_image_usage: 'print_source',
        capture_lat: optionalNumber(form.get('captureLat')),
        capture_lng: optionalNumber(form.get('captureLng')),
        capture_heading: optionalNumber(form.get('captureHeading')),
        captured_at: capturedAt,
        captured_by: capturedBy || null,
        rights_basis: rightsBasis,
        rights_license_version:
          source === 'owner_upload' ? 'homeowner-upload-v1' : 'crew-capture-v1',
        privacy_redaction_status: 'redacted',
        privacy_redacted_at: new Date().toISOString(),
        privacy_redaction_provider: redacted.provider,
        privacy_redaction_details: redacted.details,
        imagery_status: 'ready',
        imagery_error: redacted.details.peopleDetected
          ? 'Person detected; face regions were blurred. Confirm privacy during review.'
          : null,
        after_image_url: null,
        review_status: 'pending',
        postcard_approved_at: null,
      })
      .eq('id', owned.recipient.id);
    if (updateError) {
      await auth.ctx.admin.storage.from(bucket).remove([path]);
      throw new Error('Redacted image stored but recipient update failed.');
    }

    return NextResponse.json({
      ok: true,
      currentImageUrl: signed.signedUrl,
      currentImageSource: source,
      rightsBasis,
      privacyRedactionStatus: 'redacted',
      redactionDetails: redacted.details,
      storagePath: path,
      bucket,
    });
  } catch (error) {
    console.error('rights-cleared photo upload error', error);
    if (ownedRecipientId) {
      await auth.ctx.admin
        .from('campaign_recipients')
        .update({
          privacy_redaction_status: 'failed',
          imagery_status: 'failed',
          imagery_error:
            error instanceof Error ? error.message : 'Privacy redaction or upload failed.',
        })
        .eq('id', ownedRecipientId);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Photo upload failed.' },
      { status: 500 },
    );
  }
}
