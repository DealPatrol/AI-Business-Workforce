import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // Preserve the original post-payment path for any existing Stripe Payment Link configuration.
  redirect('/onboarding/ava');
}
