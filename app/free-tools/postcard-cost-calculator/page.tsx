import { PostcardCostCalculator } from '@/components/fpg/PostcardCalculators';
import { FpgToolPage } from '@/components/fpg/ToolPage';
import { fpgMetadata } from '@/lib/fpg/seo';

const PATH = '/free-tools/postcard-cost-calculator';
export const metadata = fpgMetadata(PATH);

export default function Page() {
  return (
    <FpgToolPage
      path={PATH}
      name="Postcard campaign cost calculator"
      h1="What will a postcard mailing cost?"
      lede="Pick a quantity and a card size. You get the exact YardMailer total, with printing, postage and mailing included, plus the USPS EDDM postage line for reference."
      how={[
        'YardMailer cards are $3.54 (4×6) or $4.95 (6×9) each, with printing, postage and mailing included.',
        'The $127 setup is charged once per customer. Later orders leave it off.',
        'Orders run from 100 to 10,000 cards. There is no monthly postcard plan.',
        'The EDDM line is USPS Every Door Direct Mail Retail postage only ($0.260 a piece, USPS Notice 123 effective Oct 4, 2026). It does not include design or printing.',
      ]}
      faqs={[
        { q: 'Is postage really included?', a: 'Yes. The per-card price covers printing, postage and mailing. You approve the design, audience and cost before anything is mailed.' },
        { q: 'Why compare to EDDM?', a: 'EDDM is the cheapest postage for saturating whole carrier routes, so it is the honest do-it-yourself baseline. You still have to design, print, bundle and drop off the mail yourself.' },
        { q: 'Does this calculator save what I type?', a: 'No. The math runs in your browser and nothing is sent.' },
      ]}
      next={{ href: '/postcards#packages', label: 'See postcard packages' }}
    >
      <PostcardCostCalculator />
    </FpgToolPage>
  );
}
