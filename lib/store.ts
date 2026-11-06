import type { SearchResults } from "./types";

/**
 * In-memory stores. Survive hot reloads in dev via globalThis; on Vercel they
 * live per warm lambda instance, which is acceptable for V1 (cache is a cost
 * optimisation, not a correctness requirement). Swap for KV later if needed.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  value: SearchResults;
  expiresAt: number;
}

interface RateEntry {
  count: number;
  resetAt: number;
}

interface Stores {
  /** (location|category) -> results, 24h TTL */
  searchCache: Map<string, CacheEntry>;
  /** ip -> daily search count */
  rate: Map<string, RateEntry>;
}

const g = globalThis as unknown as { __lcfStores?: Stores };
const stores: Stores =
  g.__lcfStores ?? (g.__lcfStores = { searchCache: new Map(), rate: new Map() });

function sweep(map: Map<string, CacheEntry>) {
  const now = Date.now();
  for (const [k, v] of map) if (v.expiresAt < now) map.delete(k);
}

export function cacheKey(
  location: string,
  category: string,
  country: string,
): string {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return `${norm(country)}|${norm(location)}|${norm(category)}`;
}

export function getCachedSearch(key: string): SearchResults | null {
  sweep(stores.searchCache);
  return stores.searchCache.get(key)?.value ?? null;
}

export function setCachedSearch(key: string, value: SearchResults) {
  stores.searchCache.set(key, { value, expiresAt: Date.now() + DAY_MS });
}

const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_DAY ?? 3);

/** Returns true if this IP may run a fresh (non-cached) search, and counts it. */
export function consumeRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = stores.rate.get(ip);
  if (!entry || entry.resetAt < now) {
    stores.rate.set(ip, { count: 1, resetAt: now + DAY_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}
