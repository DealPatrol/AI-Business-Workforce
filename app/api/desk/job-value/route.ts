import { NextRequest, NextResponse } from 'next/server';
import { onboardingForOwnerEmail } from '@/lib/ava/booking/owner';
import { formatUsd, parseJobValueInput } from '@/lib/desk/metrics';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Saves the owner's average job value (used only for the Desk's estimated revenue). Empty clears it. */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { value?: unknown } | null;
  const cents = parseJobValueInput(body?.value);
  if (cents === undefined) return NextResponse.json({ error: 'Enter a dollar amount between $1 and $100,000.' }, { status: 400 });

  try {
    const onboarding = await onboardingForOwnerEmail(user.email ?? '');
    if (!onboarding) return NextResponse.json({ error: 'Finish setup first.' }, { status: 404 });
    const { error } = await createAdminClient()
      .from('ava_onboardings')
      .update({ avg_job_value_cents: cents, updated_at: new Date().toISOString() })
      .eq('id', onboarding.id);
    if (error) {
      console.error('Unable to save average job value', error.message);
      return NextResponse.json({ error: 'Average job value could not be saved right now.' }, { status: 503 });
    }
    return NextResponse.json({ ok: true, cents, note: cents === null ? 'Cleared.' : `Saved: ${formatUsd(cents)} per job.` });
  } catch (error) {
    console.error('Unable to save average job value', error);
    return NextResponse.json({ error: 'Average job value could not be saved right now.' }, { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found.' }, { status: 404 });
}
