#!/usr/bin/env node
/**
 * Publish check for Executive Receptionist / Front Porch Growth. See docs/PUBLISH_RUNBOOK.md.
 *
 *   scripts/publish-check                       # env + Stripe webhook + demo tools + smoke tests on production
 *   scripts/publish-check --only=env            # one section: env | stripe | tools | smoke
 *   scripts/publish-check --url=https://…       # smoke-test another host (e.g. the preview URL)
 *   scripts/publish-check --checkout            # also start pilot + store Checkout and expire both sessions
 *   scripts/publish-check --retarget-tools      # point the demo booking tools at the production URL (writes!)
 *
 * Reads tokens from the shell env only and never prints a secret value. Env vars it uses:
 *   VERCEL_TOKEN                                   env-var names on the Vercel project (names only)
 *   STRIPE_SECRET_KEY or STRIPE_WORKSPACE_SECRET_KEY  live key for the Workspace Stripe account
 *   ELEVENLABS_API_KEY                             to read/retarget the demo booking tools
 * Exit code 1 if anything required fails.
 */

const PROJECT_ID = 'prj_egUL2FGNhQtaGtCUziANd0b1sslj';
const TEAM_SLUG = 'coles-projects-9e3181f8';
const DEFAULT_URL = 'https://executivereceptionist.com';
const OTHER_PROD_HOSTS = ['https://frontporchgrowth.com'];
const STRIPE_WEBHOOK_URLS = [
  'https://executivereceptionist.com/api/webhooks/stripe',
  'https://frontporchgrowth.com/api/webhooks/stripe',
  'https://ai-business-workforce.vercel.app/api/webhooks/stripe',
];
const STRIPE_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
];
const DEMO_BOOKING_TOOLS = {
  check_availability: 'tool_9601m72afh9rf4n9b6k94jy9dxvs',
  book_appointment: 'tool_2701m72afksgefabkz18ytakv58x',
};
const BANNED = [/663-?7007/, /6637007/];

/** Production env vars by feature. Names only; values are never read. */
export const REQUIRED_ENV = {
  'Site + auth': ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  'Stripe (Workspace account, live)': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_AVA_BOOKED_JOB_PRICE_ID', 'STRIPE_AVA_STORE_BASE_PRICE_ID', 'STRIPE_AVA_STORE_CALL_PRICE_ID'],
  'Ava voice (ElevenLabs)': ['ELEVENLABS_API_KEY', 'ELEVENLABS_AGENT_ID', 'ELEVENLABS_WEBHOOK_SECRET', 'AVA_PROVISIONING_SECRET'],
  'Lead + owner email (Resend)': ['RESEND_API_KEY', 'AVA_FROM_EMAIL', 'AVA_LEAD_NOTIFICATION_EMAIL'],
  'Booking': ['AVA_BOOKING_LINK_SECRET'],
  'Billing cron': ['CRON_SECRET'],
};
export const OPTIONAL_ENV = {
  'Booking tools host (defaults to NEXT_PUBLIC_SITE_URL)': ['AVA_TOOL_BASE_URL'],
  'Google Calendar sync (hidden until both client vars are set)': ['GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET', 'AVA_TOKEN_ENCRYPTION_KEY', 'GOOGLE_CALENDAR_REDIRECT_URI'],
  'Caller text after booking (off until toll-free verification is approved)': ['AVA_BOOKING_SMS_ENABLED', 'AVA_BOOKING_SMS_FROM', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
  'Owner lead texts / missed-call text-back': ['TWILIO_FROM_NUMBER', 'AVA_LEAD_SMS_TO', 'MISSED_CALL_FORWARD_NUMBER'],
  'Auto-provision customer agents': ['AVA_AUTO_PROVISION_AGENT'],
  'Ads + analytics': ['NEXT_PUBLIC_GA4_ID', 'NEXT_PUBLIC_GOOGLE_ADS_ID', 'NEXT_PUBLIC_META_PIXEL_ID', 'META_PIXEL_ID', 'META_CAPI_TOKEN'],
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const target = String(args.url || DEFAULT_URL).replace(/\/$/, '');
const only = args.only ? String(args.only) : '';
let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  failures += 1;
  console.log(`  ✗ ${msg}`);
};
const warn = (msg) => console.log(`  ! ${msg}`);
const stripeKey = () => process.env.STRIPE_SECRET_KEY?.trim() || process.env.STRIPE_WORKSPACE_SECRET_KEY?.trim() || '';

async function stripe(method, path, form) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${stripeKey()}:`).toString('base64')}`,
      ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  return res.json();
}

