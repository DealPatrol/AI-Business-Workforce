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
 * Upload optional alternate printable Current (crew_photo | owner_upload).
 * Preferred product path is Street View via POST /api/imagery/streetview-preview.
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
            'source must be crew_photo or owner_upload. For Street View Current use POST /api/imagery/streetview-preview.',
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
    const path = `${owned.recipient.id}/current-${Date.now()}.${ext}`;
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
      .update({
        current_image_url: signed.signedUrl,
        current_image_source: source,
        current_image_usage: 'print_source',
        imagery_status: 'ready',
        imagery_error: null,
        // New current invalidates prior after until re-rendered + re-reviewed
        after_image_url: null,
        review_status: 'pending',
        postcard_approved_at: null,
      })
      .eq('id', owned.recipient.id);

    if (updateError) {
      console.error('crew-photo db update failed', updateError);
      return NextResponse.json(
        { error: 'Uploaded but could not update recipient imagery fields.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      currentImageUrl: signed.signedUrl,
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
