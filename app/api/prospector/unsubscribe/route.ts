import { NextRequest, NextResponse } from 'next/server';
import { applyUnsubscribe } from '@/lib/prospector/apply-unsubscribe';

export const dynamic = 'force-dynamic';

/** One-click List-Unsubscribe POST. The public page stays at /prospector/unsubscribe. */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const result = await applyUnsubscribe(token);
  if (!result.saved) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
