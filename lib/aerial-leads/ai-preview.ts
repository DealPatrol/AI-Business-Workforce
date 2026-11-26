/**
 * Optional AI "cleaned driveway" preview.
 *
 * OFF by default because image-model calls cost money per card. It only runs
 * when BOTH are set:
 *   AERIAL_LEADS_AI_PREVIEW=1
 *   OPENAI_API_KEY=...            (already used elsewhere in this app)
 * Optional: AERIAL_LEADS_IMAGE_MODEL (default gpt-image-1).
 *
 * Without them the free pixel simulation in scoring.ts is used and the card
 * badge says "Digital preview" instead of "AI preview".
 */

export function isAiPreviewEnabled(): boolean {
  return process.env.AERIAL_LEADS_AI_PREVIEW?.trim() === '1' && Boolean(process.env.OPENAI_API_KEY?.trim());
}

export type CleanedPreview = { image: Buffer; badge: 'AI preview' | 'Digital preview'; model: string | null };

/**
 * `maskPng` is white where the driveway is. OpenAI's edit endpoint edits the
 * transparent area of the mask, so it is converted here.
 */
export async function aiCleanedPreview(currentJpeg: Buffer, maskPng: Buffer, fallback: Buffer): Promise<CleanedPreview> {
  if (!isAiPreviewEnabled()) return { image: fallback, badge: 'Digital preview', model: null };
  const sharp = (await import('sharp')).default;
  const { default: OpenAI, toFile } = await import('openai');
  const model = process.env.AERIAL_LEADS_IMAGE_MODEL?.trim() || 'gpt-image-1';
  const size = 1024;
  const base = await sharp(currentJpeg).resize(size, size, { fit: 'fill' }).png().toBuffer();
  const maskGray = await sharp(maskPng).resize(size, size, { fit: 'fill' }).greyscale().raw().toBuffer();
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4 + 3] = maskGray[i] > 127 ? 0 : 255; // transparent = area to repaint
  }
  const mask = await sharp(rgba, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer();
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.images.edit({
      model,
      image: await toFile(base, 'aerial.png', { type: 'image/png' }),
      mask: await toFile(mask, 'mask.png', { type: 'image/png' }),
      prompt:
        'Top-down aerial photo. Make only the masked concrete driveway look freshly pressure washed: clean, even light-gray concrete with natural texture and joints. Keep everything else identical: same house, roof, lawn, trees, shadows, cars, lighting and camera angle. Photorealistic, no text.',
      size: '1024x1024',
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('image model returned no image');
    const meta = await sharp(currentJpeg).metadata();
    const image = await sharp(Buffer.from(b64, 'base64'))
      .resize(meta.width ?? size, meta.height ?? size, { fit: 'fill' })
      .jpeg({ quality: 88 })
      .toBuffer();
    return { image, badge: 'AI preview', model };
  } catch (error) {
    console.error('aerial-leads AI preview failed; using digital preview', error);
    return { image: fallback, badge: 'Digital preview', model: null };
  }
}
