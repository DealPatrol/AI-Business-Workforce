import { NextResponse } from 'next/server';
import {
  HOT_LEADS_DOWNLOAD_FILENAME,
  loadHotLeadsCsv,
} from '@/lib/lead-lists/hot-download';
import {
  fetchCheckoutSession,
  isHotLeads500Order,
  isPaidCheckoutSession,
  isValidCheckoutSessionId,
} from '@/lib/lead-lists/hot-thanks';

function notFound() {
  return new NextResponse('Not found.', {
    status: 404,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id') || '';
  if (!isValidCheckoutSessionId(sessionId)) return notFound();

  const session = await fetchCheckoutSession(sessionId);
  if (!session || !isPaidCheckoutSession(session) || !isHotLeads500Order(session)) {
    return notFound();
  }

  const csv = loadHotLeadsCsv();
  if (!csv) {
    return new NextResponse('The list is temporarily unavailable. Email hello@frontporchgrowth.com and we will send it or refund you.', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${HOT_LEADS_DOWNLOAD_FILENAME}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
