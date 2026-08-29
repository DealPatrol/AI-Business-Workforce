import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // Cole can set the Payment Link's after_completion URL here in Stripe Dashboard once this
  // route verifies the completed payment. Until then, it must not claim payment succeeded.
  redirect('/founding?interest=ava');
}
