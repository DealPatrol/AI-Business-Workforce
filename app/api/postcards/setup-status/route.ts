import { NextRequest, NextResponse } from 'next/server';
import { takePostcardSetupLookup } from '@/lib/postcards/setup-limiter';
import { lookupPostcardSetup } from '@/lib/postcards/setup-lookup';
import { normalizePostcardEmail } from '@/lib/postcards/setup-fee';

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

export async function GET(req: NextRequest) {
  const limited = takePostcardSetupLookup(clientIp(req));
  if (!limited.ok) {
    return NextResponse.json(
      { setupPaid: false, error: 'Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    );
  }

  const email = normalizePostcardEmail(req.nextUrl.searchParams.get('email'));
  if (!email) return NextResponse.json({ setupPaid: false });

  try {
    const setup = await lookupPostcardSetup(email);
    return NextResponse.json({ setupPaid: setup.paid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ setupPaid: false });
  }
}
