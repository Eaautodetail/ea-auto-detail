/**
 * Tar emot recensioner från formuläret på /recensioner.
 *
 * Alla recensioner sparas och visas på sidan. Företaget får ett mejl om varje
 * ny recension, med en länk för att dölja den om den är spam eller olämplig.
 *
 * Kommer recensionen via länken i recensionsmejlet (`invite`) markeras den
 * som lämnad av en kund som har bokat – länken fungerar en gång.
 */
import { revalidateTag } from "next/cache";
import { describeDeliveryError, emailConfig, sendEmail } from "@/lib/email";
import { newReviewBusinessEmail } from "@/lib/email-templates";
import { clientIp, createBudget, createRateLimiter, json, publicOrigin, readJsonBody } from "@/lib/http";
import { REVIEWS_TAG } from "@/lib/public-reviews";
import { cleanReviewText, isPublic, validateReview, type ReviewFields, type ReviewResponse } from "@/lib/reviews";
import { addReview, claimInvite, releaseInvite, reviewsEnabled } from "@/lib/reviews-store";
import { openLink, signLink } from "@/lib/signed-link";

export const maxDuration = 30;

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 4 });
/** Tak per serverinstans, oavsett avsändare – skyddar mot massinlägg. */
const budget = createBudget([
  { windowMs: 60 * 60 * 1000, max: 15 },
  { windowMs: 24 * 60 * 60 * 1000, max: 40 },
]);

const fail = (status: number, code: string, message: string, extra?: object) =>
  json({ ok: false, code, message, ...extra } satisfies ReviewResponse, status);

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return fail(429, "rate_limited", "Du har skickat flera recensioner på kort tid. Vänta en stund och försök igen.");
  }
  const body = await readJsonBody(request);
  if (!body) return fail(400, "bad_request", "Recensionen kunde inte läsas. Försök igen.");

  // Honeypot: fältet är dolt för människor. Fylls det i låtsas vi att allt gick bra.
  if (typeof body.company === "string" && body.company.trim()) return json({ ok: true } satisfies ReviewResponse);

  const fields: ReviewFields = {
    name: typeof body.name === "string" ? body.name : "",
    rating: typeof body.rating === "string" || typeof body.rating === "number" ? String(body.rating) : "",
    text: typeof body.text === "string" ? body.text : "",
    service: typeof body.service === "string" ? body.service : "",
    consent: body.consent === true,
  };
  const errors = validateReview(fields);
  if (Object.keys(errors).length) return fail(422, "validation", "Kontrollera de markerade fälten.", { errors });

  if (!reviewsEnabled()) {
    return fail(503, "not_configured", "Det går inte att lämna recensioner just nu. Försök igen senare eller skriv till oss i sociala medier.");
  }

  const invite = body.invite ? openLink("invite", body.invite) : null;
  const reference = invite && typeof invite.r === "string" ? invite.r : null;
  if (!reference && !budget.take()) {
    return fail(429, "busy", "Vi har fått många recensioner just nu. Försök igen om en stund.");
  }

  let claimed = false;
  try {
    if (reference) {
      claimed = await claimInvite(reference);
      if (!claimed) return fail(409, "invite_used", "Du har redan lämnat en recension via länken i mejlet. Tack!");
    }
    const review = await addReview({
      name: cleanReviewText(fields.name),
      rating: Number(fields.rating),
      text: cleanReviewText(fields.text, { multiline: true }),
      service: fields.service,
      verified: Boolean(reference),
    });
    revalidateTag(REVIEWS_TAG, { expire: 0 });

    const mail = emailConfig();
    if (mail.canNotifyBusiness && mail.businessRecipients.length) {
      const shown = isPublic(review);
      const hideToken = signLink("hide", { id: review.id }, 365);
      const hideLink = hideToken ? `${publicOrigin(request)}/recensioner/dolj#t=${hideToken}` : null;
      await sendEmail({ to: mail.businessRecipients, ...newReviewBusinessEmail(review, shown, hideLink) }, mail).catch((e) =>
        console.error("[reviews] mejl om ny recension kunde inte skickas:", describeDeliveryError(e)),
      );
    }
    return json({ ok: true } satisfies ReviewResponse);
  } catch (error) {
    if (claimed && reference) await releaseInvite(reference).catch(() => {});
    console.error("[reviews] kunde inte spara recension:", error instanceof Error ? error.message : "okänt fel");
    return fail(502, "store_failed", "Recensionen kunde inte sparas just nu. Försök igen om en stund.");
  }
}
