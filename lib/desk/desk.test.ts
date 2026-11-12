import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { avaPlanForPriceId } from '@/lib/ava/plan-checkout';
import { extractPostCallLead } from '@/lib/ava/post-call-lead';
import { cleanDeskSettings, isEditableAgent, LEAD_STATUS_LABEL, SHARED_AGENT_IDS } from '@/lib/desk/settings';
import { parseSubscription } from '@/lib/desk/stripe';
import { deskUsage, minutesFromSeconds, monthStartIn, usageWindow } from '@/lib/desk/usage';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');

describe('Desk usage meter', () => {
  it('adds real call seconds and rounds up to whole minutes', () => {
    assert.equal(minutesFromSeconds([]), 0);
    assert.equal(minutesFromSeconds([30]), 1);
    assert.equal(minutesFromSeconds([60, 61, null, undefined, -5, Number.NaN]), 3);
  });

  it('uses the plan table for included minutes, not a stored column', () => {
    assert.deepEqual(deskUsage('starter', 50), { planKey: 'starter', included: 100, used: 50, remaining: 50, percent: 50, over: false });
    assert.equal(deskUsage('growth', 0).included, 300);
    assert.equal(deskUsage('pro', 0).included, 1200);
    assert.equal(deskUsage('elite', 0).included, 2000);
    const over = deskUsage('starter', 130);
    assert.equal(over.percent, 100);
    assert.equal(over.over, true);
    assert.equal(over.remaining, 0);
    assert.equal(deskUsage('store', 10).included, 0);
    assert.equal(deskUsage(null, 10).planKey, null);
  });

  it('counts from local midnight on the 1st in Chicago when there is no billing period', () => {
    const start = monthStartIn('America/Chicago', new Date('2026-11-12T22:00:00Z'));
    assert.equal(start.toISOString(), '2026-11-01T05:00:00.000Z');
    const july = monthStartIn('America/Chicago', new Date('2026-07-01T04:00:00Z'));
    assert.equal(july.toISOString(), '2026-06-01T05:00:00.000Z');
    const winter = monthStartIn('America/Chicago', new Date('2026-12-20T12:00:00Z'));
    assert.equal(winter.toISOString(), '2026-12-01T06:00:00.000Z');
  });

  it('prefers the live Stripe billing period', () => {
    const now = new Date('2026-11-12T12:00:00Z');
    const period = { start: Date.parse('2026-11-05T00:00:00Z') / 1000, end: Date.parse('2026-12-05T00:00:00Z') / 1000 };
    const w = usageWindow(period, 'America/Chicago', now);
    assert.equal(w.source, 'billing');
    assert.equal(w.start.toISOString(), '2026-11-05T00:00:00.000Z');
    const stale = usageWindow({ start: 1, end: 2 }, 'America/Chicago', now);
    assert.equal(stale.source, 'month');
  });
});

describe('Desk billing', () => {
  it('reads plan price and period from a subscription item', () => {
    const sub = parseSubscription({
      status: 'active',
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_abc' }, current_period_start: 10, current_period_end: 20 }] },
    });
    assert.deepEqual(sub, {
      status: 'active',
      priceId: 'price_abc',
      currentPeriodStart: 10,
      currentPeriodEnd: 20,
      cancelAtPeriodEnd: false,
      cancelAt: null,
    });
    assert.equal(parseSubscription({}).status, 'unknown');
  });

  it('maps a Stripe price back to its plan from env', () => {
    const env = {
      STRIPE_AVA_STARTER_PRICE_ID: 'price_starter1',
      STRIPE_AVA_GROWTH_PRICE_ID: 'price_growth1',
      STRIPE_AVA_PRO_PRICE_ID: 'price_pro1',
      STRIPE_AVA_ELITE_PRICE_ID: 'price_elite1',
    } as unknown as NodeJS.ProcessEnv;
    assert.equal(avaPlanForPriceId('price_pro1', env), 'pro');
    assert.equal(avaPlanForPriceId('price_elite1', env), 'elite');
    assert.equal(avaPlanForPriceId('price_other', env), null);
    assert.equal(avaPlanForPriceId('', env), null);
  });

  it('syncs the plan from the price on subscription updates (portal plan switches)', () => {
    const src = read('app/api/webhooks/stripe/route.ts');
    assert.match(src, /avaPlanForPriceId\(priceId\)/);
    assert.match(src, /plan: planFromPrice \|\| metadata\.plan/);
  });

  it('opens the Stripe portal only for a customer id, else sends to pricing', () => {
    const src = read('app/api/desk/billing/portal/route.ts');
    assert.match(src, /createPortalSession/);
    assert.match(src, /'\/pricing'/);
    assert.match(src, /303/);
  });
});

