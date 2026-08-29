'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Mail, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const CONTACT_EMAIL = 'colecollins763@gmail.com';

function buildEmailFallback(form: HTMLFormElement) {
  const data = new FormData(form);
  const subject = encodeURIComponent(
    `Workforce AI founding request — ${String(data.get('business') || 'New business')}`,
  );
  const body = encodeURIComponent(
    [
      `Business: ${data.get('business') || ''}`,
      `Contact: ${data.get('contact') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone: ${data.get('phone') || ''}`,
      `Industry: ${data.get('industry') || ''}`,
      `Service area: ${data.get('serviceArea') || ''}`,
      `Interested in: ${data.get('interest') || ''}`,
      '',
      `What they want help with:\n${data.get('notes') || ''}`,
    ].join('\n'),
  );

  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function FoundingRequestForm() {
  const searchParams = useSearchParams();
  const initialInterest =
    searchParams.get('interest') === 'ava' ? 'Ava AI Receptionist' : 'Visual Canvasser campaign';
  const initialIndustry = searchParams.get('industry') || 'Landscaping / Lawn Care';
  const initialServiceArea = searchParams.get('serviceArea') || '';
  const initialGoal = searchParams.get('goal') || '';
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'email'>('idle');
  const [error, setError] = useState('');
  const [emailFallback, setEmailFallback] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    setEmailFallback('');

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/founding-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.emailFallback) {
          const fallback = buildEmailFallback(form);
          setEmailFallback(fallback);
          setStatus('email');
          window.location.href = fallback;
          return;
        }
        throw new Error(result.error || 'Could not send your request.');
      }

      setStatus('sent');
      form.reset();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Could not send your request.',
      );
      setStatus('idle');
    }
  }

  return (
    <main className="founding-page">
      <nav>
        <Link href="/">
          <ArrowLeft /> Back
        </Link>
        <b>
          <Sparkles /> Workforce AI
        </b>
      </nav>
      <section>
        <div className="request-copy">
          <span>FOUNDING CUSTOMER REQUEST</span>
          <h1>Let&apos;s build the first campaign with you.</h1>
          <p>
            Tell Cole about your business and service area. No account or payment is required to
            request a spot. He&apos;ll reply personally to confirm fit, scope, and any pass-through
            campaign costs before you pay.
          </p>
          <div>
            <p>
              <Check /> $299 founding launch
            </p>
            <p>
              <Check /> Then $99/month for the initial managed automation
            </p>
            <p>
              <Check /> Materials, margin, and campaign setup tailored to your business
            </p>
          </div>
          <small>
            Prefer email?{' '}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Workforce%20AI%20founding%20request`}>
              {CONTACT_EMAIL}
            </a>
          </small>
        </div>

        {status === 'sent' ? (
          <div className="success">
            <Check />
            <h2>Your request reached Cole.</h2>
            <p>He&apos;ll follow up at the email or phone number you provided.</p>
            <Link href="/">Return home</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="two">
              <label>
                Business name
                <input name="business" required autoComplete="organization" />
              </label>
              <label>
                Your name
                <input name="contact" required autoComplete="name" />
              </label>
            </div>
            <div className="two">
              <label>
                Email
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                Best phone
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
            </div>
            <div className="two">
              <label>
                Industry
                <select name="industry" defaultValue={initialIndustry}>
                  <option>Landscaping / Lawn Care</option>
                  <option>Roofing</option>
                  <option>HVAC</option>
                  <option>Plumbing</option>
                  <option>Pressure Washing</option>
                  <option>Exterior Painting</option>
                  <option>Fencing</option>
                  <option>Tree Service</option>
                  <option>Other Service Business</option>
                  <option>Other Home Service</option>
                </select>
              </label>
              <label>
                ZIP / service area
                <input
                  name="serviceArea"
                  autoComplete="postal-code"
                  placeholder="35077"
                  defaultValue={initialServiceArea}
                />
              </label>
            </div>
            <label>
              What are you interested in?
              <select name="interest" defaultValue={initialInterest} required>
                <option>Visual Canvasser campaign</option>
                <option>Ava AI Receptionist</option>
                <option>Both Visual Canvasser and Ava</option>
                <option>Another managed AI workflow</option>
              </select>
            </label>
            <label>
              What would make this a win for your business?
              <textarea
                name="notes"
                rows={5}
                defaultValue={initialGoal}
                placeholder="The jobs you want, your target neighborhoods, missed-call problem, or anything Cole should know."
              />
            </label>
            <label className="honeypot" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <Loader2 className="spin" /> Sending…
                </>
              ) : (
                'Request My Founding Spot'
              )}
            </button>
            {status === 'email' && (
              <p className="notice">
                Your email app should open with the request filled in. Send that message to finish,
                or <a href={emailFallback}>open it again</a>.
              </p>
            )}
            {error && <p className="error">{error}</p>}
            <small className="privacy">
              <Mail /> Your details go directly to Cole for this request.
            </small>
          </form>
        )}
      </section>
      <style jsx>{`
        .founding-page{min-height:100vh;background:#f4f7f3;color:#17201a;padding-bottom:70px}.founding-page nav{height:72px;background:#fff;border-bottom:1px solid #dfe5df;display:flex;align-items:center;justify-content:space-between;padding:0 max(20px,calc((100vw - 980px)/2))}.founding-page nav a,.founding-page nav b{display:flex;align-items:center;gap:7px;color:inherit;text-decoration:none;font-size:13px}.founding-page nav svg{width:17px;color:#2e8b57}.founding-page section{width:min(980px,calc(100% - 40px));margin:70px auto;display:grid;grid-template-columns:.85fr 1.15fr;gap:70px;align-items:start}.request-copy>span{font-size:10px;letter-spacing:.13em;font-weight:900;color:#2e8b57}.request-copy h1{font:500 50px/1.03 Georgia,serif;letter-spacing:-.03em;margin:14px 0 20px}.request-copy>p{color:#657168;line-height:1.65}.request-copy>div{margin:28px 0;display:grid;gap:10px}.request-copy>div p{display:flex;align-items:flex-start;gap:8px;margin:0;font-size:13px}.request-copy svg{width:17px;color:#2e8b57;flex:none}.request-copy small{color:#758078}.request-copy small a{color:#205c39;font-weight:750}.founding-page form,.success{background:#fff;border:1px solid #dce3dc;border-radius:16px;padding:30px;box-shadow:0 18px 50px rgba(25,53,35,.08)}.founding-page form{display:grid;gap:17px}.founding-page label{display:grid;gap:7px;font-size:11px;font-weight:800;color:#526057}.founding-page input,.founding-page select,.founding-page textarea{width:100%;border:1px solid #d5ddd6;border-radius:8px;padding:12px;background:#fff;color:#17201a;font:inherit}.founding-page textarea{resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}.founding-page button{border:0;border-radius:9px;padding:14px;background:#205c39;color:#fff;font-weight:850;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.founding-page button:disabled{opacity:.65}.founding-page button svg{width:18px}.honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.privacy{display:flex;align-items:center;justify-content:center;gap:6px;color:#7d877f}.privacy svg{width:14px}.notice{background:#edf5ef;color:#315f43;padding:12px;border-radius:8px;font-size:12px;line-height:1.5;margin:0}.notice a{font-weight:800}.error{color:#a83232;font-size:12px;margin:0}.success{text-align:center;padding:55px 30px}.success>svg{width:52px;height:52px;color:#2e8b57}.success h2{font:500 35px Georgia,serif}.success p{color:#68736b}.success a{color:#205c39;font-weight:800}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:760px){.founding-page section{grid-template-columns:1fr;gap:35px;margin-top:45px}.request-copy h1{font-size:42px}.two{grid-template-columns:1fr}.founding-page form{padding:22px}}
      `}</style>
    </main>
  );
}

export default function FoundingRequestPage() {
  return (
    <Suspense>
      <FoundingRequestForm />
    </Suspense>
  );
}
