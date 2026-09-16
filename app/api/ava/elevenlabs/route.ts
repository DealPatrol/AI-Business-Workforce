import { NextRequest, NextResponse } from 'next/server';
import { getAvaSignedUrl, AvaElevenLabsMode } from '@/lib/ava/elevenlabs-signed-url';

/**
 * GET /api/ava/elevenlabs
 * GET /api/ava/elevenlabs?mode=sales
 *
 * Default mode uses ELEVENLABS_AGENT_ID (customer template / browser demo).
 * mode=sales uses ELEVENLABS_SALES_AGENT_ID (Workforce qualify funnel).
 */
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('mode') || 'demo').toLowerCase();
  const mode: AvaElevenLabsMode = raw === 'sales' ? 'sales' : 'demo';
  const result = await getAvaSignedUrl(mode);
  return NextResponse.json(result.body, { status: result.status });
}
