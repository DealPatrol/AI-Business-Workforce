import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readDestinationEditAuthorization } from '@/lib/ava/destination-guard';
import { signDestinationEditToken } from '@/lib/ava/destination-edit';
import { avaDestinationEditUrl, escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import { isAvaPlanKey } from '@/lib/ava/pricing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COOLDOWN_MS = 60_000;
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

function cooldownId(sessionId: string) {
  return `destination-link:${sessionId}`;
}

async function recentlySent(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ava_webhook_events')
    .select('processed_at')
    .eq('id', cooldownId(sessionId))
    .maybeSingle();
  if (error) {
    throw new Error(`Unable to check change-link cooldown: ${error.message}`);
  }
  const sentAt = Date.parse(String(data?.processed_at || ''));
  return Number.isFinite(sentAt) && Date.now() - sentAt < COOLDOWN_MS;
}

async function markSent(sessionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ava_webhook_events').upsert({
    id: cooldownId(sessionId),
    source: 'destination-link',
    event_type: 'ava-notify-destination',
    processed_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Ava destination change-link cooldown was not saved', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { sessionId?: unknown };
    const sessionId = String(body.sessionId ?? '').trim();
    if (!SESSION_ID.test(sessionId) || sessionId.length > 255) {
      return NextResponse.json(
        { error: 'A Stripe Checkout session is required.' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: onboarding, error: onboardingError } = await supabase
      .from('ava_onboardings')
      .select('id, business_name, selected_plan')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();
    if (onboardingError) {
      throw new Error(`Unable to load Ava onboarding: ${onboardingError.message}`);
    }
    if (!onboarding) {
      return NextResponse.json(
        {
          error:
            'Submit setup once before changing where leads go. The first submit on this link can set the phone and email.',
        },
        { status: 400 },
      );
    }

    const auth = await readDestinationEditAuthorization(sessionId);
    if (auth.identity.outcome === 'missing_secret' || auth.identity.outcome === 'stripe_error') {
      return NextResponse.json(
        { error: 'Stripe could not be checked. Try again shortly.' },
        { status: 503 },
      );
    }
    if (!auth.secret) {
      return NextResponse.json(
        { error: 'Change links are not configured yet.' },
        { status: 503 },
      );
    }
    if (!auth.paying) {
      const missingEmail =
        auth.identity.outcome === 'ok' &&
        auth.identity.recognizedAvaCheckout &&
        !auth.identity.email;
      return NextResponse.json(
        {
          error: missingEmail
            ? 'Stripe does not have an email on this checkout. Contact Cole to change where leads go.'
            : 'This checkout is not an active or trialing Ava subscription, so the lead phone and email stay locked.',
        },
        { status: missingEmail ? 422 : 403 },
      );
    }

    if (await recentlySent(sessionId)) {
      return NextResponse.json({
        sent: true,
        message:
          'A change link was just sent to the email on your Stripe checkout. Check that inbox. You can request another in a minute.',
      });
    }

    const plan =
      onboarding.selected_plan && isAvaPlanKey(onboarding.selected_plan)
        ? onboarding.selected_plan
        : undefined;
    const token = signDestinationEditToken({
      sessionId,
      email: auth.identity.email,
      secret: auth.secret,
    });
    const link = avaDestinationEditUrl(sessionId, token, plan);
    const business = String(onboarding.business_name || '').trim();

    await sendResendEmail({
      to: auth.identity.email,
      subject: `Change where Ava sends leads${business ? ` — ${business}` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b"><h1>Change where Ava sends leads</h1><p>Someone requested a link to update the phone number or email that receives Ava leads${business ? ` for ${escapeHtml(business)}` : ''}. If this was you, open the link and submit the form. It expires in 30 minutes.</p><p><a href="${escapeHtml(link)}">Update lead phone and email</a></p><p>If you did not request this, ignore this email. The current destinations stay in place.</p></div>`,
    });
    await markSent(sessionId);

    return NextResponse.json({
      sent: true,
      message:
        'We sent a 30-minute change link to the email on your Stripe checkout. It does not go to the address typed into this form.',
    });
  } catch (error) {
    console.error('Ava destination change link failed', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('RESEND_API_KEY')) {
      return NextResponse.json({ error: 'Email is not configured yet.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Could not send a change link.' }, { status: 500 });
  }
}
