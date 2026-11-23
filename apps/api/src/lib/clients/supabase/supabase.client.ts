import { withCors } from "@supabase/middleware/cors"
import { withSupabaseClient } from "@supabase/server/middleware/client"
import { withRequiredClaims } from "@supabase/server/middleware/required-claims"
import type { Database } from "../../../types/database.types"

export const supabaseEntries = [
  withCors({
    // biome-ignore lint: ...
    origin: [process.env.FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  withRequiredClaims(),
  withSupabaseClient<Database>(),
] as const
