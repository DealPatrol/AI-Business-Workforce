import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/ava/booking/google';
import { onboardingForOwnerEmail } from '@/lib/ava/booking/owner';
import {
  callCompletedPayload,
  cleanWebhookUrl,
  deliverWebhook,
  newWebhookSecret,
  webhookForOnboarding,
} from '@/lib/ava/integrations/webhook';
import { createRateLimiter } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site-url';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const take = createRateLimiter(12, 10 * 60_000);

function back(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/desk?webhook=${encodeURIComponent(status)}#integrations`, request.nextUrl.origin), 303);
}

async function save(onboardingId: string, patch: Record<string, unknown>) {
  const { error } = await createAdminClient().from('ava_onboardings').update(patch).eq('id', onboardingId);
  if (error) throw new Error(error.message);
}

/** Save, test, or remove the signed-in owner's call webhook (Zapier / Make / custom). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return back(request, 'signin');
  const onboarding = await onboardingForOwnerEmail(data.user.email).catch(() => null);
  if (!onboarding) return back(request, 'setup');
  if (!take(onboarding.id).ok) return back(request, 'busy');
  const form = await request.formData().catch(() => null);
  const action = String(form?.get('action') || '');

  try {
    if (action === 'remove') {
      await save(onboarding.id, { outbound_webhook_url: null, outbound_webhook_secret_enc: null });
      return back(request, 'removed');
    }
    if (action === 'save') {
      let url: string;
      try {
        url = cleanWebhookUrl(String(form?.get('url') || ''));
      } catch {
        return back(request, 'invalid');
      }
      const existing = await webhookForOnboarding(onboarding.id);
      await save(onboarding.id, {
        outbound_webhook_url: url,
        outbound_webhook_secret_enc: encryptToken(existing?.secret || newWebhookSecret()),
      });
      return back(request, 'saved');
    }
    if (action === 'test') {
      const hook = await webhookForOnboarding(onboarding.id);
      if (!hook) return back(request, 'none');
      const result = await deliverWebhook(
        hook.url,
        hook.secret,
        callCompletedPayload({
          conversationId: 'conv_test',
          businessName: onboarding.business_name,
          callerName: 'Test Caller',
          callerPhone: '2565550100',
          email: '',
          address: '123 Example St',
          need: 'Test event from Executive Receptionist',
          urgency: 'normal',
          callType: 'test',
          summary: 'This is a test event. No real call happened.',
          durationSecs: 0,
          booked: null,
          deskUrl: `${getSiteUrl()}/desk`,
          occurredAt: new Date().toISOString(),
        }),
      );
      return back(request, result.ok ? 'test_ok' : 'test_failed');
    }
    return back(request, 'invalid');
  } catch (error) {
    console.error('Desk webhook update failed', error instanceof Error ? error.message : error);
    return back(request, 'failed');
  }
}
