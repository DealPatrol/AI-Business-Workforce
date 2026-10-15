import { NextRequest, NextResponse } from 'next/server';
import { readPostcardSetupRecord } from '@/lib/postcards/orders';
import { takePostcardSetupLookup } from '@/lib/postcards/setup-limiter';
import { readPostcardBuyer } from '@/lib/postcards/setup-session';
import { decidePostcardSetupCharge, normalizePostcardEmail } from '@/lib/postcards/setup-fee';

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

/** Signed-in buyer only. Ignores any email query and does not call Stripe. */
export async function GET(req: NextRequest) {
  const limited = takePostcardSetupLookup(clientIp(req));
  if (!limited.ok) {
    return NextResponse.json(
      { setupPaid: false, error: 'Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    );
  }

  const buyer = await readPostcardBuyer();
  const email = buyer?.emailConfirmedAt ? normalizePostcardEmail(buyer.email) : '';
  if (!email) return NextResponse.json({ setupPaid: false }, { status: 401 });

  try {
    const record = await readPostcardSetupRecord(email);
    const setup = decidePostcardSetupCharge({
      buyer,
      paidSetup: record.paid ? { customerId: record.customerId } : null,
    });
    return NextResponse.json({ setupPaid: !setup.includeSetup });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ setupPaid: false });
  }
}
