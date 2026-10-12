/**
 * Förseglade (krypterade) bokningslänkar – utan databas.
 *
 * När en förfrågan kommer in packas kundens uppgifter i en token som krypteras
 * med AES-256-GCM. Token läggs i länken till /hantera i mejlet till företaget,
 * efter `#` (fragmentet), så den skickas aldrig till servern i URL:en och hamnar
 * inte i serverloggar. Sidan /hantera skickar token i en POST-body till
 * /api/booking/open och /api/booking/confirm, som dekrypterar och kontrollerar den.
 *
 * Nyckeln härleds med HKDF-SHA256 från BOOKING_SECRET. Saknas den används
 * SMTP_PASS eller RESEND_API_KEY (med en egen HKDF-etikett var), så att länkarna
 * fungerar direkt när e-post är konfigurerad. Sätt gärna BOOKING_SECRET: annars
 * slutar gamla länkar fungera om lösenordet/nyckeln byts.
 *
 * Endast server – importera aldrig från klientkod.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** Hur länge en hanteringslänk fungerar. */
export const BOOKING_TOKEN_MAX_AGE_DAYS = 60;
const MAX_AGE_MS = BOOKING_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
/** Tillåten klockskillnad framåt i tiden. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

const VERSION = "v1";
const SALT = Buffer.from("ea-auto-detail/booking-token/salt/v1", "utf8");
const AAD = Buffer.from("ea-auto-detail/booking-token/v1", "utf8");
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MAX_TOKEN_LENGTH = 4096;

/** Varifrån nyckeln härleds, i prioritetsordning. Varje källa har en egen HKDF-etikett. */
const KEY_SOURCES = [
  { env: "BOOKING_SECRET", info: "ea-auto-detail/booking-token/v1/booking-secret" },
  { env: "SMTP_PASS", info: "ea-auto-detail/booking-token/v1/derived-from-smtp-pass" },
  { env: "GMAIL_APP_PASSWORD", info: "ea-auto-detail/booking-token/v1/derived-from-gmail-app-password" },
  { env: "RESEND_API_KEY", info: "ea-auto-detail/booking-token/v1/derived-from-resend-api-key" },
] as const;

type Env = Record<string, string | undefined>;

export type BookingTokenData = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  /** Registreringsnummer eller bilmodell. */
  vehicle: string;
  service: string;
  arrangement: string;
  location: string;
  travelZone: string;
  /** Önskat datum (ÅÅÅÅ-MM-DD). */
  date: string;
  /** Önskad tid, t.ex. "10.00" eller "Flexibel". */
  time: string;
  /** Tjänstens pris när förfrågan skickades (SEK). */
  quotedBase: number;
  /** Reseavgiften som visades för kunden, `null` = bekräftas manuellt. */
  quotedFee: number | null;
  /** När förfrågan skickades (ms sedan 1970). */
  issuedAt: number;
};

export type OpenTokenResult =
  | { ok: true; data: BookingTokenData; expiresAt: number }
  | { ok: false; reason: "not_configured" | "invalid" | "expired" };

function keys(env: Env): Buffer[] {
  const out: Buffer[] = [];
  for (const source of KEY_SOURCES) {
    const secret = env[source.env]?.trim();
    if (secret) out.push(Buffer.from(hkdfSync("sha256", secret, SALT, source.info, 32)));
  }
  return out;
}

/** `true` om det finns nyckelmaterial för att skapa hanteringslänkar. */
export function bookingTokensAvailable(env: Env = process.env) {
  return keys(env).length > 0;
}

// Korta nycklar håller länken kort.
type Packed = {
  v: 1;
  r: string;
  n: string;
  e: string;
  p: string;
  c: string;
  s: string;
  a: string;
  l: string;
  z: string;
  d: string;
  t: string;
  b: number;
  f: number | null;
  i: number;
};

function pack(d: BookingTokenData): Packed {
  return {
    v: 1,
    r: d.reference,
    n: d.name,
    e: d.email,
    p: d.phone,
    c: d.vehicle,
    s: d.service,
    a: d.arrangement,
    l: d.location,
    z: d.travelZone,
    d: d.date,
    t: d.time,
    b: d.quotedBase,
    f: d.quotedFee,
    i: d.issuedAt,
  };
}

const STRING_LIMITS: Partial<Record<keyof Packed, number>> = {
  r: 32, n: 200, e: 254, p: 100, c: 200, s: 40, a: 40, l: 200, z: 40, d: 10, t: 20,
};

