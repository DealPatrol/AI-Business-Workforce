/** The full prompt input for an owner's Ava, so a Desk save never drops transfer rules or the price sheet. */
import { cleanPriceSheet } from '@/lib/ava/capabilities/price-sheet';
import type { OwnerOnboarding } from '@/lib/ava/booking/owner';
import type { AvaOnboardingDetails } from '@/lib/ava/provisioning';

export function promptDetailsFor(onboarding: OwnerOnboarding, bookingEnabled: boolean, overrides: Partial<AvaOnboardingDetails> = {}) {
  const row = onboarding as OwnerOnboarding & Record<string, unknown>;
  const sheet = row.price_sheet ? cleanPriceSheet(row.price_sheet) : null;
  const details: AvaOnboardingDetails = {
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
    transferRules: row.transfer_rules ?? null,
    priceSheet: sheet && sheet.ok ? sheet.sheet : null,
    bookingEnabled,
    ...overrides,
  };
  return details;
}
