/**
 * Döljer en recension från sidan. Anropas från /recensioner/dolj med den
 * signerade länken i mejlet till företaget. Recensionen finns kvar sparad.
 */
import { revalidateTag } from "next/cache";
import { clientIp, createRateLimiter, json, readJsonBody } from "@/lib/http";
import { REVIEWS_TAG } from "@/lib/public-reviews";
import { hideReview, reviewsEnabled } from "@/lib/reviews-store";
import { openLink } from "@/lib/signed-link";

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 });

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) return json({ ok: false, message: "För många försök. Vänta en stund." }, 429);
  const body = await readJsonBody(request);
  const data = openLink("hide", body?.token);
  if (!data || typeof data.id !== "string") {
    return json({ ok: false, message: "Länken är ogiltig eller har gått ut. Öppna den igen från mejlet." }, 400);
  }
  if (!reviewsEnabled()) return json({ ok: false, message: "Lagringen för recensioner är inte konfigurerad." }, 503);
  try {
    const review = await hideReview(data.id);
    if (!review) return json({ ok: false, message: "Recensionen finns inte längre." }, 404);
    revalidateTag(REVIEWS_TAG, { expire: 0 });
    return json({ ok: true, name: review.name, rating: review.rating });
  } catch (error) {
    console.error("[reviews] kunde inte dölja recension:", error instanceof Error ? error.message : "okänt fel");
    return json({ ok: false, message: "Det gick inte just nu. Försök igen om en stund." }, 502);
  }
}
