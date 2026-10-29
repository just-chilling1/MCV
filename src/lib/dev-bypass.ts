/** Local preview only — set DEV_BYPASS_AUTH=true in .env.local */

export function isLocalDevHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_BYPASS_AUTH === "true"
  );
}

/** Bypass only on localhost so a non-production deploy cannot become the service-role user. */
export function isDevAuthBypassActive(hostname: string): boolean {
  return isDevAuthBypassEnabled() && isLocalDevHost(hostname);
}

export const DEV_BYPASS_EMAIL =
  process.env.DEV_BYPASS_EMAIL ?? "dev-local@mobile-cash-vault.local";

export const DEV_BYPASS_PASSWORD = process.env.DEV_BYPASS_PASSWORD ?? "";
