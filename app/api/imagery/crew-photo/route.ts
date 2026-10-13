import { NextRequest, NextResponse } from 'next/server';
import {
  assertRecipientOwned,
  imageryBucket,
  requireCampaignOwner,
} from '@/lib/imagery/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_SOURCES = new Set(['crew_photo', 'owner_upload']);
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Upload the client's own job photo for a postcard: slot=before (Current) or
 * slot=after (finished job). This is the ONLY printable imagery source.
 * Requires rightsConfirmed=true: the client confirms they own the photos and
 * have the homeowner's OK to show the property.
 */
export async function POST(request: NextRequest) {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;

  try {
    const form = await request.formData();
    const recipientId = String(form.get('recipientId') ?? '').trim();
    const sourceRaw = String(form.get('source') ?? 'crew_photo').trim();
    const source = ALLOWED_SOURCES.has(sourceRaw) ? sourceRaw : null;
    if (!source) {
      return NextResponse.json(
        {
          error:
            'source must be crew_photo or owner_upload.',
        },
        { status: 400 },
      );
    }

    const slot = String(form.get('slot') ?? 'before').trim();
    if (slot !== 'before' && slot !== 'after') {
      return NextResponse.json({ error: 'slot must be before or after.' }, { status: 400 });
    }
    const rights = String(form.get('rightsConfirmed') ?? '').trim().toLowerCase();
    if (rights !== 'true' && rights !== 'on' && rights !== '1') {
      return NextResponse.json(
        {
          error:
            'Confirm you own these photos and have the homeowner\'s OK to show the property (rightsConfirmed=true).',
        },
        { status: 400 },
      );
    }

    const owned = await assertRecipientOwned(auth.ctx, recipientId);
    if (!owned.ok) return owned.response;

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image must be between 1 byte and 8MB.' },
        { status: 400 },
      );
    }

    const mime = file.type || 'image/jpeg';
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are accepted.' }, { status: 400 });
    }

    const ext =
      mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const path = `${owned.recipient.id}/${slot === 'before' ? 'current' : 'after'}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const bucket = imageryBucket();

    const { error: uploadError } = await auth.ctx.admin.storage
      .from(bucket)
      .upload(path, bytes, { contentType: mime, upsert: true });

    if (uploadError) {
      console.error('crew-photo upload failed', uploadError);
      return NextResponse.json(
        {
          error: `Storage upload failed (${uploadError.message}). Ensure bucket "${bucket}" exists (private).`,
        },
        { status: 502 },
      );
    }

    const { data: signed, error: signError } = await auth.ctx.admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signError || !signed?.signedUrl) {
      console.error('crew-photo sign failed', signError);
      return NextResponse.json(
        { error: 'Upload succeeded but could not create a signed URL.' },
        { status: 502 },
      );
    }

    const { error: updateError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update(
        slot === 'before'
          ? {
              current_image_url: signed.signedUrl,
              current_image_source: source,
              current_image_usage: 'print_source',
              imagery_status: 'ready',
              imagery_error: null,
              review_status: 'pending',
              postcard_approved_at: null,
            }
          : {
              after_image_url: signed.signedUrl,
              imagery_status: 'ready',
              imagery_error: null,
              review_status: 'pending',
              postcard_approved_at: null,
            },
      )
      .eq('id', owned.recipient.id);

    if (updateError) {
      console.error('crew-photo db update failed', updateError);
      return NextResponse.json(
        { error: 'Uploaded but could not update recipient imagery fields.' },
        { status: 500 },
      );
    }

    // Best-effort audit of the rights confirmation (column added by migration
    // 20261013120000_photo_rights_confirmation.sql; ignored if not applied yet).
    const { error: rightsError } = await auth.ctx.admin
      .from('campaign_recipients')
      .update({ photo_rights_confirmed_at: new Date().toISOString() })
      .eq('id', owned.recipient.id);
    if (rightsError) console.warn('photo_rights_confirmed_at not recorded', rightsError.message);

    return NextResponse.json({
      ok: true,
      slot,
      imageUrl: signed.signedUrl,
      currentImageSource: source,
      currentImageUsage: 'print_source',
      storagePath: path,
      bucket,
    });
  } catch (error) {
    console.error('crew-photo error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Crew photo upload failed.',
      },
      { status: 500 },
    );
  }
}
