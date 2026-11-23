import { FpgVsPage } from '@/components/fpg/VsPage';
import { fpgMetadata } from '@/lib/fpg/seo';

export const metadata = fpgMetadata('/compare/front-porch-growth-vs-otterly');

export default function Page() {
  return <FpgVsPage slug="front-porch-growth-vs-otterly" />;
}
