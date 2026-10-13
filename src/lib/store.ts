/**
 * Liten klient för Upstash Redis (REST) – sajtens enda lagring, används för
 * recensioner och för att komma ihåg när recensionsmejl ska skickas.
 *
 * Kopplas in i Vercel: Storage → Upstash for Redis → Connect. Då sätts
 * KV_REST_API_URL och KV_REST_API_TOKEN (eller UPSTASH_REDIS_REST_URL och
 * UPSTASH_REDIS_REST_TOKEN) automatiskt. Utan dem är recensionerna avstängda
 * och sajten säger det öppet.
 *
 * Endast server – importera aldrig från klientkod.
 */
type Env = Record<string, string | undefined>;

export type StoreConfig = { url: string; token: string };

/**
 * Vercel kan lägga ett eget prefix på variablerna (t.ex. STORAGE_KV_REST_API_URL),
 * så vi letar efter alla par som slutar på KV_REST_API_URL/_TOKEN eller
 * UPSTASH_REDIS_REST_URL/_TOKEN.
 */
const PAIRS = [
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
] as const;

export function storeConfig(env: Env = process.env): StoreConfig | null {
  for (const [urlSuffix, tokenSuffix] of PAIRS) {
    const keys = Object.keys(env)
      .filter((k) => k.endsWith(urlSuffix))
      .sort((a, b) => a.length - b.length); // Utan prefix först.
    for (const key of keys) {
      const url = env[key]?.trim();
      const token = env[key.slice(0, -urlSuffix.length) + tokenSuffix]?.trim();
      if (url && token && /^https?:\/\//.test(url)) return { url: url.replace(/\/+$/, ""), token };
    }
  }
  return null;
}

export class StoreError extends Error {}

type Arg = string | number;

/** Kör ett Redis-kommando, t.ex. `redis(["HSET", "reviews", id, json])`. */
export async function redis<T = unknown>(command: Arg[], config: StoreConfig | null = storeConfig()): Promise<T> {
  if (!config) throw new StoreError("Lagring är inte konfigurerad.");
  let response: Response;
  try {
    response = await fetch(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command.map(String)),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    throw new StoreError(`Lagringen svarade inte (${error instanceof Error ? error.name : "okänt fel"}).`);
  }
  let data: { result?: T; error?: string } | null = null;
  try {
    data = (await response.json()) as { result?: T; error?: string };
  } catch {
    data = null;
  }
  if (!response.ok || !data || data.error) {
    throw new StoreError(`Lagringen gav fel (HTTP ${response.status}${data?.error ? `: ${data.error.slice(0, 80)}` : ""}).`);
  }
  return data.result as T;
}
