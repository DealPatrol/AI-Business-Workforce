import { NextRequest, NextResponse } from 'next/server';
import { pilotSaleLinkSecret, verifyPilotSaleToken } from '@/lib/ava/pilot-sale-link';
import {
  renderConfirmPage,
  renderInvalidLinkPage,
  renderResultPage,
} from '@/lib/ava/pilot-sale-page';
import { recordPilotSale } from '@/lib/ava/pilot-sales';
import { createPilotSaleDeps } from '@/lib/ava/pilot-sales-store';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
};

function html(body: string, status = 200) {
  return new NextResponse(body, { status, headers: HEADERS });
}

function verify(token: string) {
  return verifyPilotSaleToken({ token, secret: pilotSaleLinkSecret() });
}

/**
 * GET only shows a confirmation page. Mail scanners and link previewers open GET links,
 * so a GET must never record a sale or add a charge.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') || '';
  const verified = verify(token);
  if (!verified.ok) {
    return html(renderInvalidLinkPage(), verified.reason === 'no_secret' ? 503 : 400);
  }

  try {
    const { data } = await createAdminClient()
      .from('ava_call_leads')
      .select('caller_name, service_job_type, business_name')
      .eq('id', verified.leadId)
      .maybeSingle();
    if (!data) return html(renderInvalidLinkPage(), 404);
    const deps = createPilotSaleDeps();
    const existing = await deps.findSaleByLead(verified.leadId);
    return html(
      renderConfirmPage({
        token,
        callerName: data.caller_name || '',
        need: data.service_job_type || '',
        businessName: data.business_name || '',
        alreadyBooked: Boolean(existing),
      }),
    );
  } catch (error) {
    console.error('Pilot sale confirm page failed', error);
    return html(renderInvalidLinkPage(), 500);
  }
}

export async function POST(req: NextRequest) {
  let token = '';
  try {
    const form = await req.formData();
    const value = form.get('t');
    token = typeof value === 'string' ? value : '';
  } catch {
    return html(renderInvalidLinkPage(), 400);
  }

  const verified = verify(token);
  if (!verified.ok) {
    return html(renderInvalidLinkPage(), verified.reason === 'no_secret' ? 503 : 400);
  }

  try {
    const result = await recordPilotSale(createPilotSaleDeps(), {
      leadId: verified.leadId,
      markedBy: 'owner_link',
    });
    const status = !result.ok
      ? result.code === 'lead_not_found'
        ? 404
        : result.code === 'not_pilot_customer'
          ? 409
          : 503
      : result.billingPending
        ? 202
        : 200;
    return html(renderResultPage(result), status);
  } catch (error) {
    console.error('Pilot sale record failed', error);
    return html(
      renderResultPage({
        ok: false,
        code: 'subscription_unavailable',
        message: 'Something went wrong on our side. Nothing was charged. Please try the link again shortly.',
      }),
      500,
    );
  }
}
