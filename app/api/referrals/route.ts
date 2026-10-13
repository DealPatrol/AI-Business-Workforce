import { NextResponse } from 'next/server';
import { currentUserEmail } from '@/lib/ava/client-access';
import { getOrCreateReferralCode, referralStats } from '@/lib/referrals';

export const dynamic = 'force-dynamic';

export async function POST() {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  try {
    const code = await getOrCreateReferralCode(email);
    return NextResponse.json({ code, stats: await referralStats(code) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
