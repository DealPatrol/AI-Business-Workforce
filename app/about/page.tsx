import type { Metadata } from 'next';
import Link from 'next/link';
import { SisterSites } from '@/components/seo/SisterSites';
import { AvaFooter } from '@/components/ava/AvaFooter';
import { SuiteShell } from '@/components/suite/SuiteShell';
import { requestHost } from '@/lib/seo/request-host';
import { SISTER_SITES, type SisterCluster } from '@/lib/seo/sister-sites';
import { urlsForRequest } from '@/lib/seo/host-metadata';
import { isExecutiveReceptionistHost } from '@/lib/site-url';
import { coleCollinsPersonJsonLd } from '@/lib/ava/structured-data';

const ER_SEO = {
  title: { absolute: 'About Executive Receptionist and Cole Collins' },
  description:
    'Executive Receptionist is an AI receptionist named Ava, built by Cole Collins in Hanceville, Alabama. Here is who runs it, and the other sites he makes.',
};

const FPG_SEO = {
  title: { absolute: 'About Front Porch Growth and Cole Collins' },
  description:
    'Front Porch Growth helps home-service shops with postcards, Google profiles, and visibility tools. It is run by Cole Collins in Hanceville, Alabama.',
};

export async function generateMetadata(): Promise<Metadata> {
  const host = await requestHost();
  const er = isExecutiveReceptionistHost(host);
  const seo = er ? ER_SEO : FPG_SEO;
  const urls = await urlsForRequest('/about', '/about');
  const title = er ? 'About Executive Receptionist and Cole Collins' : 'About Front Porch Growth and Cole Collins';
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: urls.canonical },
    openGraph: {
      title,
      description: seo.description,
      url: urls.openGraphUrl,
      type: 'website',
    },
  };
}

function AboutBody({ er }: { er: boolean }) {
  const selfUrl = er ? 'https://executivereceptionist.com' : 'https://frontporchgrowth.com';
  const clusters: SisterCluster[] = er ? ['home-services', 'phone'] : ['home-services', 'reviews'];
  return (
    <article style={{ width: 'min(760px, calc(100% - 40px))', margin: '40px auto 80px', lineHeight: 1.6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coleCollinsPersonJsonLd()).replace(/</g, '\\u003c') }}
      />
      <h1>{er ? 'About Executive Receptionist' : 'About Front Porch Growth'}</h1>
      {er ? (
        <>
          <p>
            Executive Receptionist is an AI phone receptionist named Ava. She answers the calls a shop forwards to her,
            asks the questions the owner approves, and emails the lead. Plans are month to month: Starter is $79 a month
            for 100 minutes (Starter is the only plan whose first month is $1), Growth is $197 for 300 minutes, Pro is
            $397 for 1,200 minutes, and Elite is $789 for 2,000 minutes with priority setup. There is no free pilot.
          </p>
          <p>
            Cole Collins operates the business from Hanceville, Alabama. Public number:{' '}
            <a href="tel:+12565953354">(256) 595-3354</a>. Demo line:{' '}
            <a href="tel:+12569524935">(256) 952-4935</a>. Ava only answers inbound calls.
          </p>
          <p>
            Marketing services for the same kind of shop live on the sister brand{' '}
            <a href="https://frontporchgrowth.com">Front Porch Growth</a>.
          </p>
        </>
      ) : (
        <>
          <p>
            Front Porch Growth helps home-service shops get found and get booked: YardMailer postcards, Google Business
            Profile setup, a free SEO and AI-visibility grader, Lead Scout, and review-request tools. Cole Collins built
            it in Hanceville, Alabama, for work he already does in the field.
          </p>
          <p>
            The AI receptionist named Ava lives on the sister site{' '}
            <a href="https://executivereceptionist.com">Executive Receptionist</a>. Front Porch Growth links there
            instead of republishing that product.
          </p>
        </>
      )}
      <h2>Sites from the same maker</h2>
      <p>These are official sites Cole operates. Each one is its own brand with its own purpose.</p>
      <ul>
        {SISTER_SITES.map((site) => (
          <li key={site.url}>
            <a href={site.url} rel="noopener">
              {site.name}
            </a>
            {' — '}
            {site.blurb}
          </li>
        ))}
      </ul>
      <SisterSites selfUrl={selfUrl} clusters={clusters} aboutHref="/about" />
      <p>
        <Link href="/">{er ? 'Back to Executive Receptionist' : 'Back to Front Porch Growth'}</Link>
      </p>
    </article>
  );
}

export default async function AboutPage() {
  const er = isExecutiveReceptionistHost(await requestHost());
  if (er) {
    return (
      <>
        <AboutBody er />
        <AvaFooter />
      </>
    );
  }
  return (
    <SuiteShell>
      <AboutBody er={false} />
    </SuiteShell>
  );
}
