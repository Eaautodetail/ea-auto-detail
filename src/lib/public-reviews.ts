/**
 * Recensionerna som visas på sidan: bara 4–5 stjärnor och inte dolda.
 * Cachas och uppdateras direkt när en recension skickas eller döljs
 * (revalidateTag("reviews") i API:t), annars senast efter en timme.
 * Endast server.
 */
import { cacheLife, cacheTag } from "next/cache";
import { isPublic, type PublicReview } from "@/lib/reviews";
import { listReviews, reviewsEnabled } from "@/lib/reviews-store";

export const REVIEWS_TAG = "reviews";

export type PublicReviewData = { enabled: boolean; reviews: PublicReview[] };

export async function getPublicReviews(): Promise<PublicReviewData> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("hours");
  if (!reviewsEnabled()) return { enabled: false, reviews: [] };
  try {
    const reviews = (await listReviews())
      .filter(isPublic)
      .map(({ id, name, rating, text, service, verified, createdAt }) => ({ id, name, rating, text, service, verified, createdAt }));
    return { enabled: true, reviews };
  } catch (error) {
    console.error("[reviews] kunde inte läsa recensioner:", error instanceof Error ? error.message : "okänt fel");
    return { enabled: true, reviews: [] };
  }
}
