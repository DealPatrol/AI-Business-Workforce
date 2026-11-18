import { NextResponse, type NextRequest } from 'next/server';
import { PublicFetchError } from '@/lib/prospector/errors';
import { runAiChecks, liveAiEnabled } from '@/lib/grader/ai-checks';
import { runAudit } from '@/lib/grader/audit';
import { findCompetitors } from '@/lib/grader/competitors';
import { saveReport, sendReportEmails } from '@/lib/grader/leads';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const perIp = createRateLimiter(6, 10 * 60_000);
const perSite = createRateLimiter(3, 10 * 60_000);
const global = createRateLimiter(120, 60 * 60_000);

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

function clean(value: unknown, max: number) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function clientIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

function tooMany(seconds: number) {
  return NextResponse.json(
    { error: `Lots of checks just now. Please try again in about ${Math.ceil(seconds / 60)} minute${seconds > 60 ? 's' : ''}.` },
    { status: 429, headers: { 'Retry-After': String(seconds) } },
  );
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Send the form as JSON.' }, { status: 400 });
  }

  // Honeypot: bots that fill the hidden field get a quiet, empty success.
  if (clean(body.company_site, 200)) return NextResponse.json({ ok: true, report: null });

  const website = clean(body.website, 300);
  const trade = clean(body.trade, 60);
  const city = clean(body.city, 80);
  const email = clean(body.email, 254).toLowerCase();

  if (!website || !trade || !city || !email) {
    return NextResponse.json({ error: 'Please fill in your website, trade, city, and email.' }, { status: 400 });
  }
  if (trade.length < 2 || city.length < 2) {
    return NextResponse.json({ error: 'Please enter your trade and city.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const ipDecision = perIp(clientIp(request));
  if (!ipDecision.ok) return tooMany(ipDecision.retryAfterSeconds);
  const siteKey = website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  const siteDecision = perSite(siteKey);
  if (!siteDecision.ok) return tooMany(siteDecision.retryAfterSeconds);
  const globalDecision = global('all');
  if (!globalDecision.ok) return tooMany(globalDecision.retryAfterSeconds);

  let report;
  try {
    report = await runAudit({ website, trade, city });
  } catch (error) {
    if (error instanceof PublicFetchError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error('grader audit error', error);
    return NextResponse.json({ error: 'We could not finish checking that site. Please try again.' }, { status: 502 });
  }

  const domain = new URL(report.finalUrl).hostname.replace(/^www\./, '').toLowerCase();
  const [ai, nearby] = await Promise.all([
    runAiChecks({ businessName: report.facts.name, domain, tradeLabel: report.input.trade, city }),
    findCompetitors({ tradeLabel: report.input.trade, city, ownDomain: domain }),
  ]);

  const [stored, delivery] = await Promise.all([
    saveReport({ email, report, ai, userAgent: request.headers.get('user-agent') || '' }),
    sendReportEmails({ email, report, ai, competitors: nearby.competitors, competitorSource: nearby.source }),
  ]);

  return NextResponse.json({
    ok: true,
    report,
    ai: {
      status: ai.status,
      live: liveAiEnabled(),
      records: ai.records,
      note: ai.status === 'done' ? ai.method : 'reason' in ai ? ai.reason : '',
    },
    competitors: { status: nearby.status, source: nearby.source, list: nearby.competitors },
    delivery: { saved: stored.saved, notified: delivery.notified, emailed: delivery.emailed },
  });
}
