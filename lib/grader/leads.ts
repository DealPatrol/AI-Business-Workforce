import { avaOwnerEmail, escapeHtml, sendResendEmail } from '@/lib/ava/mail';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AiCheckOutcome } from '@/lib/grader/ai-checks';
import type { GraderReport } from '@/lib/grader/audit';
import type { Competitor } from '@/lib/grader/competitors';

export const PUBLIC_CONTACT_EMAIL = 'hello@frontporchgrowth.com';

/** Resend's test inboxes (delivered@resend.dev etc.) mark QA runs: saved as tests, no owner alert. */
export function isTestEmail(email: string) {
  return /@resend\.dev$/i.test(email.trim());
}

/** Resend only sends from verified domains. Reuse the verified address with the Front Porch Growth name. */
function graderFromAddress() {
  const explicit = process.env.GRADER_FROM_EMAIL?.trim();
  if (explicit) return explicit;
  const raw = process.env.AVA_FROM_EMAIL?.trim() || 'onboarding@resend.dev';
  const address = raw.match(/<([^>]+)>/)?.[1] || raw;
  return `Front Porch Growth <${address}>`;
}

function graderResendApiKey() {
  return process.env.GRADER_RESEND_API_KEY ?? process.env.RESEND_API_KEY;
}

function graderCustomerReplyTo() {
  const explicit = process.env.GRADER_REPLY_TO?.trim();
  if (explicit) return explicit;
  return PUBLIC_CONTACT_EMAIL;
}

export async function saveReport(input: {
  email: string;
  report: GraderReport;
  ai: AiCheckOutcome;
  userAgent: string;
}): Promise<{ saved: boolean; id: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('visibility_grader_reports')
      .insert({
        email: input.email,
        website: input.report.input.website.slice(0, 500),
        final_url: input.report.finalUrl.slice(0, 500),
        trade: input.report.input.trade.slice(0, 80),
        city: input.report.input.city.slice(0, 120),
        score: input.report.score,
        checks: input.report.checks,
        facts: input.report.facts,
        ai_checks: input.ai.records,
        ai_check_status: input.ai.status === 'done' ? 'done' : 'queued',
        user_agent: input.userAgent.slice(0, 300),
        source: isTestEmail(input.email) ? 'ai-visibility grader (QA test)' : 'ai-visibility grader',
      })
      .select('id')
      .single();
    if (error) {
      console.error('grader save error', error.message);
      return { saved: false, id: null };
    }
    return { saved: true, id: String(data.id) };
  } catch (error) {
    console.error('grader save error', error instanceof Error ? error.message : error);
    return { saved: false, id: null };
  }
}

function statusWord(status: string) {
  return status === 'pass' ? 'Good' : status === 'warn' ? 'Could be better' : 'Missing';
}

function reportHtml(report: GraderReport, ai: AiCheckOutcome, competitors: Competitor[], competitorSource: string | null) {
  const fixes = report.fixes
    .slice(0, 6)
    .map((fix, index) => `<li style="margin:0 0 10px"><b>${index + 1}. ${escapeHtml(fix.label)}</b><br>${escapeHtml(fix.fix)}</li>`)
    .join('');
  const rows = report.checks
    .map(
      (check) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${escapeHtml(check.label)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${statusWord(check.status)}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#4c574f">${escapeHtml(check.found)}</td></tr>`,
    )
    .join('');
  const aiBlock =
    ai.status === 'done'
      ? `<h2 style="font-size:18px">AI recommendation check</h2><p style="color:#4c574f">${escapeHtml(ai.method)}</p><ul>${ai.records
          .map(
            (record) =>
              `<li><b>${escapeHtml(record.prompt)}</b> (${escapeHtml(record.engine)}, ${escapeHtml(record.model)}, ${escapeHtml(record.location)}, ${escapeHtml(record.checkedAt)}): ${record.mentioned ? 'you were mentioned' : 'you were not mentioned'}.</li>`,
          )
          .join('')}</ul>`
      : `<h2 style="font-size:18px">AI recommendation check</h2><p style="color:#4c574f">We have not run this yet. When we do, we will ask real AI assistants the questions your customers ask, record the engine, question, location, and date for each answer, and email you what they said. Nothing is simulated.</p>`;
  const compBlock = competitors.length
    ? `<h2 style="font-size:18px">Businesses showing up near you</h2><p style="color:#4c574f">${escapeHtml(competitorSource || '')}</p><ul>${competitors
        .map((c) => `<li>${escapeHtml(c.name)}${c.rating ? ` (${c.rating}★, ${c.reviews ?? 0} reviews)` : ''}</li>`)
        .join('')}</ul>`
    : '';
  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17211b">
<h1 style="font-size:22px">Your free visibility check: ${report.score}/100 (${report.grade})</h1>
<p style="color:#4c574f">${escapeHtml(report.finalUrl)} · ${escapeHtml(report.input.trade)} · ${escapeHtml(report.input.city)}</p>
<h2 style="font-size:18px">Fix these first</h2><ol style="padding-left:18px;list-style:none">${fixes || '<li>Nothing urgent. Nice work.</li>'}</ol>
${aiBlock}${compBlock}
<h2 style="font-size:18px">Everything we checked</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
<p style="color:#6a756c;font-size:13px">${report.method.map(escapeHtml).join(' ')}</p>
<p style="color:#6a756c;font-size:13px">No one can promise a ranking or an AI recommendation. This report shows what we found and what tends to help.</p>
<p>Questions? Just reply, or write ${PUBLIC_CONTACT_EMAIL}.<br>Cole, Front Porch Growth</p>
</div>`;
}

export async function sendReportEmails(input: {
  email: string;
  report: GraderReport;
  ai: AiCheckOutcome;
  competitors: Competitor[];
  competitorSource: string | null;
}): Promise<{ notified: boolean; emailed: boolean }> {
  const html = reportHtml(input.report, input.ai, input.competitors, input.competitorSource);
  let notified = false;
  let emailed = false;
  const test = isTestEmail(input.email);
  if (!test) {
    try {
      await sendResendEmail({
        to: avaOwnerEmail(),
        from: graderFromAddress(),
        replyTo: input.email,
        apiKey: graderResendApiKey(),
        subject: `New grader lead: ${input.report.input.trade} in ${input.report.input.city} (${input.report.score}/100)`,
        html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><p><b>${escapeHtml(input.email)}</b> ran the free AI visibility grader.</p><p>Website: ${escapeHtml(input.report.finalUrl)}<br>Trade: ${escapeHtml(input.report.input.trade)}<br>City: ${escapeHtml(input.report.input.city)}<br>AI check: ${input.ai.status === 'done' ? 'ran live' : 'queued, run it and email them'}</p><hr>${html}</div>`,
      });
      notified = true;
    } catch (error) {
      console.error('grader notify error', error instanceof Error ? error.message : error);
    }
  }
  try {
    await sendResendEmail({
      to: input.email,
      from: graderFromAddress(),
      replyTo: graderCustomerReplyTo(),
      apiKey: graderResendApiKey(),
      subject: `Your visibility check: ${input.report.score}/100`,
      html,
    });
    emailed = true;
  } catch (error) {
    console.error('grader report email error', error instanceof Error ? error.message : error);
  }
  return { notified, emailed };
}
