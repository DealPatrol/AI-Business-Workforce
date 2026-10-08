'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { metersToMiles, placesSearchEstimate } from '@/lib/prospector/constants';
import { queriesFromTargets } from '@/lib/prospector/places';
import {
  LEAD_STATUSES,
  leadStatusLabel,
  type LeadStatus,
  type ProspectorCampaign,
  type ProspectorConfig,
  type ProspectorLead,
  type ProspectorSettings,
  type TargetProfile,
} from '@/lib/prospector/types';
import { type ApiError, prospectorRequest } from './api';
import DraftDrawer from './draft-drawer';
import styles from './prospector.module.css';

type Filters = {
  email: boolean;
  rating: string;
  reviews: string;
  category: string;
  status: string;
};

const EMPTY_FILTERS: Filters = { email: false, rating: '', reviews: '', category: '', status: '' };

function milesValue(meters: number | null): string {
  return meters ? String(metersToMiles(meters)) : '';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ProspectorApp({
  config,
  settings,
  campaigns: initialCampaigns,
  dbError,
}: {
  config: ProspectorConfig;
  settings: ProspectorSettings;
  campaigns: ProspectorCampaign[];
  dbError: string | null;
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [campaignId, setCampaignId] = useState(initialCampaigns[0]?.id ?? '');
  const [creating, setCreating] = useState(initialCampaigns.length === 0);
  const [leads, setLeads] = useState<ProspectorLead[]>([]);
  const [targets, setTargets] = useState<TargetProfile[]>(initialCampaigns[0]?.targets ?? []);
  const [offer, setOffer] = useState(initialCampaigns[0]?.offerSummary ?? '');
  const [location, setLocation] = useState(initialCampaigns[0]?.location || settings.defaultLocation);
  const [radiusMiles, setRadiusMiles] = useState(milesValue(initialCampaigns[0]?.radiusMeters ?? null));
  const [confirmed, setConfirmed] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(dbError ?? '');
  const [notice, setNotice] = useState('');
  const [queueNote, setQueueNote] = useState('');
  const stopQueue = useRef(false);

  const campaign = campaigns.find((item) => item.id === campaignId) ?? null;
  const estimate = placesSearchEstimate(queriesFromTargets(targets).length);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    prospectorRequest<{ leads: ProspectorLead[] }>(`/api/prospector/leads?campaignId=${campaignId}`, undefined, 'GET')
      .then((result) => {
        if (!cancelled) setLeads(result.leads);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  function selectCampaign(id: string) {
    setCampaignId(id);
    setCreating(false);
    setConfirmed(false);
    setActiveLeadId(null);
    const next = campaigns.find((item) => item.id === id);
    setTargets(next?.targets ?? []);
    setOffer(next?.offerSummary ?? '');
    setLocation(next?.location || settings.defaultLocation);
    setRadiusMiles(milesValue(next?.radiusMeters ?? null));
  }

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError('');
    try {
      await task();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Request failed.');
    } finally {
      setBusy('');
    }
  }

  async function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run('create', async () => {
      const created = await prospectorRequest<{ campaign: ProspectorCampaign }>('/api/prospector/campaigns', {
        name: String(form.get('name') ?? ''),
        sourceUrl: String(form.get('sourceUrl') ?? ''),
        notes: String(form.get('notes') ?? ''),
        location: String(form.get('location') ?? ''),
        radiusMiles: String(form.get('radiusMiles') ?? ''),
      });
      setCampaigns((current) => [created.campaign, ...current.filter((item) => item.id !== created.campaign.id)]);
      setCampaignId(created.campaign.id);
      setLocation(created.campaign.location);
      setRadiusMiles(milesValue(created.campaign.radiusMeters));
      setCreating(false);
      if (!config.openai) {
        setTargets([]);
        setNotice('List saved. OpenAI is not configured, so add buyer types yourself.');
        return;
      }
      const profile = await prospectorRequest<{ campaign: ProspectorCampaign; summary: string; usedPage: boolean }>(
        '/api/prospector/profile',
        { campaignId: created.campaign.id },
      );
      const next = profile.campaign ?? created.campaign;
      setCampaigns((current) => current.map((item) => (item.id === next.id ? next : item)));
      setTargets(next.targets);
      setOffer(next.offerSummary || profile.summary);
      setNotice(profile.usedPage
        ? 'Suggested buyer types are ready. Edit them, then confirm the Maps search.'
        : 'The site could not be fetched, so the suggestions used your notes.');
    });
  }

  function campaignPatch() {
    return {
      id: campaignId,
      targets,
      offerSummary: offer,
      location,
      radiusMiles,
    };
  }

  async function rereadSite() {
    if (!campaignId) return;
    await run('profile', async () => {
      const profile = await prospectorRequest<{ campaign: ProspectorCampaign; summary: string; usedPage: boolean }>(
        '/api/prospector/profile',
        { campaignId },
      );
      if (!profile.campaign) return;
      setCampaigns((current) => current.map((item) => (item.id === profile.campaign.id ? profile.campaign : item)));
      setTargets(profile.campaign.targets);
      if (!offer.trim()) setOffer(profile.campaign.offerSummary || profile.summary);
      setNotice(profile.usedPage ? 'Buyer types were refreshed from the website.' : 'The website could not be read. Suggestions used your saved notes.');
    });
  }

  async function saveTargets() {
    if (!campaignId) return;
    await run('save', async () => {
      const result = await prospectorRequest<{ campaign: ProspectorCampaign }>('/api/prospector/campaigns', campaignPatch(), 'PATCH');
      if (!result.campaign) return;
      setCampaigns((current) => current.map((item) => (item.id === result.campaign.id ? result.campaign : item)));
      setTargets(result.campaign.targets);
      setNotice('List saved.');
    });
  }

  async function searchMaps() {
    if (!campaignId) return;
    await run('search', async () => {
      const saved = await prospectorRequest<{ campaign: ProspectorCampaign }>('/api/prospector/campaigns', campaignPatch(), 'PATCH');
      if (saved.campaign) {
        setCampaigns((current) => current.map((item) => (item.id === saved.campaign.id ? saved.campaign : item)));
        setTargets(saved.campaign.targets);
      }
      const result = await prospectorRequest<{
        inserted: number;
        duplicates: number;
        warnings: string[];
        leads: ProspectorLead[];
        estimate: { maxRequests: number };
      }>('/api/prospector/search', { campaignId, confirm: true });
      setLeads(result.leads);
      setConfirmed(false);
      const warning = result.warnings?.length ? ` ${result.warnings.join(' ')}` : '';
      setNotice(`Added ${result.inserted} new places. ${result.duplicates} were already on this list.${warning}`);
    });
  }

  async function enrich() {
    if (!campaignId) return;
    await run('enrich', async () => {
      const result = await prospectorRequest<{
        leads: ProspectorLead[];
        enriched: number;
        failed: number;
        processed: number;
        remaining: number;
      }>('/api/prospector/enrich', { campaignId });
      setLeads(result.leads);
      setNotice(`Checked ${result.processed} websites. ${result.enriched} finished, ${result.failed} failed, about ${result.remaining} still waiting. Run it again for the next batch.`);
    });
  }

  async function changeStatus(lead: ProspectorLead, status: LeadStatus) {
    try {
      const result = await prospectorRequest<{ lead: ProspectorLead }>('/api/prospector/leads', { id: lead.id, status }, 'PATCH');
      if (result.lead) setLeads((current) => current.map((item) => (item.id === result.lead.id ? result.lead : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update that lead.');
    }
  }

  async function sendQueue() {
    if (!campaignId) return;
    stopQueue.current = false;
    setError('');
    setQueueNote('Sending approved emails one at a time.');
    while (!stopQueue.current) {
      try {
        const result = await prospectorRequest<{ done?: boolean; send?: { toEmail: string }; lead?: ProspectorLead }>(
          '/api/prospector/send',
          { campaignId, next: true },
        );
        if (result.done) {
          setNotice('No approved emails are waiting.');
          break;
        }
        if (result.lead) {
          const sentLead = result.lead;
          setLeads((current) => current.map((item) => (item.id === sentLead.id ? sentLead : item)));
        }
        setNotice(result.send ? `Sent to ${result.send.toEmail}.` : 'Sent.');
      } catch (reason) {
        const apiError = reason as ApiError;
        if (apiError.code === 'spacing' && apiError.retryAfterSeconds) {
          setQueueNote(apiError.message);
          for (let second = 0; second < apiError.retryAfterSeconds; second += 1) {
            if (stopQueue.current) break;
            await sleep(1000);
          }
          continue;
        }
        if (apiError.code === 'suppressed') {
          setNotice(apiError.message);
          continue;
        }
        setError(apiError.message || 'Sending stopped.');
        break;
      }
    }
    setQueueNote('');
  }

  const categories = useMemo(
    () => [...new Set(leads.map((lead) => lead.category).filter(Boolean))].sort(),
    [leads],
  );
  const visible = leads.filter((lead) => {
    if (filters.email && lead.emails.length === 0) return false;
    if (filters.rating && (lead.rating ?? 0) < Number(filters.rating)) return false;
    if (filters.reviews && (lead.reviewCount ?? 0) < Number(filters.reviews)) return false;
    if (filters.category && lead.category !== filters.category) return false;
    if (filters.status && lead.status !== filters.status) return false;
    return true;
  });
  const withEmail = leads.filter((lead) => lead.emails.length > 0).length;
  const callOnly = leads.filter((lead) => lead.channel === 'call_only').length;
  const approved = leads.filter((lead) => lead.status === 'approved').length;

  return (
    <>
      <header>
        <div>
          <div className={styles.eyebrow}>GOOGLE MAPS PROSPECTING</div>
          <h1>Lead Finder</h1>
          <p className={styles.lede}>Paste a site, pick the businesses that would buy from it, and build a call and email list from Google Maps.</p>
        </div>
        <div className={styles.headerActions}>
          {campaigns.length > 0 && (
            <select value={campaignId} onChange={(event) => selectCampaign(event.target.value)} aria-label="Saved list">
              {campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          )}
          <button className={styles.secondary} type="button" onClick={() => setCreating(true)}>New search</button>
          {campaign && <a className={styles.ghost} href={`/api/prospector/export?campaignId=${campaign.id}`}>Export CSV</a>}
        </div>
      </header>

      {!config.maps && (
        <p className={styles.alert}>Google Maps is not configured. Set GOOGLE_MAPS_API_KEY and enable Places API (New) plus Geocoding. Searching stays off until then.</p>
      )}
      {!config.openai && (
        <p className={styles.alert}>OpenAI is not configured. Set OPENAI_API_KEY to suggest buyer types and draft emails.</p>
      )}
      {!config.resend && (
        <p className={styles.info}>Sending is off because RESEND_API_KEY is not set. You can still build lists, draft, copy, and export emails from your own account.</p>
      )}
      {config.resend && !config.unsubscribe && (
        <p className={styles.alert}>Sending also needs PROSPECTOR_UNSUBSCRIBE_SECRET or SUPABASE_SECRET_KEY so every email can include a working unsubscribe link.</p>
      )}
      {error && <p className={styles.alert} role="alert">{error}</p>}
      {notice && <p className={styles.info}>{notice}</p>}
      {queueNote && (
        <p className={styles.info}>
          {queueNote}{' '}
          <button className={styles.ghost} type="button" onClick={() => { stopQueue.current = true; }}>Stop</button>
        </p>
      )}

      {creating && (
        <form className={styles.card} onSubmit={createList}>
          <h2>Who are you selling?</h2>
          <label>
            Website
            <input name="sourceUrl" type="url" required placeholder="https://example.com" />
          </label>
          <label>
            List name
            <input name="name" placeholder="Optional. Defaults to the website." />
          </label>
          <label>
            Notes
            <textarea name="notes" placeholder="Optional. Who you sell to, what to mention, what to avoid." />
          </label>
          <label>
            Target location
            <input name="location" defaultValue={settings.defaultLocation} placeholder="Austin, TX" />
          </label>
          <label>
            Radius in miles
            <input name="radiusMiles" type="number" min={1} max={30} step={1} placeholder="Optional, up to 30" />
          </label>
          <button className={styles.primary} type="submit" disabled={Boolean(busy)}>
            {busy === 'create' ? 'Saving…' : config.openai ? 'Read site and suggest buyers' : 'Save list'}
          </button>
        </form>
      )}

      {campaign && !creating && (
        <>
          <div className={styles.stats}>
            <article><small>PLACES</small><b>{leads.length}</b></article>
            <article><small>WITH EMAIL</small><b>{withEmail}</b></article>
            <article><small>CALL ONLY</small><b>{callOnly}</b></article>
            <article><small>APPROVED</small><b>{approved}</b></article>
          </div>
          <div className={styles.layout}>
            <section className={styles.card}>
              <div className={styles.eyebrow}>{campaign.sourceUrl.replace(/^https?:\/\//, '')}</div>
              <h2>Buyer types</h2>
              <label>
                What you sell
                <textarea value={offer} onChange={(event) => setOffer(event.target.value)} />
              </label>
              <label>
                Location
                <input value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
              <label>
                Radius in miles
                <input value={radiusMiles} type="number" min={1} max={30} placeholder="Optional" onChange={(event) => setRadiusMiles(event.target.value)} />
              </label>
              {targets.map((target) => (
                <div className={styles.target} key={target.id}>
                  <div className={styles.targetHead}>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={target.selected}
                        onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? { ...item, selected: event.target.checked } : item))}
                      />
                      Search
                    </label>
                    <span className={styles.fit}>Fit {target.fitScore}</span>
                  </div>
                  <label>
                    Business type
                    <input
                      value={target.label}
                      onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? { ...item, label: event.target.value } : item))}
                    />
                  </label>
                  <label>
                    Reason
                    <textarea
                      value={target.reason}
                      onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? { ...item, reason: event.target.value } : item))}
                    />
                  </label>
                  <label>
                    Google Maps queries, one per line
                    <textarea
                      value={target.queries.join('\n')}
                      onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? {
                        ...item,
                        queries: event.target.value.split('\n'),
                      } : item))}
                    />
                  </label>
                </div>
              ))}
              {targets.length === 0 && <p className={styles.quiet}>No buyer types yet. Read the site, or add one yourself.</p>}
              <button
                className={styles.ghost}
                type="button"
                onClick={() => setTargets((current) => [...current, {
                  id: crypto.randomUUID(),
                  label: '',
                  reason: '',
                  fitScore: 50,
                  queries: [''],
                  selected: true,
                }])}
              >
                Add a business type
              </button>
              <div className={styles.estimate}>
                This run calls Places Text Search at most {estimate.maxRequests} times
                ({estimate.queries} selected queries × {estimate.maxPages} pages × {estimate.pageSize} results).
                Google bills those requests to your API key. This app does not buy anything.
              </div>
              <label className={styles.check}>
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                I understand this uses my Google Maps quota
              </label>
              <div className={styles.formActions}>
                <button className={styles.ghost} type="button" disabled={Boolean(busy) || !config.openai} onClick={rereadSite}>
                  {busy === 'profile' ? 'Reading…' : 'Read site again'}
                </button>
                <button className={styles.ghost} type="button" disabled={Boolean(busy)} onClick={saveTargets}>Save list</button>
                <button className={styles.primary} type="button" disabled={Boolean(busy) || !confirmed || !config.maps || estimate.queries === 0} onClick={searchMaps}>
                  {busy === 'search' ? 'Searching Maps…' : 'Search Google Maps'}
                </button>
              </div>
            </section>

            <section className={styles.tableCard}>
              <div className={styles.targetHead}>
                <h2>Leads</h2>
                <div className={styles.headerActions}>
                  <button className={styles.secondary} type="button" disabled={Boolean(busy) || leads.length === 0} onClick={enrich}>
                    {busy === 'enrich' ? 'Checking sites…' : 'Find emails'}
                  </button>
                  <button className={styles.primary} type="button" disabled={Boolean(busy) || !config.resend || approved === 0} onClick={sendQueue}>
                    Send approved
                  </button>
                </div>
              </div>
              <div className={styles.filters}>
                <label className={styles.check}>
                  <input type="checkbox" checked={filters.email} onChange={(event) => setFilters({ ...filters, email: event.target.checked })} />
                  Has email
                </label>
                <label>
                  Min rating
                  <input value={filters.rating} type="number" min={0} max={5} step={0.1} onChange={(event) => setFilters({ ...filters, rating: event.target.value })} />
                </label>
                <label>
                  Min reviews
                  <input value={filters.reviews} type="number" min={0} onChange={(event) => setFilters({ ...filters, reviews: event.target.value })} />
                </label>
                <label>
                  Category
                  <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
                    <option value="">Any</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Status
                  <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Any</option>
                    {LEAD_STATUSES.map((status) => <option key={status} value={status}>{leadStatusLabel(status)}</option>)}
                  </select>
                </label>
              </div>
              {visible.length === 0 ? (
                <p className={styles.quiet}>No leads match. Search Maps, or loosen the filters.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Category</th>
                        <th>Rating</th>
                        <th>Contact</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((lead) => (
                        <tr key={lead.id} className={styles.clickable} onClick={() => setActiveLeadId(lead.id)}>
                          <td>
                            <b>{lead.name}</b>
                            <div className={styles.quiet}>{lead.address}</div>
                          </td>
                          <td>{lead.category || '—'}</td>
                          <td>{lead.rating ?? '—'}{lead.reviewCount != null ? <div className={styles.quiet}>{lead.reviewCount} reviews</div> : null}</td>
                          <td>
                            {lead.emails[0] ? <span className={`${styles.pill} ${styles.email}`}>{lead.emails[0]}</span> : <span className={`${styles.pill} ${styles.call}`}>Call only</span>}
                            {lead.phone ? <div className={styles.quiet}>{lead.phone}</div> : null}
                          </td>
                          <td onClick={(event) => event.stopPropagation()}>
                            <select value={lead.status} aria-label={`Status for ${lead.name}`} onChange={(event) => changeStatus(lead, event.target.value as LeadStatus)}>
                              {LEAD_STATUSES.map((status) => <option key={status} value={status}>{leadStatusLabel(status)}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {activeLeadId && (
        <DraftDrawer
          leadId={activeLeadId}
          resendReady={config.resend && config.unsubscribe}
          onClose={() => setActiveLeadId(null)}
          onLead={(lead) => setLeads((current) => current.map((item) => (item.id === lead.id ? lead : item)))}
        />
      )}
    </>
  );
}
