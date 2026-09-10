import { redirect } from 'next/navigation';

type OnboardingPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
    plan?: string | string[];
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  // Preserve Checkout context for sessions created before the Ava-specific URL was introduced.
  const params = await searchParams;
  const destinationParams = new URLSearchParams();
  const sessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  const plan = Array.isArray(params.plan) ? params.plan[0] : params.plan;

  if (sessionId) destinationParams.set('session_id', sessionId);
  if (plan) destinationParams.set('plan', plan);

  const query = destinationParams.toString();
  redirect(`/onboarding/ava${query ? `?${query}` : ''}`);
}
