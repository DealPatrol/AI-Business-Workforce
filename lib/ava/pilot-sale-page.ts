import { escapeHtml } from '@/lib/ava/mail';
import { PILOT_MONTHLY_CAP_CENTS, PILOT_SALE_CENTS, PILOT_TRIAL_DAYS } from '@/lib/ava/pilot-pricing';
import type { RecordPilotSaleResult } from '@/lib/ava/pilot-sales';

const dollars = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

function shell(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;background:#f4f1ea;color:#17211b;margin:0;padding:24px}main{max-width:520px;margin:32px auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 6px rgba(0,0,0,.08)}h1{font-size:22px;margin-top:0}table{border-collapse:collapse;width:100%;margin:12px 0}td{padding:4px 8px 4px 0;vertical-align:top}button{background:#17211b;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-size:16px;cursor:pointer}.fine{font-size:13px;color:#5a665e}</style></head><body><main>${body}</main></body></html>`;
}

export function pilotSaleDisclosure() {
  return `Confirming adds ${dollars(PILOT_SALE_CENTS)} for this booked job to your next Executive Receptionist invoice. Nothing is charged during your ${PILOT_TRIAL_DAYS}-day free trial, and your total monthly bill never exceeds ${dollars(PILOT_MONTHLY_CAP_CENTS)}.`;
}

export function renderConfirmPage(input: {
  token: string;
  callerName: string;
  need: string;
  businessName: string;
  alreadyBooked: boolean;
}) {
  const details = `<table><tr><td><b>Business</b></td><td>${escapeHtml(input.businessName || '—')}</td></tr><tr><td><b>Caller</b></td><td>${escapeHtml(input.callerName || 'Not provided')}</td></tr><tr><td><b>Need</b></td><td>${escapeHtml(input.need || 'Not provided')}</td></tr></table>`;
  if (input.alreadyBooked) {
    return shell(
      'Already marked as booked',
      `<h1>Already marked as booked</h1>${details}<p>This lead was already recorded as a booked job. Nothing more is needed, and you will not be charged twice.</p>`,
    );
  }
  return shell(
    'Mark as booked job',
    `<h1>Mark this lead as a booked job</h1>${details}<p>${escapeHtml(pilotSaleDisclosure())}</p><form method="POST" action="/api/ava/sales/booked"><input type="hidden" name="t" value="${escapeHtml(input.token)}"><button type="submit">Yes, I booked this job</button></form><p class="fine">If you did not book this job, close this page. Opening the link does not record anything.</p>`,
  );
}

export function renderResultPage(result: RecordPilotSaleResult) {
  if (!result.ok) {
    return shell(
      'Could not record the job',
      `<h1>We could not record this job</h1><p>${escapeHtml(result.message)}</p><p class="fine">Reply to the lead email or contact Front Porch Growth and we will fix it.</p>`,
    );
  }
  const { sale } = result;
  let line: string;
  switch (sale.billing_outcome) {
    case 'trial':
      line = `Recorded. There is no charge — you are still in your ${PILOT_TRIAL_DAYS}-day free trial.`;
      break;
    case 'capped':
      line = `Recorded. You have reached the ${dollars(PILOT_MONTHLY_CAP_CENTS)} monthly maximum, so there is no extra charge for this job.`;
      break;
    case 'partial_cap':
      line = `Recorded. ${dollars(sale.billed_cents)} was added to your next invoice (reduced so your monthly total stays at ${dollars(PILOT_MONTHLY_CAP_CENTS)}).`;
      break;
    case 'inactive':
      line = 'Recorded. Your subscription is not active, so no charge was added.';
      break;
    default:
      line = `Recorded. ${dollars(sale.billed_cents)} was added to your next invoice.`;
  }
  const pending = result.billingPending
    ? '<p>Your job is saved. The invoice charge did not finish — open the same link again in a few minutes to complete it. You will not be charged twice.</p>'
    : '';
  return shell(
    result.duplicate ? 'Already marked as booked' : 'Job recorded',
    `<h1>${result.duplicate ? 'Already marked as booked' : 'Thanks — job recorded'}</h1><p>${escapeHtml(result.duplicate ? 'This lead was already recorded as a booked job. You will not be charged twice.' : line)}</p>${pending}`,
  );
}

export function renderInvalidLinkPage() {
  return shell(
    'Link not valid',
    '<h1>This link is not valid</h1><p>It may have expired or been copied incorrectly. Use the button in the original lead email, or contact Front Porch Growth.</p>',
  );
}
