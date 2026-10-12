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

/**
 * Besökarens IP enligt proxyn framför appen (t.ex. Vercel). Används bara som nyckel för spärren.
 * Vercel skriver över X-Forwarded-For med besökarens riktiga IP. Körs sajten bakom en
 * annan proxy som i stället lägger till adresser i slutet måste den här ändras, annars
 * kan besökaren själv välja sin nyckel.
 */
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
  // Nycklarna ligger i den ordning de senast användes (äldst först).
  const hits = new Map<string, number[]>();
  return function isLimited(key: string, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.delete(key);
    hits.set(key, recent);
    if (hits.size > maxKeys) {
      // Rensa först nycklar utan anrop i fönstret, sedan de som använts längst tillbaka.
      // (Tidigare nollställdes alla räknare, vilket gick att utnyttja med många falska nycklar.)
      for (const [k, times] of hits) {
        if (hits.size <= maxKeys) break;
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      for (const k of hits.keys()) {
        if (hits.size <= maxKeys) break;
        hits.delete(k);
      }
    }
    return recent.length > max;
  };
}

/**
 * Gemensam kvot för hela serverinstansen, t.ex. högst 20 automatiska kvitton i
 * timmen oavsett avsändare. `take()` returnerar `false` när kvoten är slut.
 */
export function createBudget(limits: { windowMs: number; max: number }[]) {
  const sent: number[] = [];
  const longest = Math.max(...limits.map((l) => l.windowMs));
  return {
    take(now = Date.now()) {
      while (sent.length && now - sent[0] >= longest) sent.shift();
      const full = limits.some((l) => sent.filter((t) => now - t < l.windowMs).length >= l.max);
      if (full) return false;
      sent.push(now);
      return true;
    },
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
