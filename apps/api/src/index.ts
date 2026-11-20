import { cors } from "@elysiajs/cors"
import { PresentationInsertionSchema } from "@vss/shared"
import { Elysia } from "elysia"
import { supabase } from "@/lib/supabase/client"
// import { createUserSchema } from "@vss/shared";

export const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:3001",
      preflight: true,
      methods: "*",
    }),
  )
  .post(
    "/presentations",
    async ({ body, status }) => {
      const { error } = await supabase
        .from("presentations")
        .insert(body)
        .eq("user_id", body.user_id)
        

      if (error) {
        console.error(error)
        const code = Number(error.code.replace("42", ""))
        return status(code, {
          message: error.message,
        })
      }

      return { ok: true }
    },
    { body: PresentationInsertionSchema },
  )
  // .get("/presentations", async ({ body: req }) => {
  //   const { data, error } = await supabase
  //     .from("presentations")
  //     .select("*")
  //     .eq("user_id", req?.user_id)
  //   if (error) return error.message
  // })
  .listen(3000)

export type App = typeof app
