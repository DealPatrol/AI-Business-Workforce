import { NextRequest, NextResponse } from 'next/server';
import { ingestLead } from '@/lib/leads/ingest';
import { authorizeIngestRequest } from '@/lib/leads/secret';
import { createRateLimiter } from '@/lib/rate-limit';

const takeIngest = createRateLimiter(30, 60_000);

export async function POST(request: NextRequest) {
  const auth = authorizeIngestRequest(request.headers.get('authorization'));
  if (!auth.configured) {
    return NextResponse.json({ error: 'Lead ingest is not configured.' }, { status: 503 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const limit = takeIngest(request.headers.get('x-forwarded-for') || 'ingest');
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const result = await ingestLead(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ lead: result.lead, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    console.error('Unable to ingest Executive Receptionist lead', error);
    return NextResponse.json({ error: 'Lead capture is not available right now.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
