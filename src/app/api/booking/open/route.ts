/**
 * Öppnar en krypterad bokningslänk för sidan /hantera.
 *
 * Tar emot `{ token }` i en POST-body (aldrig i URL:en), kontrollerar och
 * dekrypterar den och returnerar förfrågans uppgifter. Inget sparas och
 * inga kunduppgifter loggas.
 */
import { openBookingToken, tokenError } from "@/lib/booking-token";
import { emailConfig, isSafeRecipient } from "@/lib/email";
import { clientIp, createRateLimiter, json, readJsonBody } from "@/lib/http";
import type { CustomerEmailStatus, OpenBookingResponse } from "@/lib/manage-booking";

// Körs i Node.js-runtime (standard i Next 16). `export const runtime` får inte anges när cacheComponents är på.

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 });

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

  const customerEmail: CustomerEmailStatus = !emailConfig().canEmailCustomers
    ? "not_configured"
    : isSafeRecipient(opened.data.email)
      ? "available"
      : "invalid_address";

  return json({
    ok: true,
    booking: opened.data,
    expiresAt: new Date(opened.expiresAt).toISOString(),
    customerEmail,
  } satisfies OpenBookingResponse);
}