async function checkEnv() {
  console.log('\n[env] Vercel production env vars (names only)');
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) return warn('VERCEL_TOKEN not set; skipping. Compare Settings → Environment Variables against docs/PUBLISH_RUNBOOK.md.');
  const auth = { Authorization: `Bearer ${token}` };
  const teams = await (await fetch('https://api.vercel.com/v2/teams', { headers: auth })).json();
  const teamId = (teams.teams || []).find((t) => t.slug === TEAM_SLUG)?.id;
  const res = await (await fetch(`https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${teamId}`, { headers: auth })).json();
  const prod = new Set((res.envs || []).filter((e) => (e.target || []).includes('production')).map((e) => e.key));
  for (const [group, names] of Object.entries(REQUIRED_ENV)) {
    const missing = names.filter((n) => !prod.has(n));
    if (missing.length) bad(`${group}: missing ${missing.join(', ')}`);
    else ok(group);
  }
  for (const [group, names] of Object.entries(OPTIONAL_ENV)) {
    const missing = names.filter((n) => !prod.has(n));
    if (missing.length === names.length) warn(`${group}: not set (optional)`);
    else if (missing.length) warn(`${group}: partly set, missing ${missing.join(', ')}`);
    else ok(`${group} (optional)`);
  }
}

async function checkStripe() {
  console.log('\n[stripe] Workspace live webhook');
  if (!stripeKey()) return warn('No STRIPE_SECRET_KEY/STRIPE_WORKSPACE_SECRET_KEY in this shell; skipping.');
  const list = await stripe('GET', '/webhook_endpoints?limit=50');
  if (list.error) return bad(`Stripe: ${list.error.message}`);
  const hooks = (list.data || []).filter((w) => STRIPE_WEBHOOK_URLS.includes(w.url) && w.status === 'enabled' && w.livemode);
  if (!hooks.length) return bad(`No enabled live webhook at any of ${STRIPE_WEBHOOK_URLS.join(', ')}. See runbook step 3.`);
  for (const hook of hooks) {
    const missing = STRIPE_EVENTS.filter((e) => !hook.enabled_events.includes(e) && !hook.enabled_events.includes('*'));
    if (missing.length) bad(`${hook.url} is missing events: ${missing.join(', ')}`);
    else ok(`${hook.url} (${hook.id}) has all ${STRIPE_EVENTS.length} events`);
  }
  if (hooks.length > 1) warn('More than one production webhook: make sure STRIPE_WEBHOOK_SECRET matches the one you keep, and disable the other.');
}

