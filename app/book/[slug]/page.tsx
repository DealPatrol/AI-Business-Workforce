import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBusinessBySlug, listServices } from '@/lib/bookings/store';
import Booker from './booker';
import styles from '../book.module.css';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ canceled?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const business = await getBusinessBySlug(slug);
    if (!business) return { robots: { index: false, follow: false } };
    return {
      title: `Book ${business.name}`,
      description: `Pick a time and pay a deposit to book with ${business.name}.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

export default async function PublicBookPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  let business = null;
  let services = [] as Awaited<ReturnType<typeof listServices>>;
  try {
    business = await getBusinessBySlug(slug);
    if (business) services = await listServices(business.id, true);
  } catch (error) {
    console.error('Unable to load booking page', error);
  }
  if (!business) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link className={styles.brand} href="/">Front Porch Growth</Link>
        <h1 className={styles.title}>Book {business.name}</h1>
        <p className={styles.lede}>Choose a service and a time, then pay the deposit to confirm.</p>
        <Booker slug={business.slug} services={services} canceled={query.canceled === '1'} />
      </div>
    </main>
  );
}
