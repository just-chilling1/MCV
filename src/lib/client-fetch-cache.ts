type CacheEntry = {
  data?: unknown;
  expiresAt: number;
  promise?: Promise<unknown>;
};

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 30_000;

function cacheKey(url: string, method = "GET"): string {
  return `${method}:${url}`;
}

/** Dedupe concurrent GET requests and reuse recent responses across navigations. */
export async function cachedClientFetch<T>(
  url: string,
  init?: RequestInit & { ttl?: number }
): Promise<T> {
  const method = init?.method ?? "GET";
  const ttl = init?.ttl ?? DEFAULT_TTL_MS;
  const key = cacheKey(url, method);
  const now = Date.now();
  const existing = cache.get(key);

  if (method === "GET" && existing && existing.data !== undefined && now < existing.expiresAt) {
    return existing.data as T;
  }

  if (existing?.promise) {
    return existing.promise as Promise<T>;
  }

  const promise = fetch(url, { cache: "no-store", ...init })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as T;
      if (method === "GET") {
        cache.set(key, { data, expiresAt: Date.now() + ttl });
      }
      return data;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    })
    .finally(() => {
      const entry = cache.get(key);
      if (entry?.promise === promise) {
        entry.promise = undefined;
      }
    });

  cache.set(key, {
    data: existing?.data,
    expiresAt: existing?.expiresAt ?? 0,
    promise,
  });

  return promise as Promise<T>;
}

export function invalidateClientFetchCache(urlPart?: string): void {
  if (!urlPart) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPart)) {
      cache.delete(key);
    }
  }
}
