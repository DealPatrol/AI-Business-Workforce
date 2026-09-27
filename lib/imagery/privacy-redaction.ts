import sharp from 'sharp';

const VISION_ANNOTATE_URL = 'https://vision.googleapis.com/v1/images:annotate';

type Vertex = { x?: number; y?: number };
type NormalizedVertex = { x?: number; y?: number };
type BoundingPoly = {
  vertices?: Vertex[];
  normalizedVertices?: NormalizedVertex[];
};

type VisionResponse = {
  responses?: Array<{
    error?: { message?: string };
    faceAnnotations?: Array<{ boundingPoly?: BoundingPoly }>;
    textAnnotations?: Array<{ description?: string; boundingPoly?: BoundingPoly }>;
    localizedObjectAnnotations?: Array<{
      name?: string;
      score?: number;
      boundingPoly?: BoundingPoly;
    }>;
  }>;
};

type Rectangle = { left: number; top: number; width: number; height: number };

export type PrivacyRedactionResult = {
  bytes: Buffer;
  mimeType: 'image/png';
  provider: 'google-cloud-vision';
  details: {
    faceCount: number;
    textRegionCount: number;
    licensePlateCount: number;
    peopleDetected: boolean;
  };
};

function requireVisionKey(): string {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'GOOGLE_CLOUD_VISION_API_KEY is required. Privacy redaction fails closed before storage, AI, or print.',
    );
  }
  return key;
}

function rectangleFromVertices(
  vertices: Vertex[] | undefined,
  imageWidth: number,
  imageHeight: number,
): Rectangle | null {
  if (!vertices?.length) return null;
  const xs = vertices.map((vertex) => vertex.x ?? 0);
  const ys = vertices.map((vertex) => vertex.y ?? 0);
  return expandedRectangle(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
    imageWidth,
    imageHeight,
  );
}

function rectangleFromNormalizedVertices(
  vertices: NormalizedVertex[] | undefined,
  imageWidth: number,
  imageHeight: number,
): Rectangle | null {
  if (!vertices?.length) return null;
  const xs = vertices.map((vertex) => (vertex.x ?? 0) * imageWidth);
  const ys = vertices.map((vertex) => (vertex.y ?? 0) * imageHeight);
  return expandedRectangle(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
    imageWidth,
    imageHeight,
  );
}

function expandedRectangle(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  imageWidth: number,
  imageHeight: number,
): Rectangle | null {
  const padding = Math.max(8, Math.round(Math.max(maxX - minX, maxY - minY) * 0.12));
  const left = Math.max(0, Math.floor(minX - padding));
  const top = Math.max(0, Math.floor(minY - padding));
  const right = Math.min(imageWidth, Math.ceil(maxX + padding));
  const bottom = Math.min(imageHeight, Math.ceil(maxY + padding));
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top };
}

async function annotate(bytes: Buffer): Promise<VisionResponse> {
  const url = new URL(VISION_ANNOTATE_URL);
  url.searchParams.set('key', requireVisionKey());
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: bytes.toString('base64') },
          features: [
            { type: 'FACE_DETECTION', maxResults: 50 },
            { type: 'TEXT_DETECTION', maxResults: 200 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 50 },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Privacy detection HTTP ${response.status}.`);
  return response.json() as Promise<VisionResponse>;
}

export async function redactPrivateDetails(bytes: Buffer): Promise<PrivacyRedactionResult> {
  const normalized = await sharp(bytes).rotate().png().toBuffer();
  const metadata = await sharp(normalized).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Could not read image dimensions.');

  const payload = await annotate(normalized);
  const result = payload.responses?.[0];
  if (!result) throw new Error('Privacy detection returned no result.');
  if (result.error?.message) throw new Error(`Privacy detection failed: ${result.error.message}`);

  const faces = result.faceAnnotations ?? [];
  // Vision's first text annotation covers the entire OCR result. Blur each
  // individual annotation instead so unrelated image areas remain usable.
  const textRegions = (result.textAnnotations ?? []).slice(1);
  const objects = result.localizedObjectAnnotations ?? [];
  const plates = objects.filter(
    (object) => object.name?.trim().toLowerCase() === 'license plate',
  );
  const peopleDetected = objects.some(
    (object) => object.name?.trim().toLowerCase() === 'person',
  );
  const rectangles = [
    ...faces.map((face) =>
      rectangleFromVertices(
        face.boundingPoly?.vertices,
        metadata.width!,
        metadata.height!,
      ),
    ),
    ...textRegions.map((text) =>
      rectangleFromVertices(
        text.boundingPoly?.vertices,
        metadata.width!,
        metadata.height!,
      ),
    ),
    ...plates.map((plate) =>
      rectangleFromNormalizedVertices(
        plate.boundingPoly?.normalizedVertices,
        metadata.width!,
        metadata.height!,
      ),
    ),
  ].filter((rectangle): rectangle is Rectangle => rectangle !== null);

  const overlays = await Promise.all(
    rectangles.map(async (rectangle) => ({
      input: await sharp(normalized).extract(rectangle).blur(35).png().toBuffer(),
      left: rectangle.left,
      top: rectangle.top,
    })),
  );
  const redacted = await sharp(normalized).composite(overlays).png().toBuffer();

  return {
    bytes: redacted,
    mimeType: 'image/png',
    provider: 'google-cloud-vision',
    details: {
      faceCount: faces.length,
      textRegionCount: textRegions.length,
      licensePlateCount: plates.length,
      peopleDetected,
    },
  };
}
