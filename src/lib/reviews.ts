/**
 * Recensioner – typer och validering. Används både i webbläsaren
 * (formuläret) och på servern (API:t). Inga hemligheter här.
 *
 * Alla recensioner sparas och visas på sidan, utom de som vi har dolt
 * (t.ex. spam eller olämpligt innehåll).
 */
import { site } from "@/config/site";

export const REVIEW_LIMITS = { nameMin: 2, nameMax: 40, textMin: 10, textMax: 800 } as const;

export type Review = {
  id: string;
  /** Namnet som visas, t.ex. "Anna" eller "Anna K." */
  name: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** Tjänstens id från site.services, eller "" om ingen valdes. */
  service: string;
  /** Lämnad via länken i mejlet efter en bokning hos oss. */
  verified: boolean;
  /** ms sedan 1970 */
  createdAt: number;
  /** Dold av oss (t.ex. spam). Visas aldrig. */
  hidden?: boolean;
};

/** Det som skickas till sidan – inga interna fält. */
export type PublicReview = Pick<Review, "id" | "name" | "rating" | "text" | "service" | "verified" | "createdAt">;

export type ReviewFields = { name: string; rating: string; text: string; service: string; consent: boolean };
export type ReviewField = keyof ReviewFields;
export type ReviewErrors = Partial<Record<ReviewField, string>>;

export type ReviewResponse =
  | { ok: true }
  | { ok: false; code: string; message: string; errors?: ReviewErrors };

export const isPublic = (r: Pick<Review, "hidden">) => !r.hidden;

/** Tar bort styrtecken, riktningsmarkeringar och onödiga mellanslag. */
export function cleanReviewText(value: string, { multiline = false } = {}) {
  const v = value.replace(/[‪-‮⁦-⁩‎‏]/g, "");
  return multiline
    ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : v.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|se|net|org|io|ru|xyz)\b)/i;

export function validateReviewField(field: ReviewField, v: ReviewFields): string | undefined {
  switch (field) {
    case "name": {
      const name = cleanReviewText(v.name);
      if (name.length < REVIEW_LIMITS.nameMin) return "Skriv ditt namn, t.ex. förnamn och första bokstaven i efternamnet.";
      if (name.length > REVIEW_LIMITS.nameMax) return `Namnet får vara högst ${REVIEW_LIMITS.nameMax} tecken.`;
      if (LINK.test(name) || /[@<>]/.test(name)) return "Skriv bara ditt namn.";
      return;
    }
    case "rating": {
      const n = Number(v.rating);
      if (!Number.isInteger(n) || n < 1 || n > 5) return "Välj 1–5 stjärnor.";
      return;
    }
    case "text": {
      const text = cleanReviewText(v.text, { multiline: true });
      if (text.length < REVIEW_LIMITS.textMin) return "Berätta med några ord hur det gick.";
      if (text.length > REVIEW_LIMITS.textMax) return `Recensionen får vara högst ${REVIEW_LIMITS.textMax} tecken.`;
      if (LINK.test(text)) return "Länkar kan inte vara med i en recension.";
      return;
    }
    case "service":
      if (v.service && !site.services.some((s) => s.id === v.service)) return "Välj en tjänst i listan.";
      return;
    case "consent":
      if (!v.consent) return "Du behöver godkänna att recensionen kan visas på hemsidan.";
      return;
  }
}

export const reviewFieldOrder: ReviewField[] = ["rating", "text", "name", "service", "consent"];

export function validateReview(v: ReviewFields): ReviewErrors {
  const errors: ReviewErrors = {};
  for (const f of reviewFieldOrder) {
    const e = validateReviewField(f, v);
    if (e) errors[f] = e;
  }
  return errors;
}

/** "oktober 2026" */
export function reviewMonth(ms: number) {
  return new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric", timeZone: "Europe/Stockholm" }).format(ms);
}

export const STAR_LABELS = ["", "Mycket dåligt", "Dåligt", "Okej", "Bra", "Mycket bra"] as const;
