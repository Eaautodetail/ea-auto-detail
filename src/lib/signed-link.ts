/**
 * Signerade länkar (HMAC-SHA256) för recensioner – utan databas för själva länken.
 *
 *  - "invite": länken i mejlet dagen efter bokad tid. Recensionen markeras då som
 *    lämnad av en kund som har bokat hos oss.
 *  - "hide": länken i mejlet till oss om en ny recension, för att dölja den.
 *
 * Nyckeln härleds från samma hemligheter som bokningslänkarna (BOOKING_SECRET,
 * annars e-postlösenordet/nyckeln), med en egen HKDF-etikett per syfte.
 * Endast server.
 */
import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;
export type LinkPurpose = "invite" | "hide";

const SALT = Buffer.from("ea-auto-detail/signed-link/salt/v1", "utf8");
const SOURCES = ["BOOKING_SECRET", "SMTP_PASS", "GMAIL_APP_PASSWORD", "RESEND_API_KEY"] as const;

function keys(purpose: LinkPurpose, env: Env) {
  return SOURCES.flatMap((name) => {
    const secret = env[name]?.trim();
    return secret ? [Buffer.from(hkdfSync("sha256", secret, SALT, `ea-auto-detail/signed-link/v1/${purpose}/${name}`, 32))] : [];
  });
}

const sign = (key: Buffer, body: string) => createHmac("sha256", key).update(body).digest();

/** Skapar en signerad länkdel. `null` om inget nyckelmaterial finns. */
export function signLink(purpose: LinkPurpose, payload: Record<string, string | number>, maxAgeDays: number, now = Date.now(), env: Env = process.env) {
  const [key] = keys(purpose, env);
  if (!key) return null;
  const body = Buffer.from(JSON.stringify({ ...payload, x: now + maxAgeDays * 86_400_000 }), "utf8").toString("base64url");
  return `${body}.${sign(key, body).toString("base64url")}`;
}

/** Kontrollerar en signerad länkdel. Returnerar innehållet eller `null`. */
export function openLink(purpose: LinkPurpose, token: unknown, now = Date.now(), env: Env = process.env): Record<string, unknown> | null {
  if (typeof token !== "string" || token.length > 1024) return null;
  const [body, sig, ...rest] = token.trim().split(".");
  if (!body || !sig || rest.length || !/^[A-Za-z0-9_-]+$/.test(body) || !/^[A-Za-z0-9_-]+$/.test(sig)) return null;
  const given = Buffer.from(sig, "base64url");
  const valid = keys(purpose, env).some((key) => {
    const expected = sign(key, body);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!valid) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof data.x !== "number" || now > data.x) return null;
    return data;
  } catch {
    return null;
  }
}
