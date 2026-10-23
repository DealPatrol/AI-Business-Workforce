import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAvaPlanKey } from '@/lib/ava/pricing';
import { isPostcardSize, parsePostcardQuantity } from '@/lib/postcards/pricing';
import { metadataTitle, pageSeo, renderedTitle } from '@/lib/seo/pages';

const seo = pageSeo('/checkout');

export const metadata: Metadata = {
  title: metadataTitle(seo),
  description: seo.description,
  robots: { index: false, follow: false },
  openGraph: { title: renderedTitle(seo), description: seo.description, url: '/checkout' },
};

type CheckoutPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
    offer?: string | string[];
    size?: string | string[];
    quantity?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value || '').trim();
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const plan = first(params.plan).toLowerCase();
  const offer = first(params.offer).toLowerCase();
  const postcard =
    offer === 'founding' ||
    offer === 'postcard' ||
    offer === 'yardmailer' ||
    plan === 'founding' ||
    plan === 'postcard' ||
    plan === 'yardmailer';

  if (postcard) {
    const size = first(params.size).toLowerCase();
    const quantity = parsePostcardQuantity(first(params.quantity));
    if (!isPostcardSize(size) || quantity == null) redirect('/pricing');
    return (
      <main className="wrap" style={{ padding: '72px 0' }}>
        <h1>Continue to postcard checkout</h1>
        <p>Submitting this form opens Stripe. Nothing is charged until you pay there.</p>
        <form className="checkout-form" method="POST" action="/api/checkout">
          <input type="hidden" name="offer" value="postcard" />
          <input type="hidden" name="size" value={size} />
          <input type="hidden" name="quantity" value={String(quantity)} />
          <button className="button" type="submit">
            Continue to Stripe
          </button>
        </form>
      </main>
    );
  }

  if (!isAvaPlanKey(plan)) redirect('/pricing');

  return (
    <main className="wrap" style={{ padding: '72px 0' }}>
      <h1>Continue to checkout</h1>
      <p>Submitting this form opens Stripe. The 7-day trial is $0 today.</p>
      <form className="checkout-form" method="POST" action="/api/checkout">
        <input type="hidden" name="plan" value={plan} />
        <button className="button" type="submit">
          Continue to Stripe
        </button>
      </form>
    </main>
  );
}
