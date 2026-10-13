/**
 * Skickar recensionsmejl dagen efter bokade tider. Körs automatiskt varje
 * morgon av Vercel Cron (se vercel.json). Varje kund får mejlet högst en gång,
 * och kundens uppgifter raderas när mejlet har skickats.
 *
 * Är CRON_SECRET satt i Vercel krävs den (Vercel skickar den automatiskt).
 * Utan den kan vem som helst starta körningen, men den skickar ändå bara mejl
 * som redan är planerade och aldrig något två gånger.
 */
import { connection } from "next/server";
import { describeDeliveryError, emailConfig, isSafeRecipient, sendEmail } from "@/lib/email";
import { reviewRequestEmail } from "@/lib/email-templates";
import { json, publicOrigin } from "@/lib/http";
import {
  claimReviewRequestSend,
  dueReviewRequests,
  forgetReviewRequest,
  loadReviewRequest,
  releaseReviewRequestSend,
  reviewsEnabled,
} from "@/lib/reviews-store";
import { signLink } from "@/lib/signed-link";

export const maxDuration = 60;

export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }
  if (!reviewsEnabled()) return json({ ok: true, sent: 0, note: "Lagring är inte konfigurerad." });
  const mail = emailConfig();
  if (!mail.canEmailCustomers) return json({ ok: true, sent: 0, note: "E-post till kunder är inte konfigurerad." });

  const origin = publicOrigin(request);
  let sent = 0;
  let failed = 0;
  for (const reference of await dueReviewRequests()) {
    const req = await loadReviewRequest(reference);
    if (!req || !isSafeRecipient(req.email)) {
      await forgetReviewRequest(reference);
      continue;
    }
    if (!(await claimReviewRequestSend(reference))) {
      await forgetReviewRequest(reference); // Redan skickat tidigare.
      continue;
    }
    const token = signLink("invite", { r: reference, n: req.name.split(/\s+/)[0]?.slice(0, 40) ?? "", s: req.service }, 60);
    const link = `${origin}/recensioner${token ? `#t=${token}` : "#skriv"}`;
    try {
      await sendEmail(
        { to: [req.email], replyTo: mail.businessReplyTo ?? undefined, ...reviewRequestEmail(req, link) },
        mail,
      );
      await forgetReviewRequest(reference);
      sent++;
    } catch (error) {
      // Försöker igen nästa morgon (uppgifterna raderas ändå senast 14 dagar efter planerat utskick).
      await releaseReviewRequestSend(reference).catch(() => {});
      console.error("[reviews] recensionsmejl kunde inte skickas:", describeDeliveryError(error));
      failed++;
    }
  }
  return json({ ok: true, sent, failed });
}
