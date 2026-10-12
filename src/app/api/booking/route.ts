/**
 * Tar emot bokningsförfrågningar från formuläret på /boka.
 *
 * Förfrågan levereras till företaget via en eller båda av (se README):
 *  - E-post: SMTP (t.ex. Gmail med applösenord) eller Resend – se src/lib/email.ts
 *  - Webhook (t.ex. Make, Zapier, n8n eller Google Apps Script): BOOKING_WEBHOOK_URL
 *
 * Därefter får kunden ett automatiskt KVITTO på att förfrågan har tagits emot
 * (inte en bekräftelse), om e-post till kunder är konfigurerad. Att kvittot inte
 * går iväg gör aldrig att förfrågan misslyckas – svaret säger bara
 * `customerEmailSent: false`. Antalet kvitton per serverinstans har ett tak
 * (`receiptBudget`) så att ingen kan använda formuläret för att skicka massutskick.
 *
 * Är ingen kanal till företaget konfigurerad svarar routen 503 och formuläret
 * visar det ärligt för besökaren – inga låtsasbekräftelser.
 *
 * Integritet: personuppgifter loggas aldrig och sparas inte på servern.
 */
import {
  bookingAsText,
  detectImageType,
  dropUnusedLocation,
  emptyBooking,
  priceSummary,
  todayInSweden,
  validateBooking,
  validatePhotos,
  type BookingFields,
} from "@/lib/booking";
import { manageBookingUrl, sealBookingToken } from "@/lib/booking-token";
import { DeliveryError, describeDeliveryError, emailConfig, isSafeRecipient, sendEmail, type EmailConfig } from "@/lib/email";
import {
  businessNotificationEmail,
  customerReceiptEmail,
  receiptFailedNotice,
  type CustomerReceiptStatus,
} from "@/lib/email-templates";
import { clientIp, createBudget, createRateLimiter, json, publicOrigin } from "@/lib/http";

// Körs i Node.js-runtime (standard i Next 16; nodemailer kräver det). `export const runtime`
// får inte anges när cacheComponents är på.
// Mejl till företaget + kvitto till kunden kan ta några sekunder var.
export const maxDuration = 30;

type Photo = { filename: string; contentType: string; content: Buffer; size: number };

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 });

/**
 * Tak för automatiska kvitton till kunder, per serverinstans och oavsett avsändare.
 * Skyddar företagets e-postkonto (t.ex. Gmails dagliga sändningsgräns) om någon
 * skickar många förfrågningar med andras adresser. Över taket kommer förfrågan
 * fortfarande fram till företaget, men kunden får inget kvitto.
 */
const receiptBudget = createBudget([
  { windowMs: 60 * 60 * 1000, max: 20 },
  { windowMs: 24 * 60 * 60 * 1000, max: 60 },
]);

const PHOTO_TYPE_ERROR = "Bara bilder (JPG, PNG, WEBP eller HEIC) kan bifogas.";

function makeReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "EA-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function notifyBusinessByEmail(
  config: EmailConfig,
  fields: BookingFields,
  reference: string,
  photos: Photo[],
  manageUrl: string | null,
  customerReceipt: CustomerReceiptStatus,
) {
  const email = businessNotificationEmail(fields, reference, photos.length, { manageUrl, customerReceipt });
  await sendEmail(
    {
      to: config.businessRecipients,
      // Svara direkt till kunden från mejlprogrammet.
      replyTo: isSafeRecipient(fields.email) ? fields.email : undefined,
      ...email,
      attachments: photos.map((p) => ({ filename: p.filename, content: p.content, contentType: p.contentType })),
    },
    config,
  );
}

