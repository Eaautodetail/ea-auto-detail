/**
 * Gemensam validering för bokningsförfrågan. Används både i formuläret
 * (direkt feedback) och i API-routen (servern litar aldrig på klienten).
 */
import { getArrangement, getService, getTravelZone, site } from "@/config/site";

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
  contactMethod: string;
  contactValue: string;
  vehicle: string;
  service: string;
  date: string;
  timeWindow: string;
  arrangement: string;
  location: string;
  travelZone: string;
  message: string;
  consent: string;
};

export type BookingField = keyof BookingFields;
export type BookingErrors = Partial<Record<BookingField | "photos", string>>;

export const emptyBooking: BookingFields = {
  name: "",
  contactMethod: "phone",
  contactValue: "",
  vehicle: "",
  service: "",
  date: "",
  timeWindow: "",
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

export function locationRequired(arrangement: string) {
  return arrangement === "visit" || arrangement === "pickup";
}

export function validateField(field: BookingField, v: BookingFields, today: string): string | undefined {
  const value = (v[field] ?? "").trim();
  switch (field) {
    case "name":
      if (value.length < 2) return "Skriv ditt namn.";
      if (value.length > 100) return "Namnet är för långt.";
      return;
    case "contactMethod":
      if (!site.contactMethods.some((m) => m.id === value)) return "Välj hur vi ska kontakta dig.";
      return;
    case "contactValue": {
      if (!value) {
        const method = site.contactMethods.find((m) => m.id === v.contactMethod);
        return `Fyll i ${method ? method.inputLabel.toLowerCase() : "dina kontaktuppgifter"}.`;
      }
      if (v.contactMethod === "phone" || v.contactMethod === "sms") {
        const digits = value.replace(/\D/g, "");
        if (!/^[+\d][\d\s()-]*$/.test(value) || digits.length < 7 || digits.length > 15)
          return "Ange ett giltigt telefonnummer, t.ex. 070-123 45 67.";
      }
      if (v.contactMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
        return "Ange en giltig e-postadress.";
      if (v.contactMethod === "instagram" && !/^@?[A-Za-z0-9._]{1,30}$/.test(value))
        return "Ange ditt Instagram-användarnamn, t.ex. @dittnamn.";
      if (value.length > 120) return "För långt.";
      return;
    }
    case "vehicle":
      if (value.length < 2) return "Skriv bilens märke och modell, t.ex. Volvo V60.";
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
    case "timeWindow":
      if (!site.timeWindows.includes(value)) return "Välj ungefärlig tid.";
      return;
    case "arrangement":
      if (!getArrangement(value)) return "Välj hur vi ska göra med bilen.";
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
  "timeWindow",
  "vehicle",
  "name",
  "contactMethod",
  "contactValue",
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

/** Bygger en läsbar textsammanfattning av förfrågan (för e-post/webhook). */
export function bookingAsText(v: BookingFields, reference: string, photoCount: number) {
  const { service, arrangement, zone, base, fee, feeKnown, total } = priceSummary(v.service, v.arrangement, v.travelZone);
  const method = site.contactMethods.find((m) => m.id === v.contactMethod);
  const kr = (n: number) => `${n} kr`;
  return [
    `Ny bokningsförfrågan (${reference})`,
    `OBS: Förfrågan är inte bekräftad. Kontakta kunden för att bekräfta tid och pris.`,
    ``,
    `Namn: ${v.name}`,
    `Kontakt: ${method?.label ?? v.contactMethod} – ${v.contactValue}`,
    `Bil: ${v.vehicle}`,
    `Tjänst: ${service?.name ?? v.service} (${kr(base)})`,
    `Upplägg: ${arrangement?.label ?? v.arrangement}`,
    `Adress: ${v.location || "–"}`,
    ...(arrangement?.feeApplies
      ? [`Reseavgift: ${zone ? zone.label : "–"}${fee ? ` (+${kr(fee)})` : " – bekräfta utifrån adressen"}`]
      : []),
    `Önskad dag: ${v.date}, ${v.timeWindow}`,
    `Preliminärt pris: ${kr(total)}${feeKnown ? "" : arrangement?.feeApplies ? " + reseavgift (bekräftas)" : " + ev. avgift enligt överenskommelse"}`,
    `Bifogade bilder: ${photoCount}`,
    ``,
    `Meddelande:`,
    v.message || "–",
  ].join("\n");
}
