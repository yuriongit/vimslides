import {
  PresentationDeleteSchema,
  PresentationInsertSchema,
  // PresentationPatchSchema,
} from "@vss/shared"
import { Elysia } from "elysia"
import { supabaseEntries } from "@/lib/clients/supabase/supabase.client"
import {
  supabaseCtx,
  wrapElysia,
} from "@/lib/clients/supabase/supabase-middleware"
import { ApiError, errorHandler } from "@/middleware/error"

export const app = new Elysia()
  .use(errorHandler)
  .use(supabaseCtx<typeof supabaseEntries>())
  .post(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase.from("presentations").insert({
        user_id: jwtClaims.sub,
        slide_count: 0,
        ...body,
      })

      console.error(error)
      if (error) throw new ApiError(Number(error.code), error.message)

      return { ok: true }
    },
    { body: PresentationInsertSchema },
  )
  .delete(
    "/presentations",
    async ({ body, supabase, jwtClaims }) => {
      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", body.id)
        .eq("user_id", jwtClaims.sub)

      if (error) throw new ApiError(Number(error.code), error.message)

      return { ok: true }
    },
    { body: PresentationDeleteSchema },
  )
  .get("/presentations", async ({ supabase, jwtClaims }) => {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("user_id", jwtClaims.sub)
      .order("created_at")
    if (error) throw error
    console.log(data)

    return data
  })
//   .patch(
//     "/presentations",
//     async ({ body, supabase, jwtClaims }) => {
//       const { error } = await supabase
//         .from("presentations")
//         .update(body.fields)
//         .eq("user_id", jwtClaims.sub)
//         .eq("id", body?.id)
// 
//       if (error) throw new ApiError(Number(error.code), error.message)
// 
//       return { ok: true }
//     },
//     { body: PresentationPatchSchema },
//   )

export type App = typeof app

export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
