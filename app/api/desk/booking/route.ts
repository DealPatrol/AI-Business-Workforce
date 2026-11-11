import { NextRequest, NextResponse } from 'next/server';
import { attachBookingTools, detachBookingTools } from '@/lib/ava/booking/agent-tools';
import { onboardingForOwnerEmail, type OwnerOnboarding } from '@/lib/ava/booking/owner';
import { hashToolSecret, newToolSecret } from '@/lib/ava/booking/secret';
import { cleanSettingsInput } from '@/lib/ava/booking/slots';
import { calendarForOnboarding, saveCalendarForOnboarding } from '@/lib/ava/booking/store';
import { buildAvaAgentPrompt } from '@/lib/ava/provisioning';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function promptFor(onboarding: OwnerOnboarding, bookingEnabled: boolean) {
  return buildAvaAgentPrompt({
    businessName: onboarding.business_name || 'the business',
    businessHours: onboarding.business_hours,
    services: onboarding.services,
    callHandlingRules: onboarding.call_handling_rules,
    staffName: onboarding.staff_name,
    staffContact: onboarding.staff_contact,
    calendarPreference: onboarding.calendar_preference,
    urgentCallRules: onboarding.urgent_call_rules,
    plan: onboarding.selected_plan,
    transferNumber: onboarding.transfer_phone ?? null,
    bookingEnabled,
  });
}

/** Saves the owner's booking calendar settings. Turning booking on wires the tools into their Ava. */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = cleanSettingsInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const onboarding = await onboardingForOwnerEmail(user.email ?? '');
    if (!onboarding) return NextResponse.json({ error: 'Finish setup before turning on booking.' }, { status: 404 });
    if ((onboarding.selected_plan || '').toLowerCase() === 'store') {
      return NextResponse.json({ error: 'Booking is for home-service plans.' }, { status: 400 });
    }

    const current = await calendarForOnboarding(onboarding.id);
    const settings = parsed.value;
    const patch: Record<string, unknown> = {
      enabled: settings.enabled,
      slot_minutes: settings.slotMinutes,
      slot_capacity: settings.slotCapacity,
      min_notice_minutes: settings.minNoticeMinutes,
      horizon_days: settings.horizonDays,
      weekly_hours: settings.weeklyHours,
      blackouts: settings.blackouts,
      label: onboarding.business_name || 'Ava calendar',
    };

    let agentNote = '';
    const agentId = onboarding.elevenlabs_agent_id?.trim() || '';
    const isDemo = Boolean(current?.is_demo);
    const hadTools = (current?.elevenlabs_tool_ids ?? []).length > 0;

    if (!isDemo && settings.enabled && !hadTools) {
      if (agentId && process.env.ELEVENLABS_API_KEY) {
        const secret = newToolSecret();
        const toolIds = await attachBookingTools(agentId, secret, promptFor(onboarding, true));
        patch.tool_secret_hash = hashToolSecret(secret);
        patch.elevenlabs_tool_ids = toolIds;
        agentNote = 'Ava can now book open windows on calls.';
      } else {
        patch.enabled = false;
        agentNote = 'Saved. Booking turns on once your receptionist is set up.';
      }
    } else if (!isDemo && !settings.enabled && hadTools && agentId && process.env.ELEVENLABS_API_KEY) {
      await detachBookingTools(agentId, current?.elevenlabs_tool_ids ?? [], promptFor(onboarding, false));
      patch.tool_secret_hash = null;
      patch.elevenlabs_tool_ids = [];
      agentNote = 'Booking is off. Ava will take messages instead.';
    }

    const saved = await saveCalendarForOnboarding(onboarding.id, patch);
    return NextResponse.json({ ok: true, enabled: saved.enabled, note: agentNote || 'Saved.' });
  } catch (error) {
    console.error('Unable to save booking settings', error);
    return NextResponse.json({ error: 'Booking settings could not be saved right now.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
