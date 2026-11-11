import { NextRequest, NextResponse } from 'next/server';
import { onboardingForOwnerEmail } from '@/lib/ava/booking/owner';
import { calendarForOnboarding, saveCalendarForOnboarding, type CalendarRow } from '@/lib/ava/booking/store';
import type { OwnerOnboarding } from '@/lib/ava/booking/owner';
import { googleRedirectUri } from '@/lib/ava/booking/google';
import { createClient } from '@/lib/supabase/server';

/** The signed-in owner's onboarding and booking calendar (creating an off calendar if none exists yet). */
export type OwnerCalendarResult =
  | { error: 'signin' | 'setup' | 'store' | 'failed' }
  | { onboarding: OwnerOnboarding; calendar: CalendarRow };

export async function ownerCalendar(): Promise<OwnerCalendarResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return { error: 'signin' };
  const onboarding = await onboardingForOwnerEmail(user.email);
  if (!onboarding) return { error: 'setup' };
  if ((onboarding.selected_plan || '').toLowerCase() === 'store') return { error: 'store' };
  const calendar =
    (await calendarForOnboarding(onboarding.id)) ??
    (await saveCalendarForOnboarding(onboarding.id, { enabled: false, label: onboarding.business_name || 'Ava calendar' }));
  return { onboarding, calendar };
}

/** Redirect URI registered on the Google OAuth client: env override, else this deployment's origin. */
export function redirectUriFor(request: NextRequest) {
  return googleRedirectUri(request.nextUrl.origin);
}

export function deskRedirect(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/desk?google=${encodeURIComponent(status)}#calendar`, request.nextUrl.origin), 303);
}
