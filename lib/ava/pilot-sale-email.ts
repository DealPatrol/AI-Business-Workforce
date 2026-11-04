import { appBaseUrl, escapeHtml } from '@/lib/ava/mail';
import { PILOT_MONTHLY_CAP_CENTS, PILOT_SALE_CENTS, PILOT_TRIAL_DAYS, isPilotPlanKey } from '@/lib/ava/pilot-pricing';
import { pilotSaleLinkSecret, pilotSaleLinkUrl, signPilotSaleToken } from '@/lib/ava/pilot-sale-link';

/**
 * "Mark as booked job" block for pilot-billing customers only. Standard plans get no block, so their
 * lead email is unchanged. Returns '' (and logs) when AVA_SALE_LINK_SECRET is not set, so a missing
 * secret never blocks the lead email itself.
 */
export function pilotBookedJobBlock(input: { plan: string | null | undefined; leadId: string; baseUrl?: string }) {
  if (!isPilotPlanKey(input.plan)) return '';
  const secret = pilotSaleLinkSecret();
  if (!secret) {
    console.error('AVA_SALE_LINK_SECRET is not set; pilot lead email is sent without a Mark as booked job link.');
    return '';
  }
  const url = pilotSaleLinkUrl(input.baseUrl ?? appBaseUrl(), signPilotSaleToken({ leadId: input.leadId, secret }));
  return `<div style="margin-top:24px;padding:16px;border:1px solid #d9d2c3;border-radius:8px"><p style="margin:0 0 12px"><b>Did you book this job?</b> Tap the button and confirm. It adds $${PILOT_SALE_CENTS / 100} to your next invoice (free during your ${PILOT_TRIAL_DAYS}-day trial; your monthly total never exceeds $${PILOT_MONTHLY_CAP_CENTS / 100}).</p><a href="${escapeHtml(url)}" style="display:inline-block;background:#17211b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Mark as booked job</a><p style="margin:12px 0 0;font-size:12px;color:#66736b">Opening the link shows a confirmation page. Nothing is recorded until you confirm there.</p></div>`;
}

