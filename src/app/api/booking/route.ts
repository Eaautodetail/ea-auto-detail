/**
 * Tar emot bokningsförfrågningar från formuläret på /boka.
 *
 * Förfrågan levereras via en eller båda av följande kanaler (se README):
 *  - E-post via Resend:  RESEND_API_KEY + BOOKING_EMAIL_TO + BOOKING_EMAIL_FROM
 *  - Webhook (t.ex. Make, Zapier, n8n eller Google Apps Script): BOOKING_WEBHOOK_URL
 *
 * Är ingen kanal konfigurerad svarar routen 503 och formuläret visar det
 * ärligt för besökaren – inga låtsasbekräftelser.
 *
 * Integritet: personuppgifter loggas aldrig och sparas inte på servern.
 */
import {
  bookingAsText,
  emptyBooking,
  priceSummary,
  todayInSweden,
  validateBooking,
  validatePhotos,
  type BookingFields,
} from "@/lib/booking";

type Photo = { filename: string; contentType: string; base64: string; size: number };

// Enkel spärr mot spam/missbruk. Fungerar per serverinstans – byt mot t.ex.
// Upstash/Redis om sajten får mycket trafik.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number) {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function makeReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "EA-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function sendEmail(fields: BookingFields, text: string, reference: string, photos: Photo[]) {
  const { RESEND_API_KEY, BOOKING_EMAIL_TO, BOOKING_EMAIL_FROM } = process.env;
  const { service } = priceSummary(fields.service, fields.arrangement);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: BOOKING_EMAIL_FROM,
      to: BOOKING_EMAIL_TO!.split(",").map((s) => s.trim()),
      ...(fields.contactMethod === "email" ? { reply_to: fields.contactValue } : {}),
      subject: `Bokningsförfrågan ${reference}: ${service?.name ?? fields.service} – ${fields.name}`,
      text,
      html: `<pre style="font-family:system-ui,sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
      attachments: photos.map((p) => ({ filename: p.filename, content: p.base64 })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend svarade ${res.status}`);
}

async function sendWebhook(fields: BookingFields, text: string, reference: string, photos: Photo[]) {
  const { service, arrangement, base, fee, total } = priceSummary(fields.service, fields.arrangement);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.BOOKING_WEBHOOK_SECRET) headers["X-Webhook-Secret"] = process.env.BOOKING_WEBHOOK_SECRET;
  const res = await fetch(process.env.BOOKING_WEBHOOK_URL!, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "booking_request",
      status: "unconfirmed",
      reference,
      receivedAt: new Date().toISOString(),
      customer: { name: fields.name, contactMethod: fields.contactMethod, contact: fields.contactValue },
      vehicle: fields.vehicle,
      service: { id: service?.id, name: service?.name, price: base },
      arrangement: { id: arrangement?.id, label: arrangement?.label, mobileFee: fee },
      location: fields.location || null,
      preferredDate: fields.date,
      preferredTime: fields.timeWindow,
      estimatedTotal: total,
      currency: "SEK",
      message: fields.message || null,
      summary: text,
      photos: photos.map((p) => ({ filename: p.filename, contentType: p.contentType, base64: p.base64 })),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Webhook svarade ${res.status}`);
}

export async function POST(request: Request) {
  const emailConfigured = !!(process.env.RESEND_API_KEY && process.env.BOOKING_EMAIL_TO && process.env.BOOKING_EMAIL_FROM);
  const webhookConfigured = !!process.env.BOOKING_WEBHOOK_URL;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "okänd";
  if (rateLimited(ip, Date.now())) {
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

  const fields = { ...emptyBooking };
  for (const key of Object.keys(emptyBooking) as (keyof BookingFields)[]) {
    const value = form.get(key);
    fields[key] = typeof value === "string" ? value.trim() : "";
  }

  const errors = validateBooking(fields, todayInSweden());
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const photoError = validatePhotos(files);
  if (photoError) errors.photos = photoError;
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, code: "validation", message: "Kontrollera de markerade fälten.", errors }, 422);
  }

  if (!emailConfigured && !webhookConfigured) {
    return json(
      {
        ok: false,
        code: "not_configured",
        message: "Bokningsformuläret är inte kopplat ännu, så förfrågan kunde inte skickas.",
      },
      503,
    );
  }

  const photos: Photo[] = await Promise.all(
    files.map(async (f, i) => ({
      filename: f.name?.replace(/[^\w.\-]/g, "_") || `bild-${i + 1}.jpg`,
      contentType: f.type || "application/octet-stream",
      size: f.size,
      base64: Buffer.from(await f.arrayBuffer()).toString("base64"),
    })),
  );

  const reference = makeReference();
  const text = bookingAsText(fields, reference, photos.length);

  const deliveries: Promise<void>[] = [];
  if (emailConfigured) deliveries.push(sendEmail(fields, text, reference, photos));
  if (webhookConfigured) deliveries.push(sendWebhook(fields, text, reference, photos));
  const results = await Promise.allSettled(deliveries);

  const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  // Logga bara tekniska fel – aldrig kundens uppgifter.
  failed.forEach((f) => console.error("[booking] leverans misslyckades:", f.reason instanceof Error ? f.reason.message : "okänt fel"));

  if (failed.length === results.length) {
    return json(
      { ok: false, code: "delivery_failed", message: "Förfrågan kunde inte skickas just nu. Försök igen om en stund." },
      502,
    );
  }

  return json({ ok: true, reference });
}
