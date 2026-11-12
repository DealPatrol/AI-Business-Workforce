import { NextRequest, NextResponse } from 'next/server';
import { onboardingForOwnerEmail } from '@/lib/ava/booking/owner';
import { calendarForOnboarding } from '@/lib/ava/booking/store';
import { buildAvaAgentPrompt } from '@/lib/ava/provisioning';
import { saveAgentGreeting, saveAgentPrompt } from '@/lib/desk/eleven';
import { cleanDeskSettings, isEditableAgent } from '@/lib/desk/settings';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Saves the owner's Desk settings: Ava's greeting, the new-lead alert email, and business hours.
 * Ownership comes from the signed-in email; shared demo agents are never edited.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = cleanDeskSettings(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const settings = parsed.value;

  try {
    const onboarding = await onboardingForOwnerEmail(user.email ?? '');
    if (!onboarding) return NextResponse.json({ error: 'Finish setup before changing settings.' }, { status: 404 });

    const agentId = onboarding.elevenlabs_agent_id?.trim() || '';
    const editable = isEditableAgent(agentId);
    const hasKey = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
    const notes: string[] = [];

    if (settings.greeting !== undefined) {
      if (!editable) {
        return NextResponse.json(
          { error: 'Greeting changes open once your own receptionist is live. Call (256) 595-3354 and we will set it.' },
          { status: 409 },
        );
      }
      if (!hasKey) return NextResponse.json({ error: 'Greeting changes are not available right now.' }, { status: 503 });
      await saveAgentGreeting(agentId, settings.greeting);
      notes.push('Ava will use the new greeting on the next call.');
    }

    const patch: Record<string, unknown> = {};
    if (settings.notificationEmail !== undefined) patch.staff_email = settings.notificationEmail;
    if (settings.businessHours !== undefined) patch.business_hours = settings.businessHours;
    if (Object.keys(patch).length) {
      patch.updated_at = new Date().toISOString();
      const { error } = await createAdminClient().from('ava_onboardings').update(patch).eq('id', onboarding.id);
      if (error) throw new Error(error.message);
      if (settings.notificationEmail !== undefined) notes.push('New-lead alerts will go to that email.');
    }

    if (settings.businessHours !== undefined) {
      if (editable && hasKey) {
        const calendar = await calendarForOnboarding(onboarding.id);
        const bookingEnabled = Boolean(calendar?.enabled && (calendar.elevenlabs_tool_ids ?? []).length);
        await saveAgentPrompt(
          agentId,
          buildAvaAgentPrompt({
            businessName: onboarding.business_name || 'the business',
            businessHours: settings.businessHours,
            services: onboarding.services,
            callHandlingRules: onboarding.call_handling_rules,
            staffName: onboarding.staff_name,
            staffContact: onboarding.staff_contact,
            calendarPreference: onboarding.calendar_preference,
            urgentCallRules: onboarding.urgent_call_rules,
            plan: onboarding.selected_plan,
            transferNumber: onboarding.transfer_phone ?? null,
            bookingEnabled,
          }),
        );
        notes.push('Ava now tells callers your new hours.');
      } else {
        notes.push('Hours saved. Ava picks them up when your receptionist goes live.');
      }
    }

    return NextResponse.json({ ok: true, note: notes.join(' ') || 'Saved.' });
  } catch (error) {
    console.error('Unable to save Desk settings', error);
    return NextResponse.json({ error: 'Settings could not be saved right now.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
