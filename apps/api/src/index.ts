import {
  PresentationDeletionSchema,
  PresentationInsertionSchema,
} from "@vss/shared"
import { Elysia } from "elysia"
import { supabaseEntries } from "@/lib/supabase/client"
import { supabaseCtx, wrapElysia } from "./lib/supabase/supabase-middleware"

export const app = new Elysia()
  .use(supabaseCtx<typeof supabaseEntries>())
  .post(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase.from("presentations").insert({
        ...body,
        user_id: jwtClaims.sub,
      })

      if (error) throw error

      return { ok: true }
    },
    { body: PresentationInsertionSchema },
  )
  .delete(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("user_id", jwtClaims.sub)
        .eq("id", body.id)

      if (error) throw error.message
      // if (data?.length === 1 || !data) {
      //   // This error handling will happen server side
      //   // Frontend will just perform `if (error) throw error`
      //   throw new Error(
      //     "Unauthorized: You do not have permission to perform this action.",
      //   )
      // }
    },
    { body: PresentationDeletionSchema },
  )

export type App = typeof app

export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
