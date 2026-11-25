import { Elysia } from "elysia"
import { supabaseEntries } from "./lib/clients/supabase/supabase.client"
import {
  supabaseCtx,
  wrapElysia,
} from "./lib/clients/supabase/supabase-middleware"
import { errorHandler } from "./middleware/error"
import { presentationRoutes } from "./routes/presentations"

export const app = new Elysia()
  .use(errorHandler)
  .use(supabaseCtx<typeof supabaseEntries>())
  .use(presentationRoutes)

export type App = typeof app

export default {
  fetch: wrapElysia(supabaseEntries, (req) => app.handle(req)),
}
