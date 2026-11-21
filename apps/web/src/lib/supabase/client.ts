import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/../database.types"

export function createClient() {
  return createSupabaseClient<Database>(
    // biome-ignore-start lint: ...
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    // biome-ignore-end lint: ...
    {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  )
}

export const supabase = createClient()
