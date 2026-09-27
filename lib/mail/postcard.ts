import QRCode from 'qrcode';

export type PostcardRecipient = {
  id: string;
  public_token: string;
  homeowner_name: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  current_image_url: string | null;
  current_image_source: string | null;
  after_image_url: string | null;
  review_status: string;
  mail_vendor_job_id: string | null;
};

export type PostcardCampaign = {
  name: string;
  business_name: string;
  business_phone: string | null;
  business_email: string | null;
};

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: string };

export function postcardEligibility(
  recipient: PostcardRecipient,
  streetViewAllowed: boolean,
): Eligibility {
  if (recipient.review_status !== 'approved') {
    return { eligible: false, reason: 'Creative needs human approval.' };
  }
  if (recipient.mail_vendor_job_id) {
    return { eligible: false, reason: 'A vendor job already exists for this recipient.' };
  }
  if (!recipient.current_image_url) {
    return { eligible: false, reason: 'A printable before image is required.' };
  }
  if (recipient.current_image_source === 'street_view' && !streetViewAllowed) {
    return {
      eligible: false,
      reason:
        'Street View printing is disabled by policy. Upload an owner/crew photo or explicitly enable licensed use.',
    };
  }
  return { eligible: true };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function renderPostcardHtml(input: {
  recipient: PostcardRecipient;
  campaign: PostcardCampaign;
  estimateUrl: string;
  size: '4x6' | '6x9';
}): Promise<{ front: string; back: string }> {
  const { recipient, campaign } = input;
  const qr = await QRCode.toDataURL(input.estimateUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 420,
  });
  const width = input.size === '4x6' ? '6in' : '9in';
  const height = input.size === '4x6' ? '4in' : '6in';
  const current = escapeHtml(recipient.current_image_url ?? '');
  const after = recipient.after_image_url ? escapeHtml(recipient.after_image_url) : null;
  const businessName = escapeHtml(campaign.business_name);
  const homeowner = escapeHtml(recipient.homeowner_name || 'Neighbor');
  const contact = escapeHtml(campaign.business_phone || campaign.business_email || '');
  const addressZoneWidth = input.size === '4x6' ? '3.2835in' : '4in';

  const shared = `
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: ${width}; height: ${height}; font-family: Arial, sans-serif; }
    </style>`;
  const front = `<!doctype html><html><head>${shared}</head><body>
    <main style="position:relative;width:100%;height:100%;overflow:hidden;background:#122b1d;color:white;">
      <div style="display:flex;width:100%;height:100%;">
        <section style="position:relative;width:${after ? '50%' : '100%'};height:100%;background:url('${current}') center/cover no-repeat;">
          <b style="position:absolute;left:.28in;top:.25in;padding:.08in .14in;background:rgba(10,35,22,.88);font-size:13px;letter-spacing:1px;">BEFORE</b>
        </section>
        ${after ? `<section style="position:relative;width:50%;height:100%;background:url('${after}') center/cover no-repeat;">
          <b style="position:absolute;right:.28in;top:.25in;padding:.08in .14in;background:rgba(10,35,22,.88);font-size:13px;letter-spacing:1px;">AFTER · CONCEPT</b>
        </section>` : ''}
      </div>
      <div style="position:absolute;left:.25in;right:.25in;bottom:.2in;padding:.14in .2in;background:rgba(10,35,22,.9);font-size:13px;">
        Illustrative project concept prepared for campaign review. Final scope and price require an on-site estimate.
      </div>
    </main></body></html>`;

  const back = `<!doctype html><html><head>${shared}</head><body>
    <main style="position:relative;width:100%;height:100%;padding:.4in;background:#f6f1e7;color:#173323;">
      <section style="width:${input.size === '4x6' ? '2.15in' : '3.6in'};">
        <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#397251;">A PROJECT IDEA FOR YOUR HOME</div>
        <h1 style="margin:.16in 0 .12in;font:700 ${input.size === '4x6' ? '25px' : '36px'} Georgia,serif;">${homeowner}, see what could be possible.</h1>
        <p style="font-size:14px;line-height:1.42;">Scan to view the campaign concept and request an estimate from ${businessName}.</p>
        <div style="display:flex;align-items:center;gap:.18in;margin-top:.18in;">
          <img src="${qr}" width="${input.size === '4x6' ? '110' : '150'}" height="${input.size === '4x6' ? '110' : '150'}" alt="Estimate QR code" />
          <div><b style="font-size:15px;">Scan for your estimate page</b><br/><span style="font-size:11px;">${contact}</span></div>
        </div>
      </section>
      <div aria-label="Lob postal address and barcode clear zone" style="position:absolute;right:1.33in;bottom:1.69in;width:${addressZoneWidth};height:2.375in;background:white;"></div>
      <div style="position:absolute;left:.4in;bottom:.2in;font-size:10px;color:#53645a;">Prepared by ${businessName} · No work has been performed or promised.</div>
    </main></body></html>`;

  return { front, back };
}
