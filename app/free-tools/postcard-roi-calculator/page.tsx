import { PostcardBreakEvenCalculator } from '@/components/fpg/PostcardCalculators';
import { FpgToolPage } from '@/components/fpg/ToolPage';
import { fpgMetadata } from '@/lib/fpg/seo';

const PATH = '/free-tools/postcard-roi-calculator';
export const metadata = fpgMetadata(PATH);

export default function Page() {
  return (
    <FpgToolPage
      path={PATH}
      name="Postcard break-even calculator"
      h1="How many jobs does a mailing need to pay for itself?"
      lede="Enter how many cards you would mail, what a typical job is worth, and your margin on it. The calculator shows the number of jobs where the mailing pays for itself."
      how={[
        'Mailing cost = $127 setup + cards × per-card price ($3.54 for 4×6, $4.95 for 6×9).',
        'Gross profit per job = job value × your margin.',
        'Break-even jobs = mailing cost ÷ gross profit per job, rounded up.',
        'Every input is yours. The page does not assume a response rate.',
      ]}
      faqs={[
        { q: 'What response rate should I expect?', a: 'This page does not quote one. Results depend on your trade, the streets you pick, the offer and the season. The break-even number tells you how low a response you can live with.' },
        { q: 'Should I use revenue or profit?', a: 'Use your gross margin, so the result reflects what a job actually puts back in the business after materials and labor.' },
        { q: 'Does this calculator save what I type?', a: 'No. The math runs in your browser and nothing is sent.' },
      ]}
      next={{ href: '/free-tools/postcard-cost-calculator', label: 'Price a mailing exactly' }}
    >
      <PostcardBreakEvenCalculator />
    </FpgToolPage>
  );
}
