import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, QrCode } from 'lucide-react';
import { FOUNDING_PAYMENT_LINK } from '@/lib/payments';

type PostcardProps = {
  searchParams: Promise<{ zip?: string }>;
};

function normalizeZip(value: string | undefined) {
  const zip = value?.replace(/\D/g, '').slice(0, 5);
  return zip || '35077';
}

export default async function Postcard({ searchParams }: PostcardProps) {
  const { zip: requestedZip } = await searchParams;
  const zip = normalizeZip(requestedZip);

  return (
    <main className="postpage">
      <header>
        <Link href={`/property-demo?zip=${zip}`}>
          <ArrowLeft /> Back to design
        </Link>
        <b>YardProof Personalized Outreach</b>
        <a href={FOUNDING_PAYMENT_LINK}>Start a campaign</a>
      </header>
      <div className="postwrap">
        <div className="studiohead">
          <span>STEP 5 · OUTREACH</span>
          <h1>Turn the concept into a conversation.</h1>
          <p>Preview the postcard and homeowner landing-page path before anything is sent.</p>
        </div>
        <div className="postgrid">
          <section>
            <div className="bigpost">
              <div className="postimage">
                <Image
                  src="/service-landscaping.png"
                  alt="Illustrative front-yard landscaping concept"
                  fill
                  priority
                  sizes="(max-width: 800px) 100vw, 50vw"
                />
                <span>ILLUSTRATIVE CONCEPT · DEMO PROPERTY</span>
              </div>
              <div className="postcopy">
                <small>YOUR HOME. A FRESH POSSIBILITY.</small>
                <h2>A fresh idea for your front yard.</h2>
                <p>
                  We prepared a Clean &amp; Simple landscaping idea with practical curb-appeal
                  improvements.
                </p>
                <div className="qrcode">
                  <QrCode />
                  <span>
                    <b>See your project idea</b>
                    <small>ZIP {zip} · View the concept and request an estimate.</small>
                  </span>
                </div>
                <strong>YOUR COMPANY NAME · (555) 555-0123</strong>
              </div>
            </div>
            <p className="fine">
              Demo postcard. A founding campaign&apos;s business identity, approved imagery, QR
              destination, and mailing details are prepared with the customer before launch.
            </p>
          </section>
          <aside className="sendpanel">
            <small>MANAGED CAMPAIGN WORKFLOW</small>
            <h2>Nothing sends without approval.</h2>
            <div>
              <CheckCircle2 />
              <span>
                <b>Property concept</b>
                <small>Clearly labeled and reviewed</small>
              </span>
            </div>
            <div>
              <CheckCircle2 />
              <span>
                <b>Materials + pricing</b>
                <small>Contractor-controlled demo scope</small>
              </span>
            </div>
            <div>
              <CheckCircle2 />
              <span>
                <b>Personalized landing page</b>
                <small>Estimate-request path</small>
              </span>
            </div>
            <div>
              <Mail />
              <span>
                <b>Printing + mailing</b>
                <small>Quantity and costs approved before send</small>
              </span>
            </div>
            <Link className="button full" href={`/property/${zip}`}>
              Preview Homeowner Page <ExternalLink />
            </Link>
            <a className="button full" href={FOUNDING_PAYMENT_LINK}>
              Pay $299 — Start This Campaign
            </a>
            <Link href={`/property-demo?zip=${zip}`}>Keep exploring the demo</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
