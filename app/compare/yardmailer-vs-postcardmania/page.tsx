import { FpgVsPage } from '@/components/fpg/VsPage';
import { fpgMetadata } from '@/lib/fpg/seo';

export const metadata = fpgMetadata('/compare/yardmailer-vs-postcardmania');

export default function Page() {
  return <FpgVsPage slug="yardmailer-vs-postcardmania" />;
}
