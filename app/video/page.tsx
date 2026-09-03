import Link from 'next/link';
import { ArrowRight, BellRing, PhoneCall, Play, Sparkles } from 'lucide-react';
import { AVA_PILOT_OFFER } from '@/lib/ava-pilot-offer';
import { getPersonalizedDemos } from '@/lib/prospects';
import './video.css';

const SCENES = [
  {
    time: '0:00–0:08',
    title: 'Hook — the problem',
    visual: 'Technician under a sink / on an HVAC rooftop. Phone rings in pocket, goes to voicemail.',
    audio:
      'What happens when a customer calls while you\'re on a job? Most HVAC and plumbing businesses lose that call — and the job — to whoever picks up first.',
    note: 'Show real job-site footage, not a product UI.',
  },
  {
    time: '0:08–0:35',
    title: 'Ava answers a realistic call',
    visual:
      'Split screen: customer dialing on phone → Ava answers with business name → conversation transcript rolling.',
    audio:
      'Ava answers immediately. She handles the common questions — service area, urgency, what\'s going wrong — and captures the details your team needs to call back qualified.',
    note: 'Use a real emergency scenario: AC out, burst pipe, no heat. Do NOT explain AI or ElevenLabs.',
  },
  {
    time: '0:35–0:55',
    title: 'Lead summary appears',
    visual:
      'Lead summary card animates in: caller name, phone, address, service type, urgency, recommended next step.',
    audio:
      'When the call ends, you get this — a qualified lead summary with everything you need to call back and close the job. No listening to voicemail. No guessing.',
    note: 'This is the most important frame. Hold on the lead summary for 5+ seconds.',
  },
  {
    time: '0:55–1:05',
    title: '14-day pilot offer',
    visual: 'Simple pricing card: $250 setup, $299/month after 14 days, 300 minutes, cancel anytime.',
    audio: `$${AVA_PILOT_OFFER.setupFee} setup. $${AVA_PILOT_OFFER.monthlyFee} a month after a ${AVA_PILOT_OFFER.pilotDays}-day pilot. ${AVA_PILOT_OFFER.usageLimit}. Cancel anytime.`,
    note: 'Keep pricing on screen for 3 seconds max. Outcome first, price second.',
  },
  {
    time: '1:05–1:20',
    title: 'Personalized demo link',
    visual:
      'Browser opens a personalized demo page with prospect branding. "Call Ava" button highlighted. URL visible.',
    audio:
      'I built a demo using your business so you can hear exactly how Ava would handle your missed calls. Tap the link — call Ava yourself.',
    note: 'End on the demo URL. This is the CTA, not a generic homepage.',
  },
];

const personalizedDemos = getPersonalizedDemos();

export default function SalesVideoPage() {
  return (
    <main className="sales-video">
      <nav>
        <Link className="video-brand" href="/ava-pilot">
          <Sparkles size={16} /> Ava pilot
        </Link>
        <span>60–90 second sales video</span>
      </nav>

      <header>
        <span>VIDEO SCRIPT & STORYBOARD</span>
        <h1>Show the call-to-lead outcome — not the AI.</h1>
        <p>
          Total runtime: 60–90 seconds. Structure: problem → Ava answers → lead summary → pilot
          offer → personalized demo link.
        </p>
      </header>

      <section className="video-placeholder">
        <Play size={48} />
        <h2>Record this video</h2>
        <p>
          Use the scene breakdown below. Film job-site B-roll, screen-record a live Ava call, and
          hold on the lead summary card. No AI explainer needed.
        </p>
        <div className="video-flow">
          <span>
            <PhoneCall size={16} /> Missed call
          </span>
          <ArrowRight size={14} />
          <span>
            <Sparkles size={16} /> Ava answers
          </span>
          <ArrowRight size={14} />
          <span>
            <BellRing size={16} /> Lead summary
          </span>
          <ArrowRight size={14} />
          <span>14-day pilot</span>
          <ArrowRight size={14} />
          <span>Demo link</span>
        </div>
      </section>

      <section className="scenes">
        <h2>Scene breakdown</h2>
        <div className="scene-grid">
          {SCENES.map((scene) => (
            <article key={scene.time}>
              <time>{scene.time}</time>
              <h3>{scene.title}</h3>
              <div className="scene-block">
                <small>VISUAL</small>
                <p>{scene.visual}</p>
              </div>
              <div className="scene-block audio">
                <small>AUDIO / VOICEOVER</small>
                <p>&ldquo;{scene.audio}&rdquo;</p>
              </div>
              <div className="scene-note">{scene.note}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-links">
        <h2>End each video with a personalized demo</h2>
        <p>Use the prospect-specific link — not the generic homepage.</p>
        <ul>
          {personalizedDemos.map((prospect) => (
            <li key={prospect.slug}>
              <strong>{prospect.companyName}</strong>
              <Link href={`/demo/${prospect.slug}`}>/demo/{prospect.slug}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="recording-tips">
        <h2>Recording checklist</h2>
        <ul>
          <li>Film on a real job site — technician cannot answer phone</li>
          <li>Record one complete Ava call with a realistic emergency scenario</li>
          <li>Screen-record the lead summary appearing after the call</li>
          <li>Do not mention ElevenLabs, AI models, or technical architecture</li>
          <li>Keep total runtime under 90 seconds</li>
          <li>End frame: personalized demo URL with &ldquo;Call Ava&rdquo; button visible</li>
        </ul>
      </section>
    </main>
  );
}
