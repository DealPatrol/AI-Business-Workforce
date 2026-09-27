import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_TOKEN_PATTERN, hashRequestSource } from '@/lib/campaigns';
import { imageryBucket } from '@/lib/imagery/auth';
import { redactPrivateDetails } from '@/lib/imagery/privacy-redaction';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const LICENSE_VERSION = 'homeowner-upload-v1';

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  if (!PUBLIC_TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: 'Invalid campaign link.' }, { status: 404 });
  }
  const form = await request.formData();
  if (String(form.get('licenseAccepted') ?? '') !== 'true') {
    return NextResponse.json({ error: 'Photo ownership and license confirmation is required.' }, { status: 400 });
  }
  const file = form.get('file');
  if (
    !(file instanceof File) ||
    file.size <= 0 ||
    file.size > MAX_BYTES ||
    !file.type.startsWith('image/')
  ) {
    return NextResponse.json({ error: 'Choose an image up to 8MB.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: recipient } = await admin
    .from('campaign_recipients')
    .select('id, do_not_photograph, campaigns!inner(status)')
    .eq('public_token', token)
    .eq('campaigns.status', 'active')
    .single();
  if (!recipient) return NextResponse.json({ error: 'Campaign link not found.' }, { status: 404 });
  if (recipient.do_not_photograph) {
    return NextResponse.json(
      { error: 'This address is on the do-not-photograph list.' },
      { status: 409 },
    );
  }
  const sourceHash = hashRequestSource(request.headers);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentUploads } = await admin
    .from('recipient_photo_licenses')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipient.id)
    .eq('source_hash', sourceHash)
    .gte('accepted_at', oneHourAgo);
  if ((recentUploads ?? 0) >= 3) {
    return NextResponse.json(
      { error: 'Too many photo uploads. Please try again later.' },
      { status: 429 },
    );
  }

  try {
    const redacted = await redactPrivateDetails(Buffer.from(await file.arrayBuffer()));
    const bucket = imageryBucket();
    const path = `${recipient.id}/current-redacted-homeowner-${Date.now()}.png`;
    const { error: uploadError } = await admin.storage.from(bucket).upload(path, redacted.bytes, {
      contentType: redacted.mimeType,
      upsert: false,
    });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
    const { data: signed, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      await admin.storage.from(bucket).remove([path]);
      throw new Error('Could not secure the uploaded photo.');
    }

    const { error: updateError } = await admin
      .from('campaign_recipients')
      .update({
        current_image_url: signed.signedUrl,
        current_image_source: 'owner_upload',
        current_storage_path: path,
        current_image_usage: 'print_source',
        captured_at: new Date().toISOString(),
        captured_by: 'homeowner',
        rights_basis: 'homeowner_upload',
        rights_license_version: LICENSE_VERSION,
        privacy_redaction_status: 'redacted',
        privacy_redacted_at: new Date().toISOString(),
        privacy_redaction_provider: redacted.provider,
        privacy_redaction_details: redacted.details,
        imagery_status: 'ready',
        imagery_error: null,
        after_image_url: null,
        review_status: 'pending',
        postcard_approved_at: null,
      })
      .eq('id', recipient.id);
    if (updateError) {
      await admin.storage.from(bucket).remove([path]);
      throw new Error('Could not attach the photo to this property.');
    }

    const { error: licenseError } = await admin.from('recipient_photo_licenses').insert({
      recipient_id: recipient.id,
      source_hash: sourceHash,
      license_version: LICENSE_VERSION,
      original_filename: file.name.slice(0, 255),
    });
    if (licenseError) {
      await admin.storage.from(bucket).remove([path]);
      await admin
        .from('campaign_recipients')
        .update({
          current_image_url: null,
          current_image_source: null,
          current_storage_path: null,
          rights_basis: null,
          privacy_redaction_status: 'failed',
          imagery_status: 'needs_photo',
          imagery_error: 'Could not record the homeowner upload license.',
        })
        .eq('id', recipient.id);
      throw new Error('Could not record the homeowner upload license.');
    }
    return NextResponse.json({
      ok: true,
      message: 'Photo received and privacy-redacted for contractor review.',
    });
  } catch (error) {
    console.error('homeowner photo upload error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Photo upload failed.' },
      { status: 502 },
    );
  }
}
