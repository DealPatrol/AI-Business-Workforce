import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Mail, MapPin } from 'lucide-react';

type PropertyPageProps = {
  params: Promise<{ postcode: string }>;
};

function normalizePostcode(value: string) {
  const postcode = value.replace(/[^0-9A-Za-z -]/g, '').slice(0, 10);
  return postcode || '35077';
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { postcode: requestedPostcode } = await params;
  const postcode = normalizePostcode(requestedPostcode);
  const estimateSubject = encodeURIComponent(`YardProof demo estimate request — ${postcode}`);

  return (
    <main className="property-landing">
      <nav>
        <Link href={`/property-demo/postcard?zip=${encodeURIComponent(postcode)}`}>
          <ArrowLeft /> Postcard preview
        </Link>
        <Link className="property-brand" href="/">
          YardProof
        </Link>
        <span>DEMO HOMEOWNER PAGE</span>
      </nav>
      <section className="property-landing-hero">
        <div className="property-landing-copy">
          <span className="eyebrow">ILLUSTRATIVE LANDSCAPING CONCEPT</span>
          <h1>A fresh possibility for your front yard.</h1>
          <p>
            This sample shows how an approved postcard concept can give a homeowner a direct path
            to learn about the project and request an estimate.
          </p>
          <div className="property-location">
            <MapPin /> Demo service area · {postcode}
          </div>
          <ul>
            <li>
              <Check /> Defined planting beds and fresh mulch
            </li>
            <li>
              <Check /> Layered evergreen and flowering shrubs
            </li>
            <li>
              <Check /> Updated walkway and curb appeal
            </li>
          </ul>
          <a
            className="button"
            href={`mailto:colecollins763@gmail.com?subject=${estimateSubject}`}
          >
            <Mail /> Request a Demo Estimate
          </a>
          <small>
            Demo only. This page does not claim a live address lookup, generated estimate, or
            contractor availability.
          </small>
        </div>
        <div className="property-landing-image">
          <Image
            src="/service-landscaping.png"
            alt="Illustrative before-and-after landscaping concept"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 50vw"
          />
          <span>EXAMPLE BEFORE / AFTER</span>
        </div>
      </section>
    </main>
  );
}
