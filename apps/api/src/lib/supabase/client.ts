import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

export function createClient() {
  return createSupabaseClient<Database>(
    // biome-ignore-start lint: ...
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    // biome-ignore-end lint: ...
    {
      auth: {
        flowType: "pkce",
      },
    },
  )
}

export const supabase = createClient()
