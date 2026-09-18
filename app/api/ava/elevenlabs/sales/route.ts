import { NextResponse } from 'next/server';
import { getAvaSignedUrl } from '@/lib/ava/elevenlabs-signed-url';

/** GET /api/ava/elevenlabs/sales — signed URL for Sales Ava (qualify funnel). */
export async function GET() {
  const result = await getAvaSignedUrl('sales');
  return NextResponse.json(result.body, { status: result.status });
}
