import { NextResponse } from 'next/server';
import { requireCampaignOwner } from '@/lib/imagery/auth';
import { purgeQueuedGoogleImagery } from '@/lib/imagery/purge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const auth = await requireCampaignOwner();
  if (!auth.ok) return auth.response;
  try {
    const result = await purgeQueuedGoogleImagery(auth.ctx);
    return NextResponse.json({ ok: result.failed === 0, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google imagery purge failed.' },
      { status: 500 },
    );
  }
}
