import { redirect } from 'next/navigation';

/** The old overview showed sample numbers. Customers now land on their desk. */
export default function DashboardIndex() {
  redirect('/desk');
}
