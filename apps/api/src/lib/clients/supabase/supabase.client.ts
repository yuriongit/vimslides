import type { Entry } from "@supabase/middleware"
import type { CorsContribution } from "@supabase/middleware/cors"
import { withCors } from "@supabase/middleware/cors"
import type { JWTClaims } from "@supabase/server"
import { withSupabaseClient } from "@supabase/server/middleware/client"
import { withRequiredClaims } from "@supabase/server/middleware/required-claims"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "../../../types/database.types"

type SupabaseEntries = readonly [
  Entry<{ cors: CorsContribution }>,
  Entry<{ jwtClaims: JWTClaims }>,
  Entry<{ supabase: SupabaseClient<Database> }>,
]

export const supabaseEntries: SupabaseEntries = [
  withCors({
    // biome-ignore lint: ...
    origin: [process.env.FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  withRequiredClaims(),
  withSupabaseClient<Database>(),
]
