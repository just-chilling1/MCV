import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

let cachedUser: User | null | undefined;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60_000;

/** Dedupe concurrent client-side auth lookups across Sidebar, dashboard widgets, etc. */
export async function getCachedClientUser(): Promise<User | null> {
  const now = Date.now();
  if (cachedUser !== undefined && now < cacheExpiresAt) {
    return cachedUser;
  }

  const { data: { user } } = await supabase.auth.getUser();
  cachedUser = user;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return user;
}

export function clearCachedClientUser(): void {
  cachedUser = undefined;
  cacheExpiresAt = 0;
}
