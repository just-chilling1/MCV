import { supabase } from "@/lib/supabase";

/** Browser Supabase client used by the article tools. */
export function createClient() {
  return supabase;
}
