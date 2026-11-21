import {
  PresentationDeletionSchema,
  PresentationInsertionSchema,
} from "@vss/shared"
import { Elysia } from "elysia"
import { supabaseEntries } from "@/lib/supabase/client"
import { ApiError, errorHandler } from "@/middleware/error"
import { supabaseCtx, wrapElysia } from "./lib/supabase/supabase-middleware"

export const app = new Elysia()
  .use(errorHandler)
  .use(supabaseCtx<typeof supabaseEntries>())
  .post(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase.from("presentations").insert({
        ...body,
        user_id: jwtClaims.sub,
      })

      console.error(error)
      if (error) throw new ApiError(Number(error.code), error.message)

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

      if (error) throw error
      // if (data?.length === 1 || !data) {
      //   // This error handling will happen server side
      //   // Frontend will just perform `if (error) throw error`
      //   throw new Error(
      //     "Unauthorized: You do not have permission to perform this action.",
      //   )
      // }
      return { ok: true }
    },
    { body: PresentationDeletionSchema },
  )

export type App = typeof app

export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
