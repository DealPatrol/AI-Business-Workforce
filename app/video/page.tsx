import { permanentRedirect } from 'next/navigation';

/** Retired sales-week page; the published plans live on /pricing. */
export default function RetiredPage() {
  permanentRedirect('/pricing');
}
