/**
 * Emergency paging: when an emergency transfer goes unanswered (or no transfer is set up), Ava pages
 * the business's on-call list for real, instead of only saying she did.
 *
 * Email pages always go out (Resend). Text pages are off unless AVA_PAGING_SMS_ENABLED is true, an
 * approved sender (AVA_BOOKING_SMS_FROM) is configured, and that on-call person opted in to texts in
 * writing. Demo calendars never send anything.
 */
import { toUsE164 } from '@/lib/ava/capabilities/transfer';

export const MAX_ON_CALL = 3;

export type OnCallContact = { name: string; email?: string; phone?: string; smsConsent?: boolean };

export type PageInput = {
  businessName: string;
  callerName: string;
  callerPhone: string;
  address: string;
  issue: string;
  reason: 'transfer_unanswered' | 'no_transfer' | 'after_hours';
  conversationId: string;
};

export type PagingEnv = {
  /** Demo calendars page this one address by email only (never SMS). Unset = demo pages are simulated. */
  AVA_DEMO_ALERT_EMAIL?: string;
  AVA_PAGING_SMS_ENABLED?: string;
  AVA_BOOKING_SMS_FROM?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
};

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function normalizeOnCall(raw: unknown): OnCallContact[] {
  if (!Array.isArray(raw)) return [];
  const out: OnCallContact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const email = typeof row.email === 'string' && EMAIL.test(row.email.trim()) ? row.email.trim().toLowerCase() : '';
    const phone = toUsE164(row.phone);
    if (!email && !phone) continue;
    out.push({
      name: typeof row.name === 'string' ? row.name.trim().slice(0, 60) : '',
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      smsConsent: row.smsConsent === true || row.sms_consent === true,
    });
    if (out.length >= MAX_ON_CALL) break;
  }
  return out;
}

export function pagingSmsEnabled(env: PagingEnv) {
  const flag = String(env.AVA_PAGING_SMS_ENABLED || '').trim().toLowerCase();
  return flag === '1' || flag === 'true';
}

export type PagePlan = {
  emails: string[];
  texts: Array<{ to: string; from: string }>;
  skippedTexts: Array<{ to: string; reason: 'disabled' | 'not_configured' | 'no_consent' }>;
  demo: boolean;
};

/** The operator address that receives demo-line pages and callback alerts (email only), or '' when off. */
export function demoAlertEmail(env: { AVA_DEMO_ALERT_EMAIL?: string }) {
  const e = String(env.AVA_DEMO_ALERT_EMAIL || '').trim();
  return EMAIL.test(e) ? e : '';
}

export function planPage(contacts: OnCallContact[], env: PagingEnv, isDemo: boolean): PagePlan {
  if (isDemo) {
    const demoEmail = demoAlertEmail(env);
    return demoEmail ? { emails: [demoEmail], texts: [], skippedTexts: [], demo: false } : { emails: [], texts: [], skippedTexts: [], demo: true };
  }
  const emails = [...new Set(contacts.map((c) => c.email).filter((e): e is string => Boolean(e)))];
  const texts: PagePlan['texts'] = [];
  const skippedTexts: PagePlan['skippedTexts'] = [];
  const from = toUsE164(env.AVA_BOOKING_SMS_FROM);
  const configured = Boolean(from && env.TWILIO_ACCOUNT_SID?.trim() && env.TWILIO_AUTH_TOKEN?.trim());
  for (const c of contacts) {
    if (!c.phone) continue;
    if (!pagingSmsEnabled(env)) skippedTexts.push({ to: c.phone, reason: 'disabled' });
    else if (!configured) skippedTexts.push({ to: c.phone, reason: 'not_configured' });
    else if (!c.smsConsent) skippedTexts.push({ to: c.phone, reason: 'no_consent' });
    else texts.push({ to: c.phone, from });
  }
  return { emails, texts, skippedTexts, demo: false };
}

export function pageSmsBody(input: PageInput) {
  const s = (v: string, n: number) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
  return `URGENT from Ava (${s(input.businessName, 30)}): ${s(input.issue, 70) || 'emergency call'}. ${s(input.callerName, 30) || 'Caller'} ${s(input.callerPhone, 20)}${input.address ? `, ${s(input.address, 50)}` : ''}. Please call back now.`;
}

