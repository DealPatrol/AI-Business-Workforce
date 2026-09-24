import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, QrCode } from 'lucide-react';
import { FOUNDING_PAYMENT_LINK } from '@/lib/payments';

type PostcardProps = {
  searchParams: Promise<{
    zip?: string;
    current?: string;
    after?: string;
    token?: string;
  }>;
};

function normalizeZip(value: string | undefined) {
  const zip = value?.replace(/\D/g, '').slice(0, 5);
  return zip || '35077';
}

function safeImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function Postcard({ searchParams }: PostcardProps) {
  const params = await searchParams;
  const zip = normalizeZip(params.zip);
  const currentUrl = safeImageUrl(params.current);
  const afterUrl = safeImageUrl(params.after);
  const hasPair = Boolean(currentUrl && afterUrl);
  const qrHint = params.token
    ? `Live QR destination /q/${params.token.slice(0, 12)}…`
    : `ZIP ${zip} · View the concept and request an estimate.`;

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
          <p>
            Preview the postcard and homeowner landing-page path before anything is sent.
            {hasPair
              ? ' Showing Current | After from supplied imagery (crew/owner Current + After concept).'
              : ' Demo art below — live Current|After appears when crew photo + approved After URLs are provided.'}
          </p>
        </div>
        <div className="postgrid">
          <section>
            <div className="bigpost">
              <div className="postimage" style={hasPair ? { display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 0 } : undefined}>
                {hasPair ? (
                  <>
                    <div style={{ position: 'relative', minHeight: 280 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentUrl!}
                        alt="Current property photo (crew or owner upload)"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                      <span>CURRENT · CREW / OWNER</span>
                    </div>
                    <div style={{ position: 'relative', minHeight: 280 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={afterUrl!}
                        alt="After concept — modest plant and trim refresh"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                      />
                      <span style={{ left: 'auto', right: 13 }}>AFTER · ILLUSTRATIVE CONCEPT</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src="/service-landscaping.png"
                      alt="Illustrative front-yard landscaping concept"
                      fill
                      priority
                      sizes="(max-width: 800px) 100vw, 50vw"
                    />
                    <span>ILLUSTRATIVE CONCEPT · DEMO PROPERTY</span>
                  </>
                )}
              </div>
              <div className="postcopy">
                <small>YOUR HOME. A FRESH POSSIBILITY.</small>
                <h2>A fresh idea for your front yard.</h2>
                <p>
                  Concept after a light plant &amp; trim refresh (approx. $1–3k plant materials).
                  Same house and camera angle — not a luxury redesign. Street View is never printed.
                </p>
                <div className="qrcode">
                  <QrCode />
                  <span>
                    <b>See your project idea</b>
                    <small>{qrHint}</small>
                  </span>
                </div>
                <strong>YOUR COMPANY NAME · (555) 555-0123</strong>
              </div>
            </div>
            <p className="fine">
              Demo postcard mock. Printable Current must be crew_photo or owner_upload; After requires
              human review before mail. Street View is internal reference only (not a print asset, not
              AI input). A founding campaign&apos;s business identity, approved imagery, QR destination,
              and mailing details are prepared with the customer before launch.
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
