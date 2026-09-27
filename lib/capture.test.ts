import { describe, expect, it } from 'vitest';
import { distanceMeters, nearestCaptureCandidate } from '@/lib/capture';

describe('crew capture matching', () => {
  it('matches the nearest geocoded unsuppressed address', () => {
    const result = nearestCaptureCandidate(
      { latitude: 34.7304, longitude: -86.5861 },
      [
        {
          id: 'far',
          latitude: 34.75,
          longitude: -86.6,
          doNotPhotograph: false,
        },
        {
          id: 'near',
          latitude: 34.7305,
          longitude: -86.5862,
          doNotPhotograph: false,
        },
      ],
    );
    expect(result?.candidate.id).toBe('near');
    expect(result?.distanceMeters).toBeLessThan(20);
  });

  it('never auto-matches a suppressed address', () => {
    const result = nearestCaptureCandidate(
      { latitude: 34.7304, longitude: -86.5861 },
      [
        {
          id: 'suppressed',
          latitude: 34.7304,
          longitude: -86.5861,
          doNotPhotograph: true,
        },
        {
          id: 'allowed',
          latitude: 34.731,
          longitude: -86.587,
          doNotPhotograph: false,
        },
      ],
    );
    expect(result?.candidate.id).toBe('allowed');
  });

  it('returns realistic meter distances', () => {
    expect(
      distanceMeters(
        { latitude: 34.7304, longitude: -86.5861 },
        { latitude: 34.7314, longitude: -86.5861 },
      ),
    ).toBeGreaterThan(100);
  });
});
