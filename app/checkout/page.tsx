import { redirect } from 'next/navigation';
import { isAvaPlanKey } from '@/lib/ava/pricing';

type CheckoutPageProps = {
  searchParams: Promise<{ plan?: string | string[]; offer?: string | string[] }>;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || '').toLowerCase();
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const plan = first(params.plan);
  const offer = first(params.offer);

  if (offer === 'founding' || plan === 'founding') {
    redirect('/api/checkout?offer=founding');
  }

  if (isAvaPlanKey(plan)) {
    redirect(`/api/checkout?plan=${plan}`);
  }

  redirect('/ava#pricing');
}
