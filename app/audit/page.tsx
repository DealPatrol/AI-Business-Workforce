'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, Check } from 'lucide-react';

const outcomes = ['Get more customers', 'Stop leads falling through', 'Save office time', 'Improve marketing', 'Increase repeat business', 'Automate sales follow-up'];

type Recommendation = {
  summary?: string;
  agents?: string[];
  firstAutomation?: string;
  expectedOutcome?: string;
  pilot?: string;
};

export default function Audit() {
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState('Landscaping / Lawn Care');
  const [zip, setZip] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    setError('');
    setRecommendation(null);
    setStep(3);
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: business,
          goal: selected[0] || 'Get more customers',
          serviceArea: zip,
          painPoints: selected,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { recommendation?: Recommendation; error?: string } | null;
      if (!response.ok || !payload?.recommendation) {
        setError(payload?.error || 'The audit could not be written.');
        return;
      }
      setRecommendation(payload.recommendation);
    } catch {
      setError('The audit could not be written.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auditpage">
      <div className="auditnav">
        <Link href="/">
          <ArrowLeft /> Back
        </Link>
        <b>Front Porch Growth</b>
        <small>AI BUSINESS AUDIT</small>
      </div>
      <div className="auditbox">
        <div className="progress">
          <span style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        {step === 1 && (
          <section>
            <small>STEP 1 OF 3</small>
            <h1>Tell us about your business.</h1>
            <p>This asks the model for a starting workflow. It does not send email.</p>
            <label>
              Business type
              <select value={business} onChange={(event) => setBusiness(event.target.value)}>
                <option>Landscaping / Lawn Care</option>
                <option>Roofing</option>
                <option>HVAC</option>
                <option>Plumbing</option>
                <option>Painting</option>
                <option>Cleaning</option>
                <option>Other Service Business</option>
              </select>
            </label>
            <label>
              Primary ZIP / service area
              <input value={zip} onChange={(event) => setZip(event.target.value)} placeholder="35077" inputMode="numeric" />
            </label>
            <button className="button" type="button" onClick={() => setStep(2)}>
              Continue <ArrowRight />
            </button>
          </section>
        )}
        {step === 2 && (
          <section>
            <small>STEP 2 OF 3</small>
            <h1>What would make AI valuable?</h1>
            <p>Choose as many as apply.</p>
            <div className="choices">
              {outcomes.map((outcome) => (
                <button
                  className={selected.includes(outcome) ? 'picked' : ''}
                  type="button"
                  onClick={() => setSelected((current) => (current.includes(outcome) ? current.filter((item) => item !== outcome) : [...current, outcome]))}
                  key={outcome}
                >
                  <span>{selected.includes(outcome) ? <Check /> : <Bot />}</span>
                  {outcome}
                </button>
              ))}
            </div>
            <div className="auditactions">
              <button className="back" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="button" type="button" onClick={build} disabled={busy}>
                Build my starting point <ArrowRight />
              </button>
            </div>
          </section>
        )}
        {step === 3 && (
          <section>
            <small>YOUR STARTING POINT</small>
            <h1>Here is what the model returned.</h1>
            {busy ? <p>Writing the recommendation…</p> : null}
            {error ? (
              <p role="alert">{error}</p>
            ) : null}
            {recommendation ? (
              <>
                <p>{recommendation.summary}</p>
                <div className="recommendations">
                  {(recommendation.agents || []).map((name, index) => (
                    <div key={name}>
                      <span>
                        <Bot />
                      </span>
                      <div>
                        <small>{index === 0 ? 'START HERE' : 'ADD NEXT'}</small>
                        <b>{name}</b>
                      </div>
                    </div>
                  ))}
                </div>
                <p>{recommendation.firstAutomation}</p>
                <p>{recommendation.expectedOutcome}</p>
                <p>{recommendation.pilot}</p>
              </>
            ) : null}
            <div className="auditactions">
              <button className="back" type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <Link className="button" href="/agents">
                Open the writing agents <ArrowRight />
              </Link>
            </div>
            <p className="fine">This is a draft from the model. It is not a forecast, and it does not contact anyone.</p>
          </section>
        )}
      </div>
    </main>
  );
}
