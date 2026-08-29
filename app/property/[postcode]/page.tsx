import { redirect } from 'next/navigation';

type PropertyPageProps = {
  params: Promise<{ postcode: string }>;
};

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { postcode } = await params;
  const safePostcode = postcode.replace(/[^0-9A-Za-z -]/g, '').slice(0, 10);

  redirect(`/property-demo?zip=${encodeURIComponent(safePostcode || '35077')}`);
}
