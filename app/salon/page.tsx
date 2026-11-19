import type { Metadata } from 'next';
import { BusinessLanding } from '@/components/receptionist/BusinessLanding';
import { BUSINESS_PAGES } from '@/lib/ava/business-pages';
import { businessPageMetadata } from '@/lib/ava/business-page-metadata';
import { pageSeo, renderedTitle } from '@/lib/seo/pages';

const page = BUSINESS_PAGES['salon'];
const seo = pageSeo(page.path);

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return businessPageMetadata(page.path, seo);
}

export default function Page() {
  return <BusinessLanding page={page} title={renderedTitle(seo)} description={seo.description} />;
}
