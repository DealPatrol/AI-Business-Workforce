export type CaptureCandidate = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  doNotPhotograph: boolean;
};

export function distanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number {
  const radius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLng = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestCaptureCandidate(
  location: { latitude: number; longitude: number },
  candidates: CaptureCandidate[],
): { candidate: CaptureCandidate; distanceMeters: number } | null {
  const eligible = candidates.filter(
    (candidate) =>
      !candidate.doNotPhotograph &&
      candidate.latitude != null &&
      candidate.longitude != null,
  );
  let nearest: { candidate: CaptureCandidate; distanceMeters: number } | null = null;
  for (const candidate of eligible) {
    const distance = distanceMeters(location, {
      latitude: candidate.latitude!,
      longitude: candidate.longitude!,
    });
    if (!nearest || distance < nearest.distanceMeters) {
      nearest = { candidate, distanceMeters: distance };
    }
  }
  return nearest;
}
