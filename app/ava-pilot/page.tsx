'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Check,
  Clock3,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { AVA_PILOT_OFFER, AVA_PILOT_PAYMENT_LINK, SALES_WEEK_TARGETS } from '@/lib/ava-pilot-offer';
import { getPersonalizedDemos } from '@/lib/prospects';
import './pilot.css';

const personalizedDemos = getPersonalizedDemos();

export default function AvaPilotPage() {
  return (
    <main className="ava-pilot">
      <nav className="pilot-nav">
        <Link className="pilot-brand" href="/">
          <span>
            <Sparkles size={17} />
          </span>
          Workforce AI
        </Link>
        <div className="pilot-nav-links">
          <a href="#offer">Offer</a>
          <a href="#demos">Demos</a>
          <a href="#video">Video</a>
        </div>
        <Link className="pilot-nav-cta" href="/sales">
          Sales tracker
        </Link>
      </nav>

      <section className="pilot-hero">
        <div>
          <span className="pilot-kicker">HVAC & PLUMBING PILOT · SALES WEEK</span>
          <h1>
            Stop losing jobs because <em>nobody answered.</em>
          </h1>
          <p>{AVA_PILOT_OFFER.subheadline}</p>
          <div className="pilot-price">
            <div>
              <small>SETUP</small>
              <strong>${AVA_PILOT_OFFER.setupFee}</strong>
            </div>
            <div>
              <small>AFTER {AVA_PILOT_OFFER.pilotDays}-DAY PILOT</small>
              <strong>${AVA_PILOT_OFFER.monthlyFee}/mo</strong>
            </div>
          </div>
          <p className="pilot-terms">
            {AVA_PILOT_OFFER.usageLimit} · {AVA_PILOT_OFFER.cancelPolicy}
          </p>
          <div className="pilot-actions">
            <a className="pilot-btn primary" href={AVA_PILOT_PAYMENT_LINK}>
              {AVA_PILOT_OFFER.ctaPrimary}
            </a>
            <Link className="pilot-btn secondary" href="/video">
              Watch 60-second overview <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="pilot-outcome">
          <div className="outcome-step">
            <PhoneCall size={18} />
            <span>Customer calls while you&apos;re on a job</span>
          </div>
          <div className="outcome-step">
            <Sparkles size={18} />
            <span>Ava answers, qualifies, captures details</span>
          </div>
          <div className="outcome-step highlight">
            <BellRing size={18} />
            <span>You get a qualified lead summary — not voicemail</span>
          </div>
        </div>
      </section>

      <section id="offer" className="pilot-section">
        <div className="section-head">
          <span className="pilot-kicker">ONE CLEAR OFFER</span>
          <h2>Built for phone-first HVAC and plumbing businesses.</h2>
          <p>
            Target: local owner-operators with 3–20 employees who lose calls while technicians are
            working. No call center. No long contracts. Just a paid pilot to prove Ava pays for
            herself.
          </p>
        </div>
        <div className="offer-grid">
          <article>
            <Check size={18} />
            <h3>Answers missed & after-hours calls</h3>
            <p>When your team is on a job, Ava picks up and sounds like part of your business.</p>
          </article>
          <article>
            <Check size={18} />
            <h3>Handles common questions</h3>
            <p>Service area, hours, emergency availability, and basic job intake — automatically.</p>
          </article>
          <article>
            <Check size={18} />
            <h3>Captures qualified lead details</h3>
            <p>Name, phone, address, service type, and urgency — structured and ready to act on.</p>
          </article>
          <article>
            <Check size={18} />
            <h3>Sends owner a lead summary</h3>
            <p>No listening to voicemail. You get the full context before you call back.</p>
          </article>
        </div>
        <div className="pilot-offer-card">
          <div>
            <small>14-DAY PAID PILOT</small>
            <h3>
              ${AVA_PILOT_OFFER.setupFee} setup → ${AVA_PILOT_OFFER.monthlyFee}/month
            </h3>
            <p>
              {AVA_PILOT_OFFER.usageLimit}. {AVA_PILOT_OFFER.cancelPolicy}. We configure Ava for
              your business, test it with you, and refine call flows during the pilot.
            </p>
          </div>
          <a className="pilot-btn primary" href={AVA_PILOT_PAYMENT_LINK}>
            {AVA_PILOT_OFFER.ctaPrimary}
          </a>
        </div>
      </section>

      <section id="demos" className="pilot-section demos">
        <div className="section-head">
          <span className="pilot-kicker">PERSONALIZED DEMOS · WEEK 1</span>
          <h2>Five businesses. Five custom demo pages.</h2>
          <p>
            Each demo includes the prospect&apos;s branding, three tasks Ava performs for their
            business, a sample lead summary, and a &ldquo;Call Ava&rdquo; button.
          </p>
        </div>
        <div className="demo-grid">
          {personalizedDemos.map((prospect) => (
            <Link
              className="demo-card"
              href={`/demo/${prospect.slug}`}
              key={prospect.slug}
              style={
                {
                  '--card-brand': prospect.brandColor,
                  '--card-accent': prospect.accentColor,
                } as React.CSSProperties
              }
            >
              <span className="demo-card-logo">{prospect.logoInitials}</span>
              <div>
                <strong>{prospect.companyName}</strong>
                <small>
                  {prospect.industry} · {prospect.serviceArea}
                </small>
              </div>
              <span className="demo-card-cta">
                View demo <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="video" className="pilot-section video-cta">
        <div>
          <span className="pilot-kicker">76-SECOND SALES VIDEO</span>
          <h2>Show the call-to-lead outcome — not the AI.</h2>
          <p>
            Missed call → Ava answers a real AC emergency → lead summary → 14-day pilot →
            personalized demo link.
          </p>
          <video
            controls
            playsInline
            preload="metadata"
            poster="/ava-hvac-pilot-poster.png"
            src="/ava-hvac-pilot.mp4"
            style={{ width: '100%', borderRadius: 14, margin: '22px 0', border: '1px solid #2a4234' }}
          />
          <Link className="pilot-btn secondary" href="/video">
            Open full video page <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="pilot-section targets">
        <div className="section-head">
          <span className="pilot-kicker">
            <Target size={14} /> BY NEXT MONDAY
          </span>
          <h2>Sales week targets</h2>
        </div>
        <div className="target-grid">
          <article>
            <strong>{SALES_WEEK_TARGETS.prospectsContacted}</strong>
            <span>prospects contacted</span>
          </article>
          <article>
            <strong>{SALES_WEEK_TARGETS.personalizedDemosSent}</strong>
            <span>personalized demos sent</span>
          </article>
          <article>
            <strong>{SALES_WEEK_TARGETS.conversations}</strong>
            <span>actual conversations</span>
          </article>
          <article>
            <strong>{SALES_WEEK_TARGETS.livePilotProposals}</strong>
            <span>live pilot proposals</span>
          </article>
        </div>
        <p className="target-note">
          Track opens, calls, replies, and pilot clicks in the{' '}
          <Link href="/sales">sales tracker</Link>. If nobody engages, change targeting or the
          opening message — not the product.
        </p>
      </section>

      <section className="pilot-final">
        <Clock3 size={20} />
        <h2>Your next emergency call may come while you&apos;re under a house.</h2>
        <p>Let Ava answer before they call someone else.</p>
        <a className="pilot-btn light" href={AVA_PILOT_PAYMENT_LINK}>
          {AVA_PILOT_OFFER.ctaPrimary}
        </a>
      </section>

      <footer className="pilot-footer">
        <Link className="pilot-brand" href="/">
          <span>
            <Sparkles size={17} />
          </span>
          Workforce AI
        </Link>
        <span>
          <ShieldCheck size={14} /> Pilot offer for HVAC & plumbing · Cole
        </span>
        <Link href="/sales">Sales tracker</Link>
      </footer>
    </main>
  );
}
