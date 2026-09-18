export type AvaLeadSmsResult = {
  sent: boolean;
  skipped?: boolean;
  sid?: string;
  error?: string;
};

/** True when Twilio lead-alert SMS can be attempted (all required env present). */
export function isAvaLeadSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER &&
      process.env.AVA_LEAD_SMS_TO,
  );
}

/**
 * Optional Twilio SMS for Ava lead / Sales qualify alerts.
 * No-ops cleanly when TWILIO_* / AVA_LEAD_SMS_TO are missing — email remains primary.
 * Uses Twilio REST via fetch (Basic auth); no SDK dependency.
 */
export async function sendAvaLeadSms(opts: {
  to?: string;
  body: string;
}): Promise<AvaLeadSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  const to = (opts.to || process.env.AVA_LEAD_SMS_TO || '').trim();
  const body = String(opts.body || '').trim().slice(0, 1600);

  if (!accountSid || !authToken || !from || !to || !body) {
    return {
      sent: false,
      skipped: true,
      error: 'Twilio SMS environment variables are not configured.',
    };
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };
    if (!response.ok) {
      const error = result?.message || `Twilio returned ${response.status}`;
      console.error('Ava lead SMS failed', error);
      return { sent: false, error };
    }
    return { sent: true, sid: result?.sid };
  } catch (error) {
    console.error('Ava lead SMS failed', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'SMS send failed',
    };
  }
}

export function formatAvaLeadSmsBody(lead: {
  caller_name?: string | null;
  caller_phone?: string | null;
  service_job_type?: string | null;
  business_name?: string | null;
}): string {
  const parts = [
    'New Ava lead',
    lead.caller_name,
    lead.service_job_type,
    lead.caller_phone,
    lead.business_name,
  ].filter(Boolean);
  return parts.join(' — ').slice(0, 320);
}

export function formatSalesQualifySmsBody(businessName: string): string {
  const name = String(businessName || 'Unknown business').trim() || 'Unknown business';
  return `Sales Ava qualify — ${name}`.slice(0, 320);
}
