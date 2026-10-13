import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessOnboarding, currentUserEmail } from '@/lib/ava/client-access';
import { safeHttpsUrl } from '@/lib/ava/client-settings';
import { applyTransferToAgent } from '@/lib/ava/transfer';
import { toE164 } from '@/lib/analytics/contact';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const email = await currentUserEmail();
  if (!email) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const onboardingId = String(body.onboardingId || '');
  const onboarding = await canAccessOnboarding(email, onboardingId);
  if (!onboarding) return NextResponse.json({ error: 'Not your account.' }, { status: 403 });

  const transferNumber = toE164(String(body.transferNumber || '')) || null;
  const transferEnabled = Boolean(body.transferEnabled) && Boolean(transferNumber);
  const row = {
    onboarding_id: onboardingId,
    missed_call_textback: Boolean(body.missedCallTextback),
    textback_message: String(body.textbackMessage || '').trim().slice(0, 300) || null,
    booking_url: safeHttpsUrl(body.bookingUrl),
    transfer_enabled: transferEnabled,
    transfer_number: transferNumber,
    transfer_rule: String(body.transferRule || '').trim().slice(0, 500) || null,
    email_summaries: body.emailSummaries !== false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await createAdminClient().from('ava_client_settings').upsert(row, { onConflict: 'onboarding_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let transfer: { ok: boolean; error?: string } | null = null;
  if (onboarding.elevenlabs_agent_id && body.applyTransfer !== false) {
    transfer = await applyTransferToAgent(
      onboarding.elevenlabs_agent_id,
      transferEnabled ? transferNumber : null,
      row.transfer_rule,
    );
  }
  return NextResponse.json({ saved: true, transfer });
}
