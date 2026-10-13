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

export function storeConfig(env: Env = process.env): StoreConfig | null {
  const url = (env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL)?.trim();
  const token = (env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN)?.trim();
  if (!url || !token || !/^https?:\/\//.test(url)) return null;
  return { url: url.replace(/\/+$/, ""), token };
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
