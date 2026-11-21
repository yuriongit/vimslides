import type {
  AnyEntry,
  Contributions,
  FetchHandler,
  ValidateEntries,
} from "@supabase/middleware"
import { pipeline } from "@supabase/middleware"
import { Elysia } from "elysia"

type Handle<Entries extends readonly AnyEntry[]> = [
  ValidateEntries<Entries>,
] extends [true]
  ? (req: Request) => Response | Promise<Response>
  : ValidateEntries<Entries>

const HANDOFF = new WeakMap<Request, Record<string, unknown>>()

export function supabaseCtx<const Entries extends readonly AnyEntry[]>() {
  return new Elysia()
    .resolve((c) => {
      const contributions = HANDOFF.get(c.request)

      if (!contributions) {
        throw new Error(
          "supabaseCtx() ran without wrapElysia(). "
            + "Serve the app through wrapElysia(entries, (req) => app.handle(req)).",
        )
      }

      return contributions as Contributions<Entries>
    })
    .as("scoped")
}

export function wrapElysia<const Entries extends readonly AnyEntry[]>(
  entries: Entries,
  handle: Handle<Entries>,
): FetchHandler {
  const next = handle as (req: Request) => Response | Promise<Response>

  return pipeline(entries as readonly AnyEntry[], async (req, ctx) => {
    const contributions: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(ctx)) {
      contributions[key] = value
    }

    HANDOFF.set(req, contributions)

    try {
      return await next(req)
    } finally {
      HANDOFF.delete(req)
    }
  })
}
