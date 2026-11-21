import { PresentationInsertionSchema } from "@vss/shared"
import { Elysia } from "elysia"
import { supabaseEntries } from "@/lib/supabase/client"
import { supabaseCtx, wrapElysia } from "./lib/supabase/supabase-middleware"

export const app = new Elysia().use(supabaseCtx<typeof supabaseEntries>()).post(
  "/presentations",
  async ({ body, supabase, jwtClaims }) => {
    const { error } = await supabase.from("presentations").insert({
      ...body,
      user_id: jwtClaims.sub,
    })

    if (error) {
      throw error
    }

    return { ok: true }
  },
  { body: PresentationInsertionSchema },
)

export type App = typeof app

export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
