import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // No verified production checkout exists yet, so this route must not claim payment succeeded.
  redirect('/founding?interest=ava');
}
