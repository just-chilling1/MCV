export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
} as const;

/** Read-only GET responses — short private cache, safe for per-user data. */
export const PRIVATE_READ_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
} as const;
