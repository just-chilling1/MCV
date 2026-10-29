import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminSingleton: SupabaseClient | null = null

/** Service-role client for server-only operations (power-up grants, token validation). */
export function createAdminClient(): SupabaseClient {
  if (adminSingleton) return adminSingleton
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  adminSingleton = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return adminSingleton
}
