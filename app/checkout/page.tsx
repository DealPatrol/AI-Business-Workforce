import { redirect } from 'next/navigation';

export default function CheckoutPage() {
  // Stripe is not configured in production. Keep visitors on the honest request path until it is.
  redirect('/founding?interest=ava');
}
