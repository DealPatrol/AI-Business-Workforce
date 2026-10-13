export type ScorePlace = { name: string; rating: number | null; reviews: number; address: string; type: string };

/** Transparent 0–100 score. Shown on the page with the math. */
export function reviewScore(you: ScorePlace, competitors: ScorePlace[]) {
  const ratingPts = Math.round(((you.rating ?? 0) / 5) * 50);
  const avg = competitors.length ? competitors.reduce((sum, place) => sum + place.reviews, 0) / competitors.length : 0;
  const volumePts = avg > 0 ? Math.round(Math.min(1, you.reviews / avg) * 40) : you.reviews > 0 ? 40 : 0;
  const bonus = (you.rating ?? 0) >= 4.5 && you.reviews >= 20 ? 10 : 0;
  return { score: ratingPts + volumePts + bonus, ratingPts, volumePts, bonus, competitorAvgReviews: Math.round(avg) };
}