async function notifyWebhook(fields: BookingFields, text: string, reference: string, photos: Photo[]) {
  const { service, arrangement, zone, base, fee, feeKnown, total } = priceSummary(
    fields.service,
    fields.arrangement,
    fields.travelZone,
  );
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.BOOKING_WEBHOOK_SECRET) headers["X-Webhook-Secret"] = process.env.BOOKING_WEBHOOK_SECRET;
  // Hanteringslänken (/hantera) skickas medvetet INTE hit – den ger tillgång till
  // kundens uppgifter och ska bara finnas i företagets inkorg.
  const res = await fetch(process.env.BOOKING_WEBHOOK_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "booking_request",
      status: "unconfirmed",
      reference,
      receivedAt: new Date().toISOString(),
      customer: { name: fields.name, phone: fields.phone, email: fields.email },
      vehicle: fields.vehicle,
      service: { id: service?.id ?? fields.service, name: service?.name ?? null, price: base },
      arrangement: { id: arrangement?.id ?? fields.arrangement, label: arrangement?.label ?? null },
      address: fields.location || null,
      // `null` när kunden lämnar bilen hos oss (ingen reseavgift).
      travel: arrangement?.feeApplies
        ? { zone: zone?.id ?? null, label: zone?.label ?? null, fee: feeKnown ? fee : null }
        : null,
      travelFee: feeKnown ? fee : null,
      preferredDate: fields.date,
      preferredTime: fields.time,
      estimatedTotal: total,
      feeConfirmed: feeKnown,
      currency: "SEK",
      message: fields.message || null,
      summary: text,
      photos: photos.map((p) => ({ filename: p.filename, contentType: p.contentType, base64: p.content.toString("base64") })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new DeliveryError(`Webhook svarade ${res.status}`);
}

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return json({ ok: false, code: "rate_limited", message: "För många förfrågningar. Vänta en stund och försök igen." }, 429);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, code: "bad_request", message: "Förfrågan kunde inte läsas." }, 400);
  }

  // Honeypot – riktiga besökare ser aldrig detta fält.
  if (String(form.get("company") ?? "").trim()) {
    return json({ ok: false, code: "rejected", message: "Förfrågan kunde inte skickas." }, 400);
  }

  const raw = { ...emptyBooking };
  for (const key of Object.keys(emptyBooking) as (keyof BookingFields)[]) {
    const value = form.get(key);
    raw[key] = typeof value === "string" ? value.trim() : "";
  }
  // Adress och avstånd sparas bara när vi åker till kunden.
  const fields = dropUnusedLocation(raw);

  const errors = validateBooking(fields, todayInSweden());
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photoError = validatePhotos(files);
  if (photoError) errors.photos = photoError;

  // Bilderna kontrolleras på innehållet, inte på filnamnet eller typen webbläsaren uppger.
  // Bilagorna får egna namn (bild-1.jpg …) så att inget annat än bilder kan skickas vidare.
  let photos: Photo[] = [];
  if (!photoError && files.length > 0) {
    const read = await Promise.all(
      files.map(async (f) => {
        const content = Buffer.from(await f.arrayBuffer());
        return { content, image: detectImageType(content) };
      }),
    );
    if (read.some((r) => !r.image)) errors.photos = PHOTO_TYPE_ERROR;
    else
      photos = read.map((r, i) => ({
        filename: `bild-${i + 1}.${r.image!.ext}`,
        contentType: r.image!.type,
        size: r.content.length,
        content: r.content,
      }));
  }

  if (Object.keys(errors).length > 0) {
    return json({ ok: false, code: "validation", message: "Kontrollera de markerade fälten.", errors }, 422);
  }

  const mail = emailConfig();
  const webhookConfigured = !!process.env.BOOKING_WEBHOOK_URL;
  if (!mail.canNotifyBusiness && !webhookConfigured) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message: "Bokningsformuläret är inte kopplat ännu, så förfrågan kunde inte skickas.",
      },
      503,
    );
  }

  const reference = makeReference();
  const text = bookingAsText(fields, reference, photos.length);
  const customerReceipt: CustomerReceiptStatus = !mail.canEmailCustomers
    ? "not_configured"
    : !isSafeRecipient(fields.email)
      ? "invalid_address"
      : !receiptBudget.take()
        ? "limited"
        : "sending";

  // Krypterad länk så att företaget kan bekräfta tiden från /hantera (ingen databas behövs).
  const { base, fee, feeKnown } = priceSummary(fields.service, fields.arrangement, fields.travelZone);
  const token = sealBookingToken({
    reference,
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    vehicle: fields.vehicle,
    service: fields.service,
    arrangement: fields.arrangement,
    location: fields.location,
    travelZone: fields.travelZone,
    date: fields.date,
    time: fields.time,
    quotedBase: base,
    quotedFee: feeKnown ? fee : null,
  });
  const manageUrl = token ? manageBookingUrl(publicOrigin(request), token) : null;

  const deliveries: Promise<void>[] = [];
  const businessEmail = mail.canNotifyBusiness
    ? notifyBusinessByEmail(mail, fields, reference, photos, manageUrl, customerReceipt)
    : null;
  if (businessEmail) deliveries.push(businessEmail);
  if (webhookConfigured) deliveries.push(notifyWebhook(fields, text, reference, photos));
  const results = await Promise.allSettled(deliveries);
  const businessEmailDelivered = !!businessEmail && results[0]?.status === "fulfilled";

  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  // Logga bara tekniska fel – aldrig kundens uppgifter.
  failed.forEach((f) => console.error("[booking] leverans till företaget misslyckades:", describeDeliveryError(f.reason)));

  if (failed.length === results.length) {
    return json(
      { ok: false, code: "delivery_failed", message: "Förfrågan kunde inte skickas just nu. Försök igen om en stund." },
      502,
    );
  }

  // Kvitto till kunden: att förfrågan är MOTTAGEN, inte bekräftad.
  let customerEmailSent = false;
  if (customerReceipt === "sending") {
    try {
      const receipt = customerReceiptEmail(fields, reference);
      await sendEmail(
        {
          to: [fields.email],
          replyTo: mail.businessReplyTo ?? undefined,
          ...receipt,
          headers: { "Auto-Submitted": "auto-generated" },
        },
        mail,
      );
      customerEmailSent = true;
    } catch (error) {
      console.error("[booking] kvitto till kunden kunde inte skickas:", describeDeliveryError(error));
      // Företagets mejl sa att ett kvitto skickas – meddela att det inte gick fram.
      if (businessEmailDelivered) {
        await sendEmail({ to: mail.businessRecipients, ...receiptFailedNotice(reference) }, mail).catch((e) =>
          console.error("[booking] meddelande om misslyckat kvitto kunde inte skickas:", describeDeliveryError(e)),
        );
      }
    }
  }

  return json({ ok: true, reference, customerEmailSent });
}
