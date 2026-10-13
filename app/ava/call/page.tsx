import Link from 'next/link';

export const metadata = { title: 'Call Ava — demo line | Front Porch Growth' };

export default function CallAvaPage() {
  const raw = process.env.NEXT_PUBLIC_AVA_DEMO_NUMBER?.trim() || '';
  const digits = raw.replace(/\D/g, '');
  const pretty = digits.length === 11 ? `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}` : raw;
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui', color: '#17211b', textAlign: 'center' }}>
      <small>AVA · DEMO LINE</small>
      <h1>Call Ava like your customers would.</h1>
      {digits ? (
        <>
          <p><a href={`tel:+${digits}`} style={{ fontSize: 36, fontWeight: 700, color: '#1f6f43' }}>{pretty}</a></p>
          <p>Pretend you need a quote or have a leak. She’ll take your name, number, and the job — exactly what she does on your line. Calls are recorded for quality. Ava is an AI and says so.</p>
          <p><small>Demo calls are limited to a few minutes. Your number is not added to any list.</small></p>
        </>
      ) : (
        <p>The phone demo line is not open right now. <Link href="/ava#live-demo">Talk to Ava in your browser</Link> instead — no signup.</p>
      )}
      <p><Link href="/ava#pricing">See plans · free 7-day trial</Link></p>
    </main>
  );
}