async function elevenLabs(method, path, body) {
  const res = await fetch(`https://api.elevenlabs.io${path}`, {
    method,
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
}

async function checkTools() {
  console.log('\n[tools] Demo booking tools (Porchlight + HVAC demo lines)');
  if (!process.env.ELEVENLABS_API_KEY) {
    return warn(`ELEVENLABS_API_KEY not set; ask Grok Bot to retarget ${Object.values(DEMO_BOOKING_TOOLS).join(', ')} to ${target}.`);
  }
  for (const [name, id] of Object.entries(DEMO_BOOKING_TOOLS)) {
    const got = await elevenLabs('GET', `/v1/convai/tools/${id}`);
    if (!got.ok) {
      bad(`${name}: could not read tool (${got.status})`);
      continue;
    }
    const config = got.json.tool_config;
    const url = String(config?.api_schema?.url || '');
    const wanted = `${target}${new URL(url).pathname}`;
    if (url === wanted) {
      ok(`${name} → ${url}`);
      continue;
    }
    if (!args['retarget-tools']) {
      bad(`${name} points at ${new URL(url).host}; run with --retarget-tools to point it at ${target}`);
      continue;
    }
    config.api_schema.url = wanted;
    const saved = await elevenLabs('PATCH', `/v1/convai/tools/${id}`, { tool_config: config });
    if (saved.ok) ok(`${name} retargeted → ${wanted}`);
    else bad(`${name}: retarget failed (${saved.status})`);
  }
}

async function get(path, host = target, opts = {}) {
  const res = await fetch(`${host}${path}`, { redirect: 'manual', ...opts });
  return { status: res.status, location: res.headers.get('location') || '', text: await res.text().catch(() => '') };
}

async function smoke() {
  console.log(`\n[smoke] ${target}`);
  const pages = ['/', '/start', '/pricing', '/receptionist', '/receptionist/hvac', '/receptionist/ecommerce', '/onboarding/ava', '/login', '/privacy', '/terms', '/robots.txt', '/sitemap.xml', '/llms.txt'];
  for (const path of pages) {
    const r = await get(path);
    if (r.status !== 200) bad(`${path} → ${r.status}`);
    else if (BANNED.some((re) => re.test(r.text))) bad(`${path} shows a banned phone number`);
    else ok(`${path} 200`);
  }
  for (const host of OTHER_PROD_HOSTS) {
    if (host === target) continue;
    const r = await get('/', host);
    r.status === 200 ? ok(`${host} 200`) : bad(`${host} → ${r.status}`);
  }
  const desk = await get('/desk');
  [302, 303, 307].includes(desk.status) && desk.location.includes('/login') ? ok('/desk redirects to sign-in') : bad(`/desk → ${desk.status}`);
  const tool = await get('/api/ava/availability', target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  tool.status === 404 ? ok('booking tool rejects calls without a secret (404)') : bad(`/api/ava/availability without secret → ${tool.status}`);
  const gcal = await get('/api/desk/google/connect');
  if (gcal.status === 404) warn('Google Calendar sync hidden (GOOGLE_CALENDAR_CLIENT_ID/SECRET not set)');
  else if ([302, 303, 307].includes(gcal.status)) ok('Google Calendar connect is live (redirects to sign-in or Google)');
  else bad(`/api/desk/google/connect → ${gcal.status}`);

  if (!args.checkout) return warn('Checkout not exercised (add --checkout; needs a Stripe key here to expire the sessions).');
  if (!stripeKey()) return bad('--checkout needs STRIPE_SECRET_KEY/STRIPE_WORKSPACE_SECRET_KEY so the test sessions can be expired.');
  for (const plan of ['pilot', 'store']) {
    const r = await get('/api/checkout', target, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 publish-check' },
      body: JSON.stringify({ plan }),
    });
    const session = (r.text.match(/cs_(?:live|test)_[A-Za-z0-9]+/) || [])[0];
    if (r.status !== 200 || !r.text.includes('checkout.stripe.com') || !session) {
      bad(`checkout plan=${plan} → ${r.status} ${r.text.slice(0, 80)}`);
      continue;
    }
    const expired = await stripe('POST', `/checkout/sessions/${session}/expire`);
    expired.status === 'expired' ? ok(`checkout plan=${plan} reaches Stripe (${session.slice(0, 8)}…, expired)`) : bad(`checkout plan=${plan}: could not expire session`);
  }
}

const sections = { env: checkEnv, stripe: checkStripe, tools: checkTools, smoke };
for (const [name, run] of Object.entries(sections)) {
  if (only && only !== name) continue;
  try {
    await run();
  } catch (error) {
    bad(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
