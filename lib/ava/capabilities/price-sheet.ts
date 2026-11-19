/**
 * Per-client price and FAQ sheet. The owner approves the sheet; it becomes one knowledge-base
 * document on their agent, and the prompt allows Ava to say a dollar figure ONLY when it is written
 * in that sheet, exactly as written, with its conditions.
 */

export const PRICE_SHEET_DOC_PREFIX = 'Approved price and FAQ sheet';
export const MAX_PRICE_ITEMS = 40;
export const MAX_FAQS = 40;

export type PriceItem = { service: string; price: string; note?: string };
export type FaqItem = { q: string; a: string };

export type PriceSheet = {
  businessName: string;
  approvedBy: string;
  approvedOn: string; // YYYY-MM-DD
  prices: PriceItem[];
  faqs: FaqItem[];
  serviceArea?: string;
  payment?: string;
  financing?: string;
  warranty?: string;
};

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.replace(/[\r\t]+/g, ' ').replace(/[ ]{2,}/g, ' ').trim().slice(0, max) : '';
}

/** A dollar figure must look like money ("$89", "$89.00", "$1,200", "$89-$129"), or the row is dropped. */
const MONEY = /^\$\d{1,3}(,\d{3})*(\.\d{2})?( ?(-|to) ?\$\d{1,3}(,\d{3})*(\.\d{2})?)?( (and up|per hour|per visit|per unit|plus parts))?$/i;

export function cleanPriceSheet(raw: unknown): { ok: true; sheet: PriceSheet } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Price sheet is missing.' };
  const r = raw as Record<string, unknown>;
  const businessName = clean(r.businessName, 80);
  const approvedBy = clean(r.approvedBy, 80);
  const approvedOn = clean(r.approvedOn, 10);
  if (!businessName) return { ok: false, error: 'Business name is required.' };
  if (!approvedBy || !/^\d{4}-\d{2}-\d{2}$/.test(approvedOn)) {
    return { ok: false, error: 'The owner must approve the sheet (name and date) before Ava can quote from it.' };
  }
  const prices: PriceItem[] = [];
  for (const item of Array.isArray(r.prices) ? r.prices : []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const service = clean(row.service, 80);
    const price = clean(row.price, 40);
    if (!service || !MONEY.test(price)) continue;
    const note = clean(row.note, 160);
    prices.push({ service, price, ...(note ? { note } : {}) });
    if (prices.length >= MAX_PRICE_ITEMS) break;
  }
  const faqs: FaqItem[] = [];
  for (const item of Array.isArray(r.faqs) ? r.faqs : []) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const q = clean(row.q, 160);
    const a = clean(row.a, 400);
    if (!q || !a) continue;
    faqs.push({ q, a });
    if (faqs.length >= MAX_FAQS) break;
  }
  return {
    ok: true,
    sheet: {
      businessName,
      approvedBy,
      approvedOn,
      prices,
      faqs,
      serviceArea: clean(r.serviceArea, 300) || undefined,
      payment: clean(r.payment, 200) || undefined,
      financing: clean(r.financing, 200) || undefined,
      warranty: clean(r.warranty, 300) || undefined,
    },
  };
}

export function priceSheetDocName(businessName: string) {
  return `${PRICE_SHEET_DOC_PREFIX} — ${businessName}`.slice(0, 120);
}

/** The knowledge-base document text. Plain text, one fact per line, so retrieval and quoting stay exact. */
export function priceSheetDocument(sheet: PriceSheet) {
  const lines = [
    `${PRICE_SHEET_DOC_PREFIX} for ${sheet.businessName}.`,
    `Approved by ${sheet.approvedBy} on ${sheet.approvedOn}. These are the ONLY prices the receptionist may say.`,
    '',
    'APPROVED PRICES',
    ...(sheet.prices.length
      ? sheet.prices.map((p) => `- ${p.service}: ${p.price}${p.note ? ` (${p.note})` : ''}`)
      : ['- None. Do not quote any price.']),
  ];
  if (sheet.serviceArea) lines.push('', `SERVICE AREA: ${sheet.serviceArea}`);
  if (sheet.payment) lines.push(`PAYMENT METHODS: ${sheet.payment}`);
  if (sheet.financing) lines.push(`FINANCING: ${sheet.financing}`);
  if (sheet.warranty) lines.push(`WARRANTY: ${sheet.warranty}`);
  if (sheet.faqs.length) {
    lines.push('', 'FREQUENTLY ASKED QUESTIONS');
    for (const f of sheet.faqs) lines.push(`Q: ${f.q}`, `A: ${f.a}`);
  }
  return lines.join('\n');
}

/** Prompt rule. With a sheet: quote only what is written. Without one: never say a dollar figure. */
export function pricingPromptSection(hasSheet: boolean) {
  if (!hasSheet) {
    return `PRICES
There is no approved price sheet for this business. Never say any dollar figure, range or ballpark (not even "in the hundreds"). Say the office will confirm pricing, and offer to set up a visit or have the team call back.`;
  }
  return `PRICES AND FAQ (approved sheet)
Your knowledge base has the owner's "${PRICE_SHEET_DOC_PREFIX}". You may say a price ONLY if that exact service and dollar figure is written in the sheet. Say it exactly as written, with its note (for example "plus parts" or "waived if you go ahead with the repair"). If the caller asks about anything not on the sheet, or wants a total for a repair or replacement, never estimate, round, combine or guess: say a technician has to look first and the office will confirm. Never promise discounts, availability or arrival times that the sheet or your tools did not give you. Answer other questions from the sheet's FAQ, service area, payment and warranty lines; if it is not there, say the office will confirm.`;
}

/** True when every dollar figure in `text` appears in the sheet. Used by tests and the no-invented-prices check. */
export function onlyApprovedFigures(text: string, sheet: PriceSheet | null) {
  const figures = String(text).match(/\$\s?\d[\d,]*(\.\d{2})?/g) ?? [];
  if (figures.length === 0) return true;
  if (!sheet) return false;
  const allowed = new Set(
    sheet.prices.flatMap((p) => (p.price.match(/\$\s?\d[\d,]*(\.\d{2})?/g) ?? []).map((f) => f.replace(/\s/g, ''))),
  );
  return figures.every((f) => allowed.has(f.replace(/\s/g, '')));
}
