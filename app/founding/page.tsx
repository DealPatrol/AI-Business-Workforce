import { Suspense } from 'react';
import FoundingRequestForm from './request-form';

type FoundingPageProps = {
  searchParams: Promise<{ checkout?: string | string[] }>;
};

export default async function FoundingRequestPage({ searchParams }: FoundingPageProps) {
  const params = await searchParams;
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  return (
    <Suspense>
      <FoundingRequestForm checkoutState={checkout || ''} />
    </Suspense>
  );
}
