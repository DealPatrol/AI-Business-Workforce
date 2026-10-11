import { OwnerContext } from '@/lib/imagery/auth';

export async function purgeQueuedGoogleImagery(
  ctx: OwnerContext,
): Promise<{ purged: number; failed: number }> {
  const { data: recipients, error: recipientError } = await ctx.admin
    .from('campaign_recipients')
    .select('id, campaigns!inner(owner_id)')
    .eq('campaigns.owner_id', ctx.userId)
    .limit(5000);
  if (recipientError) throw new Error(`Could not load owned recipients: ${recipientError.message}`);
  const ownedIds = new Set((recipients ?? []).map((recipient) => String(recipient.id)));

  const { data: queued, error: queueError } = await ctx.admin
    .from('imagery_storage_purge_queue')
    .select('id, bucket_id, object_path')
    .is('purged_at', null)
    .limit(1000);
  if (queueError) {
    // Migration may not be applied yet; do not break the campaign inbox.
    if (queueError.code === '42P01' || queueError.code === 'PGRST205') {
      return { purged: 0, failed: 0 };
    }
    throw new Error(`Could not load imagery purge queue: ${queueError.message}`);
  }

  const ownedQueue = (queued ?? []).filter((item) =>
    ownedIds.has(String(item.object_path).split('/')[0] ?? ''),
  );
  let purged = 0;
  let failed = 0;
  const byBucket = new Map<string, typeof ownedQueue>();
  for (const item of ownedQueue) {
    const rows = byBucket.get(item.bucket_id) ?? [];
    rows.push(item);
    byBucket.set(item.bucket_id, rows);
  }

  for (const [bucket, rows] of byBucket) {
    const { error } = await ctx.admin.storage
      .from(bucket)
      .remove(rows.map((row) => row.object_path));
    if (error) {
      failed += rows.length;
      await ctx.admin
        .from('imagery_storage_purge_queue')
        .update({ purge_error: error.message })
        .in('id', rows.map((row) => row.id));
      continue;
    }
    purged += rows.length;
    await ctx.admin
      .from('imagery_storage_purge_queue')
      .update({ purged_at: new Date().toISOString(), purge_error: null })
      .in('id', rows.map((row) => row.id));
  }

  return { purged, failed };
}
