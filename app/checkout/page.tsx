import { redirect } from 'next/navigation';
import { isAvaPlanKey } from '@/lib/ava/pricing';

type CheckoutPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
    offer?: string | string[];
    size?: string | string[];
    quantity?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || '').toLowerCase();
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const plan = first(params.plan);
  const offer = first(params.offer);

  if (
    offer === 'founding' ||
    offer === 'postcard' ||
    offer === 'yardmailer' ||
    plan === 'founding' ||
    plan === 'postcard' ||
    plan === 'yardmailer'
  ) {
    const size = first(params.size);
    const quantity = first(params.quantity);
    if ((size === '4x6' || size === '6x9') && quantity) {
      redirect(`/api/checkout?offer=postcard&size=${encodeURIComponent(size)}&quantity=${encodeURIComponent(quantity)}`);
    }
    redirect('/postcards#packages');
  }

  if (isAvaPlanKey(plan)) {
    redirect(`/api/checkout?plan=${plan}`);
  }

  redirect('/receptionist#pricing');
}
