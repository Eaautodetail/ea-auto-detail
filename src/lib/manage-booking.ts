/**
 * Gemensamt för sidan /hantera och API-routerna /api/booking/open och
 * /api/booking/confirm: typer och validering av den bekräftade tiden.
 * Får användas både i webbläsaren och på servern (inga hemligheter här).
 */
import type { BookingTokenData } from "@/lib/booking-token";

export type ManagedBooking = BookingTokenData;

/** Kan bekräftelsen mejlas till kunden härifrån? */
export type CustomerEmailStatus = "available" | "not_configured" | "invalid_address";

export type OpenBookingResponse =
  | { ok: true; booking: ManagedBooking; expiresAt: string; customerEmail: CustomerEmailStatus }
  | { ok: false; code: string; message: string };

export type ConfirmField = "date" | "time" | "price" | "message";
export type ConfirmErrors = Partial<Record<ConfirmField, string>>;

export type ConfirmBookingResponse =
  | { ok: true; sentTo: string; headline: string; copyToBusiness: boolean; reviewRequestPlanned: boolean }
  | { ok: false; code: string; message: string; errors?: ConfirmErrors };

export const CONFIRM_LIMITS = { messageMax: 1000, priceMax: 100_000 } as const;

/** "10:30", "10.30" eller "1030" → "10.30". Ogiltig tid → `null`. */
export function normalizeTime(value: string): string | null {
  const m = /^([01]?\d|2[0-3])\s*[:.]?\s*([0-5]\d)$/.exec(value.trim());
  return m ? `${m[1].padStart(2, "0")}.${m[2]}` : null;
}

/** Önskad tid från förfrågan ("10.00" / "Flexibel") som värde för <input type="time">. */
export function timeInputValue(time: string): string {
  const t = normalizeTime(time);
  return t ? t.replace(".", ":") : "";
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function isRealDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export type ConfirmedValues = { date: string; time: string; price: number; message: string };

/**
 * Kontrollerar ägarens bekräftelse. `today` = dagens datum (ÅÅÅÅ-MM-DD) i svensk tid.
 */
export function validateConfirmation(
  input: { date?: unknown; time?: unknown; price?: unknown; message?: unknown },
  today: string,
): { errors: ConfirmErrors; value: ConfirmedValues | null } {
  const errors: ConfirmErrors = {};
  const date = typeof input.date === "string" ? input.date.trim() : "";
  const timeRaw = typeof input.time === "string" ? input.time : "";
  const priceRaw = typeof input.price === "number" ? String(input.price) : typeof input.price === "string" ? input.price : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!isRealDate(date)) errors.date = "Välj datum.";
  else if (date < addDays(today, -1)) errors.date = "Datumet har redan passerat.";
  else if (date > addDays(today, 366)) errors.date = "Välj ett datum inom ett år.";

  const time = normalizeTime(timeRaw);
  if (!time) errors.time = "Ange en tid, t.ex. 10:00.";

  const priceDigits = priceRaw.replace(/\s|kr/gi, "");
  const price = /^\d+$/.test(priceDigits) ? Number(priceDigits) : NaN;
  if (!Number.isSafeInteger(price) || price <= 0) errors.price = "Ange priset i hela kronor, t.ex. 499.";
  else if (price > CONFIRM_LIMITS.priceMax) errors.price = "Priset verkar för högt – kontrollera beloppet.";

  if (message.length > CONFIRM_LIMITS.messageMax)
    errors.message = `Meddelandet får vara högst ${CONFIRM_LIMITS.messageMax} tecken.`;

  const ok = Object.keys(errors).length === 0;
  return { errors, value: ok ? { date, time: time!, price, message } : null };
}
