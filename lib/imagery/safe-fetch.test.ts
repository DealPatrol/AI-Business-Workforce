import { afterEach, describe, expect, it } from 'vitest';
import { assertAllowedImageUrl, ImageFetchBlockedError } from '@/lib/imagery/safe-fetch';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

describe('AI and print image fetch allowlist', () => {
  it('accepts only the configured Supabase Storage host', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    expect(
      assertAllowedImageUrl(
        'https://project.supabase.co/storage/v1/object/sign/yardproof-imagery/a/current.png',
      ).source,
    ).toBe('supabase_storage');
  });

  it('structurally blocks Google Street View and satellite URLs', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    expect(() =>
      assertAllowedImageUrl(
        'https://maps.googleapis.com/maps/api/streetview?size=640x640&key=secret',
      ),
    ).toThrow(ImageFetchBlockedError);
    expect(() =>
      assertAllowedImageUrl(
        'https://maps.googleapis.com/maps/api/staticmap?size=640x640&key=secret',
      ),
    ).toThrow(ImageFetchBlockedError);
  });
});
