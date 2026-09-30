import { NextResponse } from 'next/server';
import { getDemo10Payment } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.redirect(getDemo10Payment().href, 307);
}
