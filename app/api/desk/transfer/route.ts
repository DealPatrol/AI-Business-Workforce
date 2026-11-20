import { NextRequest, NextResponse } from 'next/server';
import { onboardingForOwnerEmail } from '@/lib/ava/booking/owner';
import { calendarForOnboarding } from '@/lib/ava/booking/store';
import { buildAvaAgentPrompt, customerBuiltInTools } from '@/lib/ava/provisioning';
import { saveAgentTransfer } from '@/lib/desk/eleven';
import { promptDetailsFor } from '@/lib/desk/prompt-details';
import { isEditableAgent } from '@/lib/desk/settings';
import { cleanTransferSettings } from '@/lib/desk/transfer-settings';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Saves the owner's named live-transfer numbers (up to 3) and, when their own Ava is live, updates her
 * prompt and transfer tool to match. Shared demo agents are never edited.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = cleanTransferSettings(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const rules = parsed.rules;

  try {
    const onboarding = await onboardingForOwnerEmail(user.email ?? '');
    if (!onboarding) return NextResponse.json({ error: 'Finish setup before adding transfer numbers.' }, { status: 404 });
    if ((onboarding.selected_plan || '').toLowerCase() === 'store') {
      return NextResponse.json({ error: 'Live transfer is for home-service plans.' }, { status: 400 });
    }

    const { error } = await createAdminClient()
      .from('ava_onboardings')
      .update({ transfer_rules: rules, transfer_phone: rules[0]?.phone ?? null, updated_at: new Date().toISOString() })
      .eq('id', onboarding.id);
    if (error) {
      console.error('Unable to save transfer rules', error.message);
      return NextResponse.json({ error: 'Transfer numbers could not be saved right now.' }, { status: 503 });
    }

    const agentId = onboarding.elevenlabs_agent_id?.trim() || '';
    if (!isEditableAgent(agentId) || !process.env.ELEVENLABS_API_KEY?.trim()) {
      return NextResponse.json({
        ok: true,
        rules,
        note: 'Saved. Ava starts using these numbers when your own receptionist goes live.',
      });
    }

    const calendar = await calendarForOnboarding(onboarding.id);
    const bookingEnabled = Boolean(calendar?.enabled && (calendar.elevenlabs_tool_ids ?? []).length);
    const details = promptDetailsFor(onboarding, bookingEnabled, { transferRules: rules, transferNumber: null });
    const transfer = customerBuiltInTools(details).transfer_to_number as Record<string, unknown> | null;
    await saveAgentTransfer(agentId, buildAvaAgentPrompt(details), transfer);
    return NextResponse.json({
      ok: true,
      rules,
      note: rules.length
        ? 'Saved. Ava uses these numbers on her next call. Make a test call to hear the handoff.'
        : 'Saved. Live transfer is off; Ava takes a message instead.',
    });
  } catch (error) {
    console.error('Unable to save transfer rules', error);
    return NextResponse.json({ error: 'Transfer numbers were saved, but Ava could not be updated. Try again in a minute.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
