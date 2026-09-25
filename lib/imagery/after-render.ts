/**
 * After-image adapter — OpenAI-first with IMAGERY_PROVIDER hook.
 *
 * Product rules (Cole 2026-09-24):
 * - Input Current may be street_view (preferred) or crew_photo / owner_upload.
 * - Photoreal modest AL lawn refresh; same structure; $1–3k plant look.
 * - Human review gate is enforced by callers (review_status).
 */

import OpenAI, { toFile } from 'openai';
import catalog from '@/lib/catalogs/al-lawn-v1.json';

export type ImageryProvider = 'openai' | 'gemini';

export type AfterRenderInput = {
  currentBytes: Buffer;
  currentMimeType?: string;
  trade?: string;
  catalogSkus?: string[];
  budgetMax?: number;
  promptVersion?: string;
};

export type AfterRenderResult = {
  imageBytes: Buffer;
  mimeType: string;
  provider: ImageryProvider;
  model: string;
  promptVersion: string;
  plantPlan: {
    items: Array<{ id: string; commonName: string; qty: number; typicalUnitUsd: number }>;
    estimatedMaterialsUsd: number;
    notes: string;
  };
};

const DEFAULT_PROMPT_VERSION = 'al-lawn-v1';

export function getImageryProvider(): ImageryProvider {
  const raw = (process.env.IMAGERY_PROVIDER || 'openai').trim().toLowerCase();
  return raw === 'gemini' ? 'gemini' : 'openai';
}

export function isAfterRenderConfigured(provider = getImageryProvider()): boolean {
  if (provider === 'gemini') {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  }
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type CatalogItem = {
  id: string;
  commonName: string;
  category: string;
  typicalUnitUsd: number;
  defaultQty: number;
};

function pickPlantPlan(skuIds?: string[], budgetMax = catalog.budgetMaxUsd) {
  const items = catalog.items as CatalogItem[];
  const selected = (skuIds?.length
    ? items.filter((item) => skuIds.includes(item.id))
    : items.filter((item) =>
        ['boxwood_dwarf', 'hydrangea_oakleaf', 'daylily', 'liriope', 'mulch_dyed', 'edging_plastic', 'annual_color'].includes(
          item.id,
        ),
      )
  ).map((item) => ({
    id: item.id,
    commonName: item.commonName,
    qty: item.defaultQty,
    typicalUnitUsd: item.typicalUnitUsd,
  }));

  let estimated = selected.reduce((sum, row) => sum + row.qty * row.typicalUnitUsd, 0);
  // Trim qty if over budget
  while (estimated > budgetMax && selected.length) {
    const heaviest = selected.reduce((a, b) =>
      a.qty * a.typicalUnitUsd >= b.qty * b.typicalUnitUsd ? a : b,
    );
    if (heaviest.qty <= 1) break;
    heaviest.qty -= 1;
    estimated = selected.reduce((sum, row) => sum + row.qty * row.typicalUnitUsd, 0);
  }

  return {
    items: selected,
    estimatedMaterialsUsd: Math.round(estimated),
    notes:
      'Modest North Alabama curb-appeal refresh: trim existing hedges, edged beds, mulch, limited color. Not a luxury redesign.',
  };
}

function buildEditPrompt(plantPlan: AfterRenderResult['plantPlan'], promptVersion: string): string {
  const plantList = plantPlan.items
    .map((p) => `${p.qty}× ${p.commonName}`)
    .join(', ');

  return [
    'Edit this real front-yard photo into a photoreal AFTER shot of the SAME property.',
    'Keep the same camera angle, house structure, roof, siding color, windows, driveway, sidewalk, and neighbors.',
    'Apply a modest Alabama lawn / plant refresh only: neatly trimmed hedges, clean mow lines, edged beds, fresh mulched beds, limited seasonal color.',
    `Prefer these retail-style materials (~$${plantPlan.estimatedMaterialsUsd} materials look, max ~$3000): ${plantList}.`,
    'Do NOT add pools, large new trees, fountains, luxury hardscape, lighting systems, sky swaps, CGI gloss, mansion-garden density, or recolor the house.',
    'Daylight, natural photo look — not illustration or fantasy marketing CGI.',
    `Prompt version: ${promptVersion}.`,
  ].join(' ');
}

async function renderWithOpenAI(
  input: AfterRenderInput,
  plantPlan: AfterRenderResult['plantPlan'],
  promptVersion: string,
): Promise<Omit<AfterRenderResult, 'plantPlan'>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1';
  const openai = new OpenAI({ apiKey });
  const mime = normalizeInputMime(input.currentMimeType);
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const file = await toFile(input.currentBytes, `current.${ext}`, { type: mime });

  // gpt-image-* models ALWAYS return base64 (`b64_json`) and reject `response_format`
  // with a 400. Only legacy DALL·E models accept/need response_format.
  const isLegacyDalle = model.startsWith('dall-e');

  const result = await openai.images.edit({
    model,
    image: file,
    prompt: buildEditPrompt(plantPlan, promptVersion),
    size: '1024x1024',
    n: 1,
    ...(isLegacyDalle ? { response_format: 'b64_json' as const } : {}),
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI image edit returned no base64 image data.');
  }

  const imageBytes = Buffer.from(b64, 'base64');
  if (imageBytes.length < 100) {
    throw new Error('OpenAI image edit returned an empty image.');
  }

  return {
    imageBytes,
    mimeType: sniffImageMime(imageBytes),
    provider: 'openai',
    model,
    promptVersion,
  };
}

/** gpt-image-1 edit accepts png / jpeg / webp input. */
function normalizeInputMime(raw?: string): 'image/png' | 'image/jpeg' | 'image/webp' {
  const m = (raw || '').split(';')[0].trim().toLowerCase();
  if (m === 'image/png') return 'image/png';
  if (m === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

/** gpt-image-1 defaults to PNG output; sniff magic bytes to be safe. */
function sniffImageMime(bytes: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return 'image/png';
}

async function renderWithGemini(
  _input: AfterRenderInput,
  _plantPlan: AfterRenderResult['plantPlan'],
  _promptVersion: string,
): Promise<Omit<AfterRenderResult, 'plantPlan'>> {
  // Hook only — wire Gemini/Imagen when GEMINI_API_KEY + model are confirmed.
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  throw new Error(
    'IMAGERY_PROVIDER=gemini is not implemented yet. Set IMAGERY_PROVIDER=openai or omit it.',
  );
}

export async function renderAfter(input: AfterRenderInput): Promise<AfterRenderResult> {
  const promptVersion =
    input.promptVersion?.trim() ||
    process.env.AFTER_PROMPT_VERSION?.trim() ||
    DEFAULT_PROMPT_VERSION;
  const budgetMax = input.budgetMax ?? catalog.budgetMaxUsd;
  const plantPlan = pickPlantPlan(input.catalogSkus, budgetMax);
  const provider = getImageryProvider();

  const rendered =
    provider === 'gemini'
      ? await renderWithGemini(input, plantPlan, promptVersion)
      : await renderWithOpenAI(input, plantPlan, promptVersion);

  return { ...rendered, plantPlan };
}

export { catalog };