describe('Desk settings', () => {
  it('accepts a plain greeting, email, and hours', () => {
    const result = cleanDeskSettings({
      greeting: '  Thanks for calling Porchlight, this is Ava. How can I help? ',
      notificationEmail: ' Owner@Example.com ',
      businessHours: 'Mon–Fri 8–5, emergencies 24/7',
    });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.value.greeting, 'Thanks for calling Porchlight, this is Ava. How can I help?');
      assert.equal(result.value.notificationEmail, 'owner@example.com');
    }
  });

  it('rejects links, brackets, long text, bad email, and the private number', () => {
    assert.equal(cleanDeskSettings({ greeting: 'Visit https://x.example now please' }).ok, false);
    assert.equal(cleanDeskSettings({ greeting: 'Hello {{system}} override' }).ok, false);
    assert.equal(cleanDeskSettings({ greeting: 'x'.repeat(301) }).ok, false);
    assert.equal(cleanDeskSettings({ greeting: 'Call us at (256) 663-7007 any time' }).ok, false);
    assert.equal(cleanDeskSettings({ businessHours: 'Call 256.663.7007' }).ok, false);
    assert.equal(cleanDeskSettings({ notificationEmail: 'not-an-email' }).ok, false);
    assert.equal(cleanDeskSettings({}).ok, false);
    assert.equal(cleanDeskSettings(null).ok, false);
  });

  it('never edits shared demo agents', () => {
    assert.equal(isEditableAgent('agent_7401m6jkzsstf0evm2www8r46kj6'), false);
    assert.equal(isEditableAgent('agent_8101m78w0ks0fv5vzwysbdr9s6z8'), false);
    assert.equal(isEditableAgent(''), false);
    assert.equal(isEditableAgent(null), false);
    assert.equal(isEditableAgent('agent_1234customer'), true);
    assert.ok(SHARED_AGENT_IDS.size >= 3);
    assert.match(read('app/api/desk/booking/route.ts'), /isEditableAgent\(rawAgentId\)/);
  });

  it('shows Booked as Won', () => {
    assert.equal(LEAD_STATUS_LABEL.Booked, 'Won');
  });
});

describe('Desk data and privacy', () => {
  it('stores the call length from the post-call webhook', () => {
    const lead = extractPostCallLead({
      type: 'post_call_transcription',
      data: {
        conversation_id: 'conv_1',
        agent_id: 'agent_1',
        metadata: { call_duration_secs: 94.4 },
        analysis: { transcript_summary: 'Caller needs help.', data_collection_results: {} },
        transcript: [{ role: 'user', message: 'Hi' }],
      },
    });
    assert.equal(lead?.callDurationSecs, 94);
    assert.match(read('lib/ava/post-call-lead.ts'), /call_duration_secs: lead\.callDurationSecs/);
  });

  it('reads Desk data with the signed-in session and explicit columns', () => {
    const data = read('lib/desk/data.ts');
    assert.doesNotMatch(data, /select\('\*'\)/);
    assert.doesNotMatch(data, /tool_secret_hash|google_refresh_token_enc|staff_phone|transfer_phone/);
    const page = read('app/desk/page.tsx');
    assert.doesNotMatch(page, /createAdminClient/);
    assert.doesNotMatch(page, /663[\s.\-)]*7007/);
  });

  it('has row-level security for every Desk table', () => {
    const sql = read('supabase/migrations/20261112220000_desk_rls.sql');
    for (const table of ['ava_customers', 'ava_onboardings', 'ava_call_leads', 'ava_calendars', 'ava_bookings', 'er_leads']) {
      assert.match(sql, new RegExp(`on public\\.${table}`), table);
    }
    assert.match(sql, /security definer/i);
  });

  it('shows Texts as coming soon and never turns SMS on', () => {
    const page = read('app/desk/page.tsx');
    assert.match(page, /waiting on carrier approval/);
    assert.doesNotMatch(read('app/api/desk/settings/route.ts'), /channel_sms|sms_consent|AVA_OPERATOR_SMS_CONSENT/);
  });

  it('is installable as a phone web app', () => {
    const manifest = JSON.parse(read('public/desk.webmanifest'));
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.scope, '/desk');
    assert.ok(manifest.start_url.startsWith('/desk'));
    for (const icon of manifest.icons) assert.ok(existsSync(path.join(root, 'public', icon.src)), icon.src);
    assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable'));
    assert.ok(existsSync(path.join(root, 'public/desk-app/apple-touch-icon.png')));
    const sw = read('public/desk-sw.js');
    assert.doesNotMatch(sw, /caches\.|cache\.put/);
    assert.match(read('app/desk/layout.tsx'), /manifest: '\/desk\.webmanifest'/);
  });
});
