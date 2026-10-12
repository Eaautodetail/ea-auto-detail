/**
 * Små hjälpfunktioner för API-routerna (endast server).
 */
import { site } from "@/config/site";

/** JSON-svar som aldrig cachas (innehåller ofta personuppgifter eller engångsresultat). */
export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

/** Besökarens IP enligt proxyn framför appen (t.ex. Vercel). Används bara som nyckel för spärren. */
export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "okänd"
  );
}

/**
 * Enkel spärr mot spam och missbruk: högst `max` anrop per `windowMs` och nyckel.
 * Fungerar per serverinstans – byt mot t.ex. Upstash/Redis om sajten får mycket trafik.
 */
export function createRateLimiter({ windowMs, max, maxKeys = 5000 }: { windowMs: number; max: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  return function isLimited(key: string, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > maxKeys) hits.clear();
    return recent.length > max;
  };
}

/**
 * Sajtens publika adress för länkar i mejl. `site.url` används när den är en
 * riktig https-adress (då kan ingen styra länken via Host-headern), annars
 * förfrågans egen adress (t.ex. http://localhost:3000 under utveckling).
 */
export function publicOrigin(request: Request) {
  try {
    const configured = new URL(site.url);
    if (configured.protocol === "https:" && !/^(localhost|127\.|\[::1\])/.test(configured.hostname)) {
      return configured.origin;
    }
  } catch {
    // Ogiltig site.url – använd förfrågans adress.
  }
  return new URL(request.url).origin;
}

/** Läser en JSON-body med storleksgräns. Returnerar `null` om den saknas, är för stor eller inte är ett objekt. */
export async function readJsonBody(request: Request, maxBytes = 16 * 1024): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (!text || text.length > maxBytes) return null;
    const data: unknown = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
