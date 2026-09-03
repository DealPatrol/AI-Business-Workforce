'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { SALES_WEEK_TARGETS } from '@/lib/ava-pilot-offer';
import {
  buildOutreachMessage,
  getProspectDemoUrl,
  PROSPECTS,
  type ProspectStatus,
} from '@/lib/prospects';
import './sales.css';

type TrackedEvent = {
  id?: string;
  prospect_slug: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type StoredStatus = {
  prospect_slug: string;
  status: ProspectStatus;
  notes?: string;
  contacted_at?: string;
  updated_at?: string;
};

const STATUS_OPTIONS: ProspectStatus[] = [
  'queued',
  'contacted',
  'demo_sent',
  'opened',
  'called_ava',
  'replied',
  'conversation',
  'pilot_proposed',
  'passed',
];

function countByStatus(statuses: StoredStatus[], status: ProspectStatus): number {
  return statuses.filter((s) => s.status === status).length;
}

export default function SalesTrackerPage() {
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [statuses, setStatuses] = useState<StoredStatus[]>([]);
  const [available, setAvailable] = useState(true);
  const [storageReason, setStorageReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/events', { cache: 'no-store' });
      const data = await res.json();
      setEvents(data.events ?? []);
      setStatuses(data.statuses ?? []);
      setAvailable(Boolean(data.available));
      setStorageReason(data.reason || '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusMap = useMemo(() => {
    const map = new Map<string, StoredStatus>();
    statuses.forEach((s) => map.set(s.prospect_slug, s));
    return map;
  }, [statuses]);

  const eventCounts = useMemo(() => {
    const opens = new Set(events.filter((e) => e.event_type === 'demo_open').map((e) => e.prospect_slug));
    const calls = new Set(
      events.filter((e) => e.event_type === 'call_started' || e.event_type === 'call_ended').map((e) => e.prospect_slug),
    );
    const pilots = new Set(
      events.filter((e) => e.event_type === 'pilot_clicked').map((e) => e.prospect_slug),
    );
    return { opens: opens.size, calls: calls.size, pilots: pilots.size };
  }, [events]);

  const metrics = useMemo(
    () => ({
      contacted: countByStatus(statuses, 'contacted') + countByStatus(statuses, 'demo_sent'),
      demosSent: countByStatus(statuses, 'demo_sent'),
      conversations: countByStatus(statuses, 'conversation') + countByStatus(statuses, 'replied'),
      pilotProposals: countByStatus(statuses, 'pilot_proposed'),
    }),
    [statuses],
  );

  async function updateStatus(slug: string, status: ProspectStatus) {
    setUpdatingSlug(slug);
    try {
      await fetch('/api/sales/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectSlug: slug, status }),
      });
      const eventType =
        status === 'opened'
          ? 'demo_open'
          : status === 'called_ava'
            ? 'call_started'
            : status === 'queued' || status === 'passed'
              ? null
              : status;
      if (eventType) {
        await fetch('/api/sales/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospectSlug: slug, eventType }),
        });
      }
      await loadData();
    } finally {
      setUpdatingSlug(null);
    }
  }

  async function copyMessage(slug: string) {
    const prospect = PROSPECTS.find((p) => p.slug === slug);
    if (!prospect) return;
    await navigator.clipboard.writeText(buildOutreachMessage(prospect));
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  return (
    <main className="sales-tracker">
      <nav>
        <Link href="/ava-pilot">
          <ArrowLeft size={16} /> Ava pilot
        </Link>
        <b>
          <Sparkles size={16} /> Sales week tracker
        </b>
        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </nav>

      <header>
        <span>WEEK 1 · HVAC & PLUMBING OUTREACH</span>
        <h1>Sales signal dashboard</h1>
        <p>
          Track demo opens, Ava calls, replies, and pilot clicks. Send 5 personalized messages per
          day. Change targeting if nobody engages.
        </p>
        {!available && (
          <p className="warn">
            Supabase events are not live yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> plus{' '}
            <code>SUPABASE_SECRET_KEY</code> (or the publishable key) and run{' '}
            <code>supabase/migrations/003_sales_tracking.sql</code> and{' '}
            <code>004_sales_event_policies.sql</code> in the SQL editor.
            {storageReason ? ` (${storageReason})` : ''}
          </p>
        )}
        {available && (
          <p className="ok">Supabase events connected — demo opens, Ava calls, and status changes persist.</p>
        )}
      </header>

      <section className="metrics">
        <article>
          <small>TARGET</small>
          <strong>{SALES_WEEK_TARGETS.prospectsContacted}</strong>
          <span>prospects contacted</span>
          <b>{metrics.contacted} logged</b>
        </article>
        <article>
          <small>TARGET</small>
          <strong>{SALES_WEEK_TARGETS.personalizedDemosSent}</strong>
          <span>demos sent</span>
          <b>{metrics.demosSent} logged</b>
        </article>
        <article>
          <small>TARGET</small>
          <strong>{SALES_WEEK_TARGETS.conversations}</strong>
          <span>conversations</span>
          <b>{metrics.conversations} logged</b>
        </article>
        <article>
          <small>TARGET</small>
          <strong>{SALES_WEEK_TARGETS.livePilotProposals}</strong>
          <span>pilot proposals</span>
          <b>{metrics.pilotProposals} logged</b>
        </article>
        <article className="live">
          <small>LIVE SIGNALS</small>
          <strong>{eventCounts.opens}</strong>
          <span>demo opens</span>
        </article>
        <article className="live">
          <small>LIVE SIGNALS</small>
          <strong>{eventCounts.calls}</strong>
          <span>called Ava</span>
        </article>
        <article className="live">
          <small>LIVE SIGNALS</small>
          <strong>{eventCounts.pilots}</strong>
          <span>pilot clicks</span>
        </article>
      </section>

      <section className="prospect-table">
        <div className="table-head">
          <h2>20 qualified prospects</h2>
          <p>5 personalized demos · 5 messages/day · lead with the demo link</p>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Owner</th>
                <th>Industry</th>
                <th>Demo</th>
                <th>Status</th>
                <th>Outreach</th>
              </tr>
            </thead>
            <tbody>
              {PROSPECTS.map((prospect) => {
                const stored = statusMap.get(prospect.slug);
                const currentStatus = stored?.status ?? prospect.status;
                return (
                  <tr key={prospect.slug} className={prospect.personalizedDemo ? 'has-demo' : ''}>
                    <td>
                      <strong>{prospect.companyName}</strong>
                      <small>{prospect.serviceArea}</small>
                    </td>
                    <td>{prospect.ownerName}</td>
                    <td>{prospect.industry}</td>
                    <td>
                      {prospect.personalizedDemo ? (
                        <Link href={`/demo/${prospect.slug}`} target="_blank">
                          /demo/{prospect.slug}
                        </Link>
                      ) : (
                        <span className="muted">Week 2+</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={currentStatus}
                        disabled={updatingSlug === prospect.slug}
                        onChange={(e) => updateStatus(prospect.slug, e.target.value as ProspectStatus)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button type="button" onClick={() => copyMessage(prospect.slug)}>
                        {copiedSlug === prospect.slug ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy message
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="event-log">
        <h2>Recent Supabase events</h2>
        {events.length === 0 ? (
          <p>No events stored yet. Open a demo or update a prospect status to write the first row.</p>
        ) : (
          <ol>
            {events.slice(0, 25).map((event) => (
              <li key={event.id ?? `${event.prospect_slug}-${event.created_at}`}>
                <strong>{event.event_type.replaceAll('_', ' ')}</strong>
                <span>{event.prospect_slug}</span>
                <time>{new Date(event.created_at).toLocaleString()}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="outreach-template">
        <h2>Opening message template</h2>
        <blockquote>
          Hi [First Name] — I built a quick AI receptionist demo using [Company Name] so you can hear
          how it would handle a missed customer call. Want me to send it over?
          <br />
          <br />
          {getProspectDemoUrl('acexperts')}
        </blockquote>
        <p>
          Don&apos;t lead with pricing or a long product explanation. The demo link is the reason to
          contact them.
        </p>
      </section>
    </main>
  );
}
