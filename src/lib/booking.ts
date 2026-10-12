/**
 * Gemensam validering för bokningsförfrågan. Används både i formuläret
 * (direkt feedback) och i API-routen (servern litar aldrig på klienten).
 */
import { bookingTimes, getArrangement, getService, getTravelZone } from "@/config/site";

export const PHOTO_LIMITS = {
  maxFiles: 5,
  /** Max storlek per bild efter komprimering i webbläsaren. */
  maxBytesPerFile: 2.5 * 1024 * 1024,
  /** Håll totalen under ~4 MB så att det fungerar hos t.ex. Vercel (4,5 MB-gräns). */
  maxTotalBytes: 4 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};

export type BookingFields = {
  name: string;
  phone: string;
  email: string;
  /** Registreringsnummer eller bilmodell. */
  vehicle: string;
  service: string;
  date: string;
  /** Önskad starttid, t.ex. "10.00" eller "Flexibel" (se `bookingTimes()`). */
  time: string;
  arrangement: string;
  /** Adress där bilen står (mobil bilvård) eller ska hämtas (hämtning och lämning). */
  location: string;
  travelZone: string;
  message: string;
  consent: string;
};

export type BookingField = keyof BookingFields;
export type BookingErrors = Partial<Record<BookingField | "photos", string>>;

export const emptyBooking: BookingFields = {
  name: "",
  phone: "",
  email: "",
  vehicle: "",
  service: "",
  date: "",
  time: "",
  arrangement: "",
  location: "",
  travelZone: "",
  message: "",
  consent: "",
};

