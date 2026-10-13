/**
 * Lagring av recensioner och planerade recensionsmejl (Upstash Redis).
 *
 * Nycklar:
 *  - `reviews` (hash): id → recension (JSON). Alla recensioner sparas, även 1–3 stjärnor.
 *  - `review-invite-used:<referens>`: länken i recensionsmejlet går bara att använda en gång.
 *  - `review-requests` (sorted set): bokningsreferens → när mejlet ska skickas (ms).
 *  - `review-request:<referens>`: namn, e-post och tjänst för mejlet. Raderas när det har
 *    skickats, och försvinner av sig självt senast 14 dagar efter planerat utskick.
 *  - `review-request-sent:<referens>`: hindrar att samma kund får mejlet två gånger.
 *
 * Endast server.
 */
import { randomBytes } from "node:crypto";
import type { Review } from "@/lib/reviews";
import { redis, storeConfig } from "@/lib/store";

const REVIEWS = "reviews";
const REQUESTS = "review-requests";
const DAY = 86_400_000;

export const reviewsEnabled = () => storeConfig() !== null;

function parseReview(raw: unknown): Review | null {
  if (typeof raw !== "string") return null;
  try {
    const r = JSON.parse(raw) as Review;
    return r && typeof r.id === "string" && typeof r.rating === "number" && typeof r.text === "string" ? r : null;
  } catch {
    return null;
  }
}

/** Alla sparade recensioner, nyast först. */
export async function listReviews(): Promise<Review[]> {
  const flat = (await redis<string[]>(["HGETALL", REVIEWS])) ?? [];
  const out: Review[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    const r = parseReview(flat[i]);
    if (r) out.push(r);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addReview(input: Omit<Review, "id" | "createdAt">, now = Date.now()): Promise<Review> {
  const review: Review = { id: randomBytes(8).toString("base64url"), createdAt: now, ...input };
  await redis(["HSET", REVIEWS, review.id, JSON.stringify(review)]);
  return review;
}

/** Döljer en recension. Returnerar recensionen, eller `null` om den inte finns. */
export async function hideReview(id: string): Promise<Review | null> {
  const review = parseReview(await redis(["HGET", REVIEWS, id]));
  if (!review) return null;
  if (!review.hidden) {
    review.hidden = true;
    await redis(["HSET", REVIEWS, id, JSON.stringify(review)]);
  }
  return review;
}

/** Reserverar en inbjudningslänk. `false` om den redan har använts. */
export async function claimInvite(reference: string) {
  return (await redis(["SET", `review-invite-used:${reference}`, "1", "NX", "EX", 400 * 86400])) === "OK";
}
export async function releaseInvite(reference: string) {
  await redis(["DEL", `review-invite-used:${reference}`]);
}

/* ------------------------------------------------------- recensionsmejl */

export type ReviewRequest = { reference: string; name: string; email: string; service: string; date: string };

/** När mejlet skickas: dagen efter den bekräftade tiden (från kl. 06 UTC, dvs. morgonen). */
export function reviewRequestSendAt(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d + 1, 6);
}

/**
 * Planerar recensionsmejlet för en bekräftad bokning. Bekräftas samma bokning
 * igen (t.ex. ny tid) ersätts den tidigare planen.
 */
export async function scheduleReviewRequest(req: ReviewRequest, now = Date.now()) {
  const sendAt = reviewRequestSendAt(req.date);
  const ttlSeconds = Math.max(3600, Math.ceil((sendAt + 14 * DAY - now) / 1000));
  await redis(["SET", `review-request:${req.reference}`, JSON.stringify(req), "EX", ttlSeconds]);
  await redis(["ZADD", REQUESTS, sendAt, req.reference]);
  return sendAt;
}

/** Referenser vars mejl ska skickas nu (högst `limit`). */
export async function dueReviewRequests(now = Date.now(), limit = 40): Promise<string[]> {
  return (await redis<string[]>(["ZRANGEBYSCORE", REQUESTS, "-inf", now, "LIMIT", 0, limit])) ?? [];
}

export async function loadReviewRequest(reference: string): Promise<ReviewRequest | null> {
  const raw = await redis<string | null>(["GET", `review-request:${reference}`]);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReviewRequest;
  } catch {
    return null;
  }
}

/** Låser utskicket så att samma kund aldrig får mejlet två gånger. */
export async function claimReviewRequestSend(reference: string) {
  return (await redis(["SET", `review-request-sent:${reference}`, "1", "NX", "EX", 400 * 86400])) === "OK";
}
export async function releaseReviewRequestSend(reference: string) {
  await redis(["DEL", `review-request-sent:${reference}`]);
}

/** Tar bort planen och kundens uppgifter (efter utskick, eller om de saknas). */
export async function forgetReviewRequest(reference: string) {
  await redis(["ZREM", REQUESTS, reference]);
  await redis(["DEL", `review-request:${reference}`]);
}
