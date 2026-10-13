import Link from 'next/link';

export const metadata = {
  title: 'ReputationFlow — more Google reviews for home-service businesses',
  description: 'After each job, send one friendly text or email with a direct link to your Google review page. Free review score, reply drafts, no review gating.',
};

const card: React.CSSProperties = { border: '1px solid #d9e2dc', borderRadius: 12, padding: 18, background: '#fff' };

export default function ReputationFlowHome() {
  return (
    <main style={{ fontFamily: 'system-ui', color: '#17211b', background: '#f6f8f6' }}>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '56px 20px 32px' }}>
        <small>REPUTATIONFLOW · by Front Porch Growth</small>
        <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: '10px 0' }}>More 5-star Google reviews, without asking awkwardly.</h1>
        <p style={{ fontSize: 19, maxWidth: 640 }}>After each job your customer gets one friendly text or email with a direct link to your Google review box. You see who opened it, read private notes, and get AI reply drafts.</p>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/login?next=/dashboard/reviews" style={{ background: '#1f6f43', color: '#fff', padding: '12px 18px', borderRadius: 8, textDecoration: 'none' }}>Start free</Link>
          <Link href="/reputationflow/score" style={{ border: '1px solid #1f6f43', padding: '12px 18px', borderRadius: 8, textDecoration: 'none', color: '#1f6f43' }}>Get your free review score</Link>
        </p>
        <small>Free during early access. No card. No contract.</small>
      </section>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        <div style={card}><h3>1. Add your review link</h3><p>Paste the Google review link from your Business Profile. Facebook and Yelp are optional.</p></div>
        <div style={card}><h3>2. Job done → send the ask</h3><p>Type the customer’s name and email or cell. One request goes out, plus one reminder after 3 days if they did not open it.</p></div>
        <div style={card}><h3>3. Reviews land on Google</h3><p>Read private notes in your dashboard and draft replies you paste on Google yourself.</p></div>
      </section>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
        <h2>What works today</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>Email review requests and text review requests (texts only to customers who agreed to hear from you)</li>
          <li>One automatic follow-up reminder</li>
          <li>Review page + printable QR code for invoices and leave-behinds</li>
          <li>Private feedback, in addition to the public links (never instead of them)</li>
          <li>AI-drafted replies you edit and post yourself</li>
          <li>Free review score vs. the top 3 local competitors on Google</li>
        </ul>
        <p><b>Not yet:</b> automatic Jobber / QuickBooks / Housecall Pro sync, a website review widget, and posting replies to Google for you. We will say so when they ship.</p>
      </section>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
        <h2>The rules we follow</h2>
        <p>Google does not allow review gating or paying for reviews. Every customer sees the same review links, whatever they rate the job. Texts carry “Reply STOP to opt out,” and we never send cold texts.</p>
      </section>
      <footer style={{ maxWidth: 960, margin: '0 auto', padding: 20, borderTop: '1px solid #d9e2dc' }}>
        Part of <a href="https://frontporchgrowth.com">Front Porch Growth</a>: <a href="https://frontporchgrowth.com/ava">Ava answers your calls</a> · <a href="https://frontporchgrowth.com/postcards">YardProof postcards</a> · colecollins763@gmail.com
      </footer>
    </main>
  );
}
