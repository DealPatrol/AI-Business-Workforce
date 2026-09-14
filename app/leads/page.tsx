import { redirect } from 'next/navigation';

export default function LeadsPage() {
  // Lead records are an operator view, not a public marketing destination.
  redirect('/receptionist-demo#live-demo');
}