function unpack(raw: unknown): BookingTokenData | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (p.v !== 1) return null;
  for (const [key, max] of Object.entries(STRING_LIMITS)) {
    const value = p[key];
    if (typeof value !== "string" || value.length > max!) return null;
  }
  const isAmount = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 1_000_000;
  if (!isAmount(p.b) || !(p.f === null || isAmount(p.f))) return null;
  if (typeof p.i !== "number" || !Number.isFinite(p.i)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.d as string)) return null;
  return {
    reference: p.r as string,
    name: p.n as string,
    email: p.e as string,
    phone: p.p as string,
    vehicle: p.c as string,
    service: p.s as string,
    arrangement: p.a as string,
    location: p.l as string,
    travelZone: p.z as string,
    date: p.d as string,
    time: p.t as string,
    quotedBase: p.b as number,
    quotedFee: p.f as number | null,
    issuedAt: p.i as number,
  };
}

/**
 * Skapar en krypterad token för en bokningsförfrågan.
 * Returnerar `null` när inget nyckelmaterial är konfigurerat.
 */
export function sealBookingToken(
  data: Omit<BookingTokenData, "issuedAt">,
  now = Date.now(),
  env: Env = process.env,
): string | null {
  const [key] = keys(env);
  if (!key) return null;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(AAD);
  const plaintext = Buffer.from(JSON.stringify(pack({ ...data, issuedAt: now })), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${Buffer.concat([iv, ciphertext, tag]).toString("base64url")}`;
}

/**
 * Dekrypterar och kontrollerar en token. Manipulerade, felaktiga eller
 * för gamla tokens avvisas. Alla konfigurerade nycklar provas, så länkar
 * skapade innan BOOKING_SECRET lades till fortsätter att fungera.
 */
export function openBookingToken(token: unknown, now = Date.now(), env: Env = process.env): OpenTokenResult {
  const candidates = keys(env);
  if (candidates.length === 0) return { ok: false, reason: "not_configured" };
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) return { ok: false, reason: "invalid" };

  const [version, body, ...rest] = token.trim().split(".");
  if (version !== VERSION || !body || rest.length > 0 || !/^[A-Za-z0-9_-]+$/.test(body)) {
    return { ok: false, reason: "invalid" };
  }
  const bytes = Buffer.from(body, "base64url");
  // Bara den kanoniska kodningen godtas (inga varianter med andra "oanvända" bitar på slutet).
  if (bytes.length < IV_BYTES + TAG_BYTES + 2 || bytes.toString("base64url") !== body) {
    return { ok: false, reason: "invalid" };
  }
  const iv = bytes.subarray(0, IV_BYTES);
  const tag = bytes.subarray(bytes.length - TAG_BYTES);
  const ciphertext = bytes.subarray(IV_BYTES, bytes.length - TAG_BYTES);

  for (const key of candidates) {
    let plaintext: Buffer;
    try {
      const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_BYTES });
      decipher.setAAD(AAD);
      decipher.setAuthTag(tag);
      plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      continue; // Fel nyckel eller manipulerad token.
    }
    let data: BookingTokenData | null = null;
    try {
      data = unpack(JSON.parse(plaintext.toString("utf8")));
    } catch {
      data = null;
    }
    if (!data) return { ok: false, reason: "invalid" };
    if (data.issuedAt > now + CLOCK_SKEW_MS) return { ok: false, reason: "invalid" };
    const expiresAt = data.issuedAt + MAX_AGE_MS;
    if (now > expiresAt) return { ok: false, reason: "expired" };
    return { ok: true, data, expiresAt };
  }
  return { ok: false, reason: "invalid" };
}

/** HTTP-status, felkod och svensk text för en token som inte kunde öppnas. */
export function tokenError(reason: "not_configured" | "invalid" | "expired") {
  switch (reason) {
    case "not_configured":
      return {
        status: 503,
        code: "not_configured",
        message: "Hanteringslänkar är inte aktiverade på servern. Sätt BOOKING_SECRET eller konfigurera e-post (se README).",
      };
    case "expired":
      return {
        status: 410,
        code: "expired",
        message: `Länken har gått ut (den gäller i ${BOOKING_TOKEN_MAX_AGE_DAYS} dagar). Kontakta kunden direkt.`,
      };
    default:
      return {
        status: 400,
        code: "invalid_token",
        message: "Länken är ogiltig eller ofullständig. Öppna den igen från mejlet, och kontrollera att hela länken kom med.",
      };
  }
}

/** Länk till hanteringssidan. Token ligger i fragmentet (#) och når aldrig servern via URL:en. */
export function manageBookingUrl(origin: string, token: string) {
  return `${origin.replace(/\/+$/, "")}/hantera#t=${token}`;
}
