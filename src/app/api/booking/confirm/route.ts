/**
 * Skickar en BEKRÄFTELSE till kunden när företaget har godkänt en tid.
 *
 * Anropas från sidan /hantera med `{ token, date, time, price, message }`.
 * Token kontrolleras igen här (den kan inte manipuleras), och mejlet går till
 * adressen som kunden angav i förfrågan – med Reply-To till företaget och en
 * dold kopia till företagets inkorg. Inget sparas och inga kunduppgifter loggas.
 */
import { todayInSweden } from "@/lib/booking";
import { openBookingToken, tokenError } from "@/lib/booking-token";
import { describeDeliveryError, emailConfig, isSafeRecipient, sendEmail } from "@/lib/email";
import { confirmationHeadline, customerConfirmationEmail } from "@/lib/email-templates";
import { clientIp, createRateLimiter, json, readJsonBody } from "@/lib/http";
import { validateConfirmation, type ConfirmBookingResponse } from "@/lib/manage-booking";
import { reviewsEnabled, scheduleReviewRequest } from "@/lib/reviews-store";

// Körs i Node.js-runtime (standard i Next 16; nodemailer kräver det). `export const runtime`
// får inte anges när cacheComponents är på.
export const maxDuration = 30;

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 });

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return json({ ok: false, code: "rate_limited", message: "För många försök. Vänta en stund och försök igen." }, 429);
  }

  const body = await readJsonBody(request);
  if (!body) return json({ ok: false, code: "bad_request", message: "Förfrågan kunde inte läsas." }, 400);

  const opened = openBookingToken(body.token);
  if (!opened.ok) {
    const { status, code, message } = tokenError(opened.reason);
    return json({ ok: false, code, message }, status);
  }
  const booking = opened.data;

  const { errors, value } = validateConfirmation(body, todayInSweden());
  if (!value) {
    return json({ ok: false, code: "validation", message: "Kontrollera de markerade fälten.", errors }, 422);
  }

  const mail = emailConfig();
  if (!mail.canEmailCustomers) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message: `E-post till kunder är inte konfigurerad ännu, så bekräftelsen kunde inte skickas. Ring eller sms:a kunden på ${booking.phone}.`,
      },
      503,
    );
  }
  if (!isSafeRecipient(booking.email)) {
    return json(
      {
        ok: false,
        code: "invalid_address",
        message: `Kundens e-postadress kan inte användas för automatiska mejl. Ring eller sms:a kunden på ${booking.phone}.`,
      },
      422,
    );
  }

  const email = customerConfirmationEmail(booking, value);
  const copyToBusiness = mail.canNotifyBusiness && mail.businessRecipients.length > 0;
  try {
    await sendEmail(
      {
        to: [booking.email],
        bcc: copyToBusiness ? mail.businessRecipients : undefined,
        replyTo: mail.businessReplyTo ?? undefined,
        ...email,
      },
      mail,
    );
  } catch (error) {
    console.error("[booking] bekräftelse kunde inte skickas:", describeDeliveryError(error));
    return json(
      {
        ok: false,
        code: "delivery_failed",
        message: `Bekräftelsen kunde inte skickas just nu. Försök igen om en stund, eller ring/sms:a kunden på ${booking.phone}.`,
      },
      502,
    );
  }

  // Recensionsmejl dagen efter den bekräftade tiden (skickas av /api/cron/review-requests).
  let reviewRequestPlanned = false;
  if (reviewsEnabled()) {
    try {
      await scheduleReviewRequest({
        reference: booking.reference,
        name: booking.name,
        email: booking.email,
        service: booking.service,
        date: value.date,
      });
      reviewRequestPlanned = true;
    } catch (error) {
      console.error("[booking] recensionsmejl kunde inte planeras:", error instanceof Error ? error.message : "okänt fel");
    }
  }

  return json({
    ok: true,
    sentTo: booking.email,
    headline: confirmationHeadline(value.date, value.time),
    copyToBusiness,
    reviewRequestPlanned,
  } satisfies ConfirmBookingResponse);
}