export function pageEmailSubject(input: PageInput) {
  return `URGENT page from Ava: ${input.issue ? input.issue.slice(0, 60) : 'emergency call'}${input.callerName ? ` — ${input.callerName}` : ''}`;
}

export function pageEmailHtml(input: PageInput, escape: (s: string) => string) {
  const why =
    input.reason === 'transfer_unanswered'
      ? 'Ava tried to connect this emergency caller and nobody picked up.'
      : 'Ava took an emergency call that needs the on-call person.';
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17211b"><h1 style="font-size:20px;color:#b42318">Emergency page from Ava</h1><p>${escape(why)} The caller was told the on-call team has been paged and will call back. No arrival time was promised.</p><table style="border-collapse:collapse;width:100%"><tr><td><b>Caller</b></td><td>${escape(input.callerName || 'Not provided')}</td></tr><tr><td><b>Phone</b></td><td>${escape(input.callerPhone || 'Not provided')}</td></tr><tr><td><b>Address</b></td><td>${escape(input.address || 'Not provided')}</td></tr><tr><td><b>Problem</b></td><td>${escape(input.issue || 'Not provided')}</td></tr></table><p>Business: ${escape(input.businessName)}</p></div>`;
}

export type PageResult = {
  paged: boolean;
  demo?: boolean;
  duplicate?: boolean;
  delivered: { email: number; sms: number };
  failed: number;
  message: string;
};

/** What Ava should say, given what actually went out. */
export function pageToolMessage(result: Omit<PageResult, 'message'>) {
  if (result.demo) {
    return 'Demo line: tell the caller that on a real line the on-call technician would be paged right now, and that you have their details. Never promise an arrival time.';
  }
  if (result.duplicate) return 'The on-call team was already paged on this call. Do not page again; reassure the caller.';
  if (result.paged) {
    return 'Paged. Tell the caller you have paged the on-call team with their details and someone will call them back as soon as possible. Never promise an arrival time.';
  }
  return 'The page did not go through. Do not say anyone was paged. Tell the caller their details are marked urgent for the team and someone will call back as soon as they can. Repeat safety steps if needed.';
}

export type PageDeps = {
  alreadyPaged: (conversationId: string) => Promise<boolean>;
  sendEmail: (to: string[], subject: string, html: string) => Promise<void>;
  sendSms: (to: string, from: string, body: string) => Promise<{ sid?: string; error?: string }>;
  record: (entry: { conversationId: string; plan: PagePlan; delivered: PageResult['delivered']; failed: number; input: PageInput }) => Promise<void>;
  escape: (s: string) => string;
};

export async function runPage(input: PageInput, contacts: OnCallContact[], env: PagingEnv, isDemo: boolean, deps: PageDeps): Promise<PageResult> {
  const plan = planPage(contacts, env, isDemo);
  if (plan.demo) {
    const r = { paged: false, demo: true, delivered: { email: 0, sms: 0 }, failed: 0 };
    return { ...r, message: pageToolMessage(r) };
  }
  if (input.conversationId && (await deps.alreadyPaged(input.conversationId).catch(() => false))) {
    const r = { paged: true, duplicate: true, delivered: { email: 0, sms: 0 }, failed: 0 };
    return { ...r, message: pageToolMessage(r) };
  }
  const delivered = { email: 0, sms: 0 };
  let failed = 0;
  if (plan.emails.length) {
    try {
      await deps.sendEmail(plan.emails, pageEmailSubject(input), pageEmailHtml(input, deps.escape));
      delivered.email = plan.emails.length;
    } catch (error) {
      failed += plan.emails.length;
      console.error('On-call email page failed', error instanceof Error ? error.message : error);
    }
  }
  for (const t of plan.texts) {
    try {
      const res = await deps.sendSms(t.to, t.from, pageSmsBody(input));
      if (res.error) failed += 1;
      else delivered.sms += 1;
    } catch {
      failed += 1;
    }
  }
  await deps.record({ conversationId: input.conversationId, plan, delivered, failed, input }).catch((error) =>
    console.error('Unable to record on-call page', error instanceof Error ? error.message : error),
  );
  const r = { paged: delivered.email + delivered.sms > 0, delivered, failed };
  return { ...r, message: pageToolMessage(r) };
}