/** Dagens datum som ÅÅÅÅ-MM-DD i svensk tid. */
export function todayInSweden(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(now);
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Adress behövs för båda uppläggen (vi kommer till kunden eller hämtar bilen). */
export function locationRequired(arrangement: string) {
  return !!getArrangement(arrangement);
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(field: BookingField, v: BookingFields, today: string): string | undefined {
  const value = (v[field] ?? "").trim();
  switch (field) {
    case "name":
      if (value.length < 2) return "Skriv ditt namn.";
      if (value.length > 100) return "Namnet är för långt.";
      return;
    case "phone": {
      const digits = value.replace(/\D/g, "");
      if (!value) return "Fyll i ditt telefonnummer.";
      if (!/^[+\d][\d\s()-]*$/.test(value) || digits.length < 7 || digits.length > 15)
        return "Ange ett giltigt telefonnummer, t.ex. 070-123 45 67.";
      return;
    }
    case "email":
      if (!value) return "Fyll i din e-postadress.";
      if (value.length > 120 || !EMAIL_PATTERN.test(value)) return "Ange en giltig e-postadress, t.ex. namn@exempel.se.";
      return;
    case "vehicle":
      if (value.length < 2) return "Skriv registreringsnummer eller bilmodell, t.ex. ABC123 eller Volvo V60.";
      if (value.length > 100) return "För långt.";
      return;
    case "service":
      if (!getService(value)) return "Välj en tjänst.";
      return;
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Välj ett önskat datum.";
      // Servern tillåter en dags marginal bakåt för tidszonsskillnader.
      if (value < addDays(today, -1)) return "Datumet har redan passerat.";
      if (value > addDays(today, 365)) return "Välj ett datum inom ett år.";
      return;
    }
    case "time":
      if (!bookingTimes().includes(value)) return "Välj en önskad tid.";
      return;
    case "arrangement":
      if (!getArrangement(value)) return "Välj mobil bilvård eller hämtning och lämning.";
      return;
    case "location":
      if (locationRequired(v.arrangement) && value.length < 5) return "Skriv adressen där bilen står, t.ex. Storgatan 1, Kristianstad.";
      if (value.length > 120) return "Adressen är för lång.";
      return;
    case "travelZone":
      if (locationRequired(v.arrangement) && !getTravelZone(value)) return "Välj ungefär hur långt bort bilen står.";
      return;
    case "message":
      if (value.length > 1500) return "Meddelandet får vara högst 1 500 tecken.";
      return;
    case "consent":
      if (value !== "on" && value !== "true") return "Du behöver godkänna att vi hanterar dina uppgifter för att kunna svara dig.";
      return;
  }
}

export const fieldOrder: BookingField[] = [
  "service",
  "arrangement",
  "location",
  "travelZone",
  "date",
  "time",
  "vehicle",
  "name",
  "phone",
  "email",
  "message",
  "consent",
];

export function validateBooking(v: BookingFields, today: string): BookingErrors {
  const errors: BookingErrors = {};
  for (const field of fieldOrder) {
    const error = validateField(field, v, today);
    if (error) errors[field] = error;
  }
  return errors;
}

export function validatePhotos(files: { size: number; type: string }[]): string | undefined {
  if (files.length > PHOTO_LIMITS.maxFiles) return `Du kan bifoga högst ${PHOTO_LIMITS.maxFiles} bilder.`;
  if (files.some((f) => f.type && !PHOTO_LIMITS.acceptedTypes.includes(f.type)))
    return "Bara bilder (JPG, PNG, WEBP eller HEIC) kan bifogas.";
  if (files.some((f) => f.size > PHOTO_LIMITS.maxBytesPerFile)) return "En av bilderna är för stor.";
  if (files.reduce((s, f) => s + f.size, 0) > PHOTO_LIMITS.maxTotalBytes)
    return "Bilderna är för stora tillsammans. Ta bort någon bild och försök igen.";
}

/**
 * Prisöversikt för vald tjänst, upplägg och resezon.
 * `feeKnown` är `false` när reseavgiften inte kan räknas ut ännu (zon ej vald,
 * "vet inte" eller annat upplägg) – då bekräftar vi den manuellt.
 */
export function priceSummary(serviceId: string, arrangementId: string, travelZoneId = "") {
  const service = getService(serviceId);
  const arrangement = getArrangement(arrangementId);
  const zone = arrangement?.feeApplies ? getTravelZone(travelZoneId) : undefined;
  const fee = zone?.fee ?? 0;
  return {
    service,
    arrangement,
    zone,
    base: service?.price ?? 0,
    fee,
    feeKnown: !!arrangement && (!arrangement.feeApplies || zone?.fee != null),
    total: (service?.price ?? 0) + fee,
  };
}

/** Bygger en läsbar textsammanfattning av förfrågan (för mejl till företaget och webhook). */
export function bookingAsText(v: BookingFields, reference: string, photoCount: number) {
  const { service, arrangement, zone, base, fee, feeKnown, total } = priceSummary(v.service, v.arrangement, v.travelZone);
  const kr = (n: number) => `${n} kr`;
  return [
    `Ny bokningsförfrågan (${reference})`,
    `OBS: Förfrågan är inte bekräftad. Kontakta kunden för att bekräfta tid och pris.`,
    ``,
    `Namn: ${v.name}`,
    `Telefon: ${v.phone}`,
    `E-post: ${v.email}`,
    `Bil: ${v.vehicle}`,
    `Tjänst: ${service?.name ?? v.service} (${kr(base)})`,
    `Upplägg: ${arrangement?.label ?? v.arrangement}`,
    `Adress: ${v.location || "–"}`,
    `Reseavgift: ${zone ? zone.label : "–"}${fee ? ` (+${kr(fee)})` : " – bekräfta utifrån adressen"}`,
    `Önskad dag: ${v.date}, ${v.time === "Flexibel" ? "flexibel tid" : `kl. ${v.time}`}`,
    `Preliminärt pris: ${kr(total)}${feeKnown ? "" : " + reseavgift (bekräftas)"}`,
    `Bifogade bilder: ${photoCount}`,
    ``,
    `Meddelande:`,
    v.message || "–",
  ].join("\n");
}
